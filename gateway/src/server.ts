import app from "./app/app";
import { appConfig } from "./config";
import { connectMongoDB } from "./infrastructure/database";
import { logger } from "./infrastructure/logger/logger";

async function bootstrap() {
    try {

        logger.info("Starting TrustShield Gateway...");

        await connectMongoDB();

        app.listen(appConfig.port, () => {
            logger.info(
                `Gateway running on port ${appConfig.port}`
            );
        });

    } catch (error) {

        logger.fatal(error, "Application startup failed");

        process.exit(1);

    }
}

bootstrap();