import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

import { ApiResponse } from "../../shared/responses/api-response";
import { ErrorCodes } from "../../core/errors";


export function validate(
    schema: ZodObject
) {

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });


        if (!result.success) {

            return res.status(400).json(
                new ApiResponse(
                    false,
                    "Validation failed",
                    undefined,
                    {
                        code: ErrorCodes.VALIDATION_ERROR,
                        details: result.error.flatten(),
                    }
                )
            );

        }


        req.body = result.data?.body;

        next();
    };

}