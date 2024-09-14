import { NextFunction, Response } from "express";
import CatchAsyncError from "../middleware/catchAsyncError";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";

// create a new user
export const newUser = CatchAsyncError( async (data: any, res: Response) => {
    const user = await userModel.create(data);
    res.status(201).json({success: true, user});
});
