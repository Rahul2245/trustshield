import app from "./app/app";
import { appConfig } from "./config";
import { connectMongoDB } from "./infrastructure/database";
import { logger } from "./infrastructure/logger/logger";
import { rabbitMQClient } from "./infrastructure/rabbitmq/connection";

async function bootstrap() {
    try {

        logger.info("Starting TrustShield Gateway...");

        await connectMongoDB();

        await rabbitMQClient.connect();

        const server = app.listen(appConfig.port, () => {
            logger.info(`Gateway running on port ${appConfig.port}`);
        });

        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);
            server.close(() => {
                logger.info('HTTP server closed.');
            });
            await rabbitMQClient.disconnect();
            logger.info('Graceful shutdown completed.');
            process.exit(0);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.fatal(error, "Application startup failed");
        process.exit(1);
    }
}

bootstrap();