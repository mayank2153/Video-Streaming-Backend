import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating referesh and access token")
    }
}

const registerUser=asyncHandler(async (req,res)=>{
    // get user details from frontend
    const {userName,email, fullname, password}=req.body;
    console.log("email: " + email);
    // Check if any field is empty
    if([userName,email, fullname, password].some((field)=>field=="")){
        throw new ApiError(400,"All fields are required")
    }
    // Check if user with provided username or email already exists
    const existingUser = await User.findOne({
        $or: [{ userName: userName }, { email: email }]
    });
    if(existingUser){
        throw new ApiError(409,"User with same credentials already exists");
    }

    // check for images, check for avatar
    const avatarLocalPath=req.files?.avatar?.[0]?.path;
    const coverImageLocalPath=req.files?.coverImage?.[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }
    // upload them to cloudinary, avatar
    console.log(avatarLocalPath);
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }
    // create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        userName: userName.toLowerCase()
    })
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    // check for user creation
    if (!createdUser) {
        console.log(createdUser);
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    
    res.status(201).json(
        new ApiResponse(200,"User Created Successfully",createdUser)
    )
    

})
const loginUser=asyncHandler(async(req,res)=>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    const {userName,email,password}=req.body;
    if(!userName && !email){
        throw new ApiError(400, "username or email is required");
    }
    const user = await User.findOne({
        $or:[{userName},{email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist");
    }
    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken}=generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    // const loggedInUser = await loggedInUserQuery.exec(); // Execute the query to retrieve the user data
    // we have later used the await for the same

    console.log("Logged In User:", loggedInUser);
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options).
    json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User Logged in successfully"
        )
    )


})
// const logOutUser=asyncHandler(async(req,res)=>{
//     await User.findByIdAndUpdate(
//         req.user.id,
//         {
//             $set: {
//                 refreshToken:undefined
//             }
//         },
//         {
//             new: true
            // By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
//         }
//     )
//     const options = {
//         httpOnly: true,
//         secure: true
//     }

//     return res.status(200).
//     clearCookie("accessToken",accessToken).
//     clearCookie("refreshToken",refreshToken).
//     json(
//         new ApiResponse(
//             200,
//             {},
//             "User Logged Out"
//         )
//     )
// })
const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user.id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    // Clear cookies
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"));
});
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user=User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }

        const {newAccessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id);

        return res.status(200)
        .cookie("access_token",newAccessToken,options)
        .cookie("refresh_token",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken:newAccessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user= await User.findById(req.user?._id);
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError("400","Invalid Old Password");
    }
    user.password=newPassword;
    // we have made a presave function in model to hash the password if it is modified, so we dont need to do it here
    await user.save({
        validateBeforeSave:false,
    })

    return res.status(200)
    .json( new ApiResponse(200,{},"Password Changed Successfully"));
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"User fetched Successfully"));
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body;
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname:fullname,
                email:email
            }
        },
        {
            new:true,
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,user,"Account details updated successfully")
    )
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath = req?.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file not found");
    }
    const avatar= await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400,"Error uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar
            }
        },
        {
            new:true,
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )

})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req?.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file not found");
    }
    const coverImage= await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400,"Error uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage
            }
        },
        {
            new:true,
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "coverImage updated successfully")
    )

})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {userName}=req.params
    if(!userName){
        throw new ApiError(400," Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                userName: userName?.toLowerCase()
            },
            // lookup- Performs a left outer join to a collection in the same database to filter in documents from the "joined" collection for processing. The $lookup stage adds a new array field to each input document. The new array field contains the matching documents from the "joined" collection. The $lookup stage passes these reshaped documents to the next stage.
            $lookup : {
                from:"Subscription",
                localField: "_id",//source-user,destination-subscription
                foreignField: "Channel",
                as: "subscribers"
            },
            $lookup:{
                from:"Subscription",
                localField: "_id",
                foreignField: "Subscriber",
                as: "subscribedTo"
            },
            $addFields: {
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        $if: { $in: [req?.user?._id,"$subscribers.Subscriber"] },
                        then:true,
                        else:false
                    }
                }
            },
            $project:{
                userName: 1,
                email: 1,
                fullname  : 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    }
    return res.status(200)
    .json(
        new ApiResponse(200,channel[0], "User Channel fetched Successfully")
    )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req?.user?._id)
                }
            },
            {
                $lookup: {
                    from: "Video",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "User",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project:{
                                            fullname: 1,
                                            userName: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {registerUser,loginUser,logOutUser,refreshAccessToken, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage,getCurrentUser,getUserChannelProfile,getWatchHistory}
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res