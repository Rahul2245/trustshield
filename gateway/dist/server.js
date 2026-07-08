"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app/app"));
const config_1 = require("./config");
const database_1 = require("./infrastructure/database");
const logger_1 = require("./infrastructure/logger/logger");
async function bootstrap() {
    try {
        logger_1.logger.info("Starting TrustShield Gateway...");
        await (0, database_1.connectMongoDB)();
        app_1.default.listen(config_1.appConfig.port, () => {
            logger_1.logger.info(`Gateway running on port ${config_1.appConfig.port}`);
        });
    }
    catch (error) {
        logger_1.logger.fatal(error, "Application startup failed");
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map