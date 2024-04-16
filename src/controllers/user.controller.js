import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
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
export {registerUser}
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res