import { NextFunction, Request, Response } from "express";
import CatchAsyncError from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";

// update access token
export const updateToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{

    const message = 'Could not refresh token';

    const refresh_token = req.cookies.refresh_token as string;
    if(!refresh_token) return next(new ErrorHandler("Could not refresh token", 401));

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
    if (!decoded) return next(new ErrorHandler(message,400));

    const session = await redis.get(decoded.id as string);
    if (!session) return next(new ErrorHandler(message,400));

    const parsedUser = JSON.parse(session) as any;

    // Create a new object without the password field
    const { password, ...user } = parsedUser;

    req.user = user;
    next();
});

// authenticated user
export const isAutheticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{

    
    const access_token = req.cookies.access_token as string;
    if(!access_token) return next(new ErrorHandler("Please login to access this resource", 401));

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
    if (!decoded) { return next(new ErrorHandler("access token is not valid", 400)) };

    const session = await redis.get(decoded.id as string)
    if (!session) { return next(new ErrorHandler("User not found", 400)) };

    const parsedUser = JSON.parse(session) as any;

    // Create a new object without the password field
    const { password, ...user } = parsedUser;

    req.user = user;
    next();
});

// authenticated user
export const authorizeRoles = (...roles: string[]) => {

    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes((<any>req).user?.role || '')) return next(new ErrorHandler(`Role: ${(<any>req).user?.role} is not allowed to access this resource`, 403));
        next();
    }
}