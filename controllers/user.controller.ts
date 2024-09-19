import { NextFunction, Request, Response } from "express";
import CatchAsyncError from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import userModel, { IUser } from "../models/user.model";
import { accessTokenOptions, createActivationToken, refreshTokenOptions, sendToken } from "../utils/jwt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v2 as cloudinary } from 'cloudinary';
import sendMail from "../utils/sendMail";
import { redis } from "../utils/redis";
import ejs from "ejs";
import path from "path";



// register user
export const registerationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const {name, email, password} = req.body as IUser;
        if (!email || !password) return next(new ErrorHandler("Please enter email and password", 400));

        // check if email already exist
        const isEmailExist = await userModel.findOne({ email });
        if( isEmailExist ) return next(new ErrorHandler("Email already exist", 400));

        const user  = {name, email, password }

        const activationToken = createActivationToken(user);
        const activationCode = activationToken.activationCode;

        const data = {user: {name:user.name}, activationCode}
        // const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);

        try {

            await sendMail({
                email: email,
                subject: "Account Activation",
                template: "activation-mail.ejs",
                data
            });

            res.status(201).json({ 
                success: true,
                message: `Please check your email: ${user.email} to activate your account!`,
                activationToken: activationToken.token
            });

        } catch (error: any) { return next(new ErrorHandler(error.message, 400)); }

    } catch (error:any) { return next(new ErrorHandler(error.message, 500));}
});

// activate user
interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    try {

        const {activation_token, activation_code} = req.body as IActivationRequest;

        const newUser : {user:IUser, activationCode:string} = jwt.verify(activation_token, process.env.ACTIVATON_SECRET as string ) as {user:IUser; activationCode:string};
        if (newUser.activationCode != activation_code ) return next(new ErrorHandler("Invalid activation code",400));

        const { name, email, password } = newUser.user

        const existUser = await userModel.findOne({email})
        if( existUser ) return next(new ErrorHandler("Email already exist", 400));

        const user = await userModel.create({ name, email, password });

        res.status(200).json({ success: true });

    } catch (error: any) { return next(new ErrorHandler(error.message, 500))}

});

// Login user
export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    try {

        const { email, password } = req.body as IUser
        if (!email || !password) return next(new ErrorHandler("Please enter email and password", 400));

        const user = await userModel.findOne({ email }).select('+password');
        if (!user) return next(new ErrorHandler("Invalid email or password", 400));

        const isPasswordMetch = await user.comparePassword(password);
        if (!isPasswordMetch) return next(new ErrorHandler("Invalid email or password", 400));

        sendToken(user, 200, res)
        
    } catch (error: any) { return next(new ErrorHandler(error.message, 500)) }

});

// update access token
export const updateAccessToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const accessToken = jwt.sign({id: req.user?._id}, process.env.ACCESS_TOKEN as string, {expiresIn: "5m"});
        const refreshToken = jwt.sign({id: req.user?._id}, process.env.REFRESH_TOKEN as string, {expiresIn: "3d"});

        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        res.status(200).json({ success: true, accessToken})

    } catch (error: any) { return next(new ErrorHandler(error.message,500)); }
});

// logout user
export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try {

        res.cookie("access_token", "", {maxAge: 1});
        res.cookie("refresh_token", "", {maxAge: 1});

        const userId = req.user?._id as any|| "";
        redis.del(userId);

        res.status(200).json({success: true, message: "Logged out successfully"})   
        
    } catch (error: any) { return next(new ErrorHandler(error.message,500)); }
});

// get user info
export const getUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{
    try {

        const user = req.user
        res.status(201).json({ success: true, user });

    } catch (error: any) { return next(new ErrorHandler(error.message,500)); }
});

// social auth
export const socialAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const { email, name, avatar } = req.body as IUser
        const user = await userModel.findOne({email})

        if(!user){

            const newUser = await userModel.create({email, name, avatar});
            sendToken(newUser, 200, res)

        } else return next(new ErrorHandler("Email already exist", 401))


    } catch (error: any) { return next(new ErrorHandler(error.message,500)); }
});

// Update user info
export const updateUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {name,email} = req.body as IUser

        const userId = req.user?._id as any
        const user = await userModel.findById(userId).select('-password');

        if(email && user) {
            
            const isEmailExist = await userModel.findOne({ email });
            if(isEmailExist) return next(new ErrorHandler("Email already exist", 400));

            user.email = email;
        }

        if(name && user) { user.name = name; }

        await user?.save();

        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({ success: true, user })

    } catch (error: any) { return next(new ErrorHandler(error.message,500)); }
});

// update user password
interface IUpdatePassword{
    oldPassword: string;
    newPassword: string;
}

export const updateUserPassword = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const userId = req.user?._id as any;

        const {oldPassword, newPassword} = req.body as IUpdatePassword;
        if (!oldPassword || !newPassword) return next(new ErrorHandler("Pleace enter old and new password", 400));

        const user = await userModel.findById(userId).select("+password");
        if (user?.password === undefined) return next(new ErrorHandler("Invalid user", 400));

        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if (!isPasswordMatch) return next(new ErrorHandler("Invalid old password", 400));

        user.password = newPassword;
        await user?.save();

        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({ success: true, user })

    } catch (error: any) { return next(new ErrorHandler(error.message,500)); }
});

// update profile picture
export const updateProfilePicture = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { avatar } = req.body;
        const userId = req.user?._id as any;

        const user = await userModel.findById(userId);

        if (avatar && user){
            if (user?.avatar?.public_id) { await cloudinary.uploader.destroy(user?.avatar?.public_id) }
            else {
                const myCloud = await cloudinary.uploader.upload(avatar,{ folder: "avatars", width: 150});
                user.avatar = { public_id: myCloud.public_id, url: myCloud.secure_url }
            }
        }

        await user?.save();
        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({ success: true, user })

    } catch (error: any) { return next(new ErrorHandler(error.message, 400)) }
});