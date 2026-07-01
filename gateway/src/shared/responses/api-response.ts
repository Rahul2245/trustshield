import { Response } from "express";
import { ZodFlattenedError } from "zod";

export class ApiResponse<T> {

    public success: boolean;
    public message: string;
    public data?: T;
    public error?: unknown;


    constructor(
        success: boolean,
        message: string,
        data?: T,
        error?: unknown
    ) {

        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;

    }

}