import { NextFunction, Request, Response } from "express";

import { AppError, ErrorCodes } from "./../../core/errors";

export function notFoundMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {

    next(

        new AppError(

            `Route ${req.originalUrl} not found`,

            404,

            ErrorCodes.RESOURCE_NOT_FOUND

        )

    );

}