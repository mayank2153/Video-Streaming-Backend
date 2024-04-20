import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


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
    if(!userName || !email){
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
    const loggesInUser= User.findById(user._id).select(
        "-password refresToken"
    )
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
                user: loggesInUser,accessToken,refreshToken
            },
            "User Logged in successfully"
        )
    )


})
const logOutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user.id,
        {
            $set: {
                refreshToken:undefined
            }
        },
        {
            new: true
            // By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).
    clearCookie("accessToken",accessToken).
    clearCookie("refreshToken",refreshToken).
    json(
        new ApiResponse(
            200,
            {},
            "User Logged Out"
        )
    )
})
export {registerUser,loginUser,logOutUser}
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res