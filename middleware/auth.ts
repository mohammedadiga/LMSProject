import { NextFunction, Request, Response } from "express";
import CatchAsyncError from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";

// authenticated user
export const isAutheticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) =>{

    const access_token = req.cookies.access_token as string;
    if(!access_token) return next(new ErrorHandler("Please login to access this resource", 401));

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
    if (!decoded) { return next(new ErrorHandler("access token is not valid", 400)) };

    const user = await redis.get(decoded.id as string)
    if (!user) { return next(new ErrorHandler("User not found", 400)) };

    req.user = JSON.parse(user) as any;
    next();
});