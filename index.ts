import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './utils/db';
import cors from 'cors';
import 'dotenv/config';


// middleware Hokies
import { ErrorMiddleware } from './middleware/error';

// routes
import userRouter from './routes/user.route';


export const app = express();

// body parser
app.use(express.json({limit: "50mb"}));

// cookie parser
app.use(cookieParser());

// cors => cross origin resource sharing
app.use(cors({
    origin: process.env.ORIGIN
}));

// testing api
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ 
        success: true,
        message: 'API is working fine!'
    });
});

// route
app.use("/api/v1", userRouter);

// all api
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
});

// middleware
app.use(ErrorMiddleware);

// create server
app.listen(process.env.PORT, () => {
    console.log(`Server is connected with port ${process.env.PORT}`);
    connectDB();
});
