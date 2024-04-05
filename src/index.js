import express from 'express';
import mongoose from 'mongoose';
import dotenv from "dotenv"
import ConnectDB from './db/index.js';
dotenv.config(
    {
        path: './env'
    }
)
ConnectDB();