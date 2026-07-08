import { NextFunction, Request, Response } from "express";

import { AppError, ErrorCodes } from "./../../core/errors";
import { ApiResponse } from "./../../shared/responses/api-response";
import { logger } from "./../../infrastructure/logger/logger";

export function errorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction

): any {
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

     return ApiResponse.error(res, appError.statusCode, appError.message, {
         code: appError.code,
         ...(process.env.NODE_ENV !== "production" ? { stack: appError.stack } : {})
     });


}