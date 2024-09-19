import { Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { IUser } from "../models/user.model";
import 'dotenv/config';
import { redis } from "./redis";

// Create Email activate Token
interface IActivationToken{
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    // Create Activation Code
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Create Activation Token
    const token = jwt.sign({ user, activationCode }, process.env.ACTIVATON_SECRET as Secret,{ expiresIn: "5m" });
    return {activationCode, token};
};

// Create User Access and Refresh Token
interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}

// parse environment variables to integrates with fallback values
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);

// options for cookies
export const accessTokenOptions : ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
};

export const refreshTokenOptions : ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
};

export const sendToken = ( user: IUser, statusCode: number, res: Response ) => {

    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis
    redis.set(user.id, JSON.stringify(user) as any);
    
    // Only set secure to true in production
    if(process.env.NODE_ENV === 'production') accessTokenOptions.secure = true;

    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);

    res.status(statusCode).json({ success: true, user, accessToken })
}