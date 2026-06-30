import app from "./app/app";
import { appConfig } from "./config";
import { logger } from "./infrastructure/logger/logger";

logger.info("Application starting...");


app.listen(appConfig.port, () => {
    console.log(`Gateway running on port ${appConfig.port}`);
});