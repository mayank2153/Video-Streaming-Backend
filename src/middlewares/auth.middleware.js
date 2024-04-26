import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

export const verifyJWT=asyncHandler(async(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        // The decodedToken likely contains the payload of the JWT, which typically includes information about the user such as their ID, username, and possibly other details. In this case, it's assumed that the JWT payload contains a field _id that represents the user's unique identifier.

        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user;
        next()
    } 
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})