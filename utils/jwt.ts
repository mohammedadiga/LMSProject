import jwt, { Secret } from "jsonwebtoken";
import { IUser } from "../models/user.model";
import ErrorHandler from "./ErrorHandler";

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