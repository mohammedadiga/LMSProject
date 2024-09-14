import { NextFunction, Request, Response } from 'express';
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddleware = (err:any, req: Request, res: Response, next: NextFunction) => {

    err.message = err.message || 'Internal Server Error'
    err.statusCode = err.statusCode || 500;

    // wrong mongodb id error
    if (err.name === 'CastError') {
       const message = `Resource not found. Invalid ${err.path}`;
       err = new ErrorHandler(message, 400);
    }

    // wrong mongodb id error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }

    // wrong jwt error
    if (err.name === 'jsonTokenError') {
        const message = `Json web token is invalid, try again`;
        err = new ErrorHandler(message, 400);
    }

    // JWT expired error 
    if (err.name === 'jsonExpiredError') {
        const message = `Json web token is expired, try again`;
        err = new ErrorHandler(message, 400);
    }

    // res.json(err)

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}