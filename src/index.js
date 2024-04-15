import express from 'express';
import mongoose from 'mongoose';
import dotenv from "dotenv"
import ConnectDB from './db/index.js';
import { app } from './app.js';
dotenv.config(
    {
        path: './env'
    }
)
app.get('/',(req,res)=>{
    res.send("hey");
})
ConnectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log('listening on port '+process.env.PORT)
    })
})
.catch((err)=>console.error("MONGO DB error: " + err))