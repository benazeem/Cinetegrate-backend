import { UnauthorizedError } from "@middleware/error/index.js";
import { NextFunction, Request, Response } from "express";

export const requireActiveAccount = (req:Request, res:Response, next:NextFunction) => {
        const accountStatus = req.user?.accountStatus;

    if (accountStatus !== "active") {
       throw new UnauthorizedError("Active account required to access this resource.");
    }
    return next();
}