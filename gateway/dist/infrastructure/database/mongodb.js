"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = connectMongoDB;
const mongoose_1 = __importDefault(require("mongoose"));
const database_config_1 = require("../../config/database.config");
const logger_1 = require("../../infrastructure/logger/logger");
async function connectMongoDB() {
    try {
        await mongoose_1.default.connect(database_config_1.databaseConfig.uri, {
            dbName: database_config_1.databaseConfig.dbName,
        });
        logger_1.logger.info(`MongoDB connected successfully (${database_config_1.databaseConfig.dbName})`);
    }
    catch (error) {
        logger_1.logger.fatal(error, "Failed to connect to MongoDB");
        process.exit(1);
    }
}
//# sourceMappingURL=mongodb.js.map