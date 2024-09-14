import { NextFunction, Request, Response } from "express";
import CatchAsyncError from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import userModel, { IUser } from "../models/user.model";


// register user

export const registerationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const {name, email, password} = req.body as IUser;
        if (!email || !password) return next(new ErrorHandler("Please enter email and password", 400));

        // check if email already exist
        const isEmailExist = await userModel.findOne({ email });
        if ( isEmailExist ) return next(new ErrorHandler("Email already exist", 400));

        const user = await userModel.create({ name,email, password });

        res.status(201).json({ success: true, user });

    } catch (error:any) { return next(new ErrorHandler(error.message, 500));}
});


export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    try {

        const { email, password } = req.body as IUser
        if (!email || !password) return next(new ErrorHandler("Please enter email and password", 400));

        const user = await userModel.findOne({ email }).select('+password');
        if (!user) return next(new ErrorHandler("Invalid email or password", 400));

        const isPasswordMetch = await user.comparePassword(password);
        if (!isPasswordMetch) return next(new ErrorHandler("Invalid email or password", 400));

        res.status(201).json({ success: true, user });
        
    } catch (error: any) { return next(new ErrorHandler(error.message, 400)) }

});
