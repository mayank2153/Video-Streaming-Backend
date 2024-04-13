import mongoose,{Schema} from "mongoose";
const VideoSchema=new Schema(
    {
        videoFile:{
            type:String,
            required:true,
        },
        thumbnail:{
            type:String,
            required:true,
        },

        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        title:{
            type:String,
            required:true,
        },
        description:{
            type:String
        },
        duraton:{
            type:Number,
            required:true,
        },
        views:{
            type:Number,
            required:true,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        }
    },
    {
        timestamps:true
    }
)
export const Video=mongoose.model('Video',VideoSchema);