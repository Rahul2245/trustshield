import pinoHttp from "pino-http";
import { logger } from "./logger";

export const requestLogger = pinoHttp({
    logger,

    autoLogging: true,

    customSuccessMessage(request, response) {
        return `${request.method} ${request.url} completed with ${response.statusCode}`;
    },

    customErrorMessage(request, response) {
        return `${request.method} ${request.url} failed with ${response.statusCode}`;
    },
});