import { Timestamp } from "mongodb";
import mongoose,{Schema} from "mongoose";

const subscriptionSchema= new Schema({
    Subscriber:{
        type: Schema.Types.ObjectId, //One who is is subscribing
        ref:"User"
    },
    Channel:{
        type: Schema.Types.ObjectId, //one who the subscriber is subscribed to
        ref:"User"
    }

},{
    timestamps:true,
})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)