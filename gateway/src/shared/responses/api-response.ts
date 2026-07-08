import { Response } from 'express';

export class ApiResponse {
  public static success(res: Response, message: string, data?: any, statusCode: number = 200) {
    const requestId = res.locals.requestId;
    return res.status(statusCode).json({
      success: true,
      requestId,
      message,
      data
    });
  }

  public static error(res: Response, statusCode: number, message: string, err?: any) {
    const requestId = res.locals.requestId;
    return res.status(statusCode).json({
      success: false,
      requestId,
      message,
      error: err instanceof Error ? err.message : err
    });
  }
}