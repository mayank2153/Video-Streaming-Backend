import mongoose,{Schema} from 'mongoose';
const UserSchema=new Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type: String,
        required:true,
        unique:true,
        index:true
    },
    fullname:{
        type: String,
        required:true
    },
    avatar:{
        type: String,  //cloudinary Url
        required:true
    },
    coverImage:{
        type: String, //cloudinary Url
        required:false
    },
    password:{
        type:String,
        required:true
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    refreshToken:{
        type:String,
    }
},{
    timestamps:true
})
export const User=mongoose.model("User", UserSchema)