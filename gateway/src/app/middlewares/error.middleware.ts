import { NextFunction, Request, Response } from "express";

import { AppError, ErrorCodes } from "./../../core/errors";
import { ApiResponse } from "./../../shared/responses/api-response";
import { logger } from "./../../infrastructure/logger/logger";

export function errorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction

):void{
    let error = err;

    if (!(error instanceof AppError)) {
        error = new AppError(
            "Internal Server Error",
            500,
            ErrorCodes.INTERNAL_SERVER_ERROR,
            false
        );
    }

        logger.error({
        requestId: req.requestId,
        message: error.message,
        stack: error.stack,
    });

    const appError = error as AppError;

     res.status(appError.statusCode).json(

        new ApiResponse(

            false,

            appError.message,

            undefined,

            {
                code: appError.code,
                requestId: req.requestId,

                ...(process.env.NODE_ENV !== "production"
                    ? { stack: appError.stack }
                    : {})
            }

        )

    );


}