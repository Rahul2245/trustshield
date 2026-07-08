"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app/app"));
const config_1 = require("./config");
const database_1 = require("./infrastructure/database");
const logger_1 = require("./infrastructure/logger/logger");
const connection_1 = require("./infrastructure/rabbitmq/connection");
const socket_1 = require("./infrastructure/websocket/socket");
async function bootstrap() {
    try {
        logger_1.logger.info("Starting TrustShield Gateway...");
        await (0, database_1.connectMongoDB)();
        await connection_1.rabbitMQClient.connect();
        const httpServer = (0, http_1.createServer)(app_1.default);
        (0, socket_1.initializeSocketServer)(httpServer);
        httpServer.listen(config_1.appConfig.port, () => {
            logger_1.logger.info(`Gateway running on port ${config_1.appConfig.port}`);
        });
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
            httpServer.close(() => {
                logger_1.logger.info('HTTP server closed.');
            });
            await connection_1.rabbitMQClient.disconnect();
            logger_1.logger.info('Graceful shutdown completed.');
            process.exit(0);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.fatal(error, "Application startup failed");
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map