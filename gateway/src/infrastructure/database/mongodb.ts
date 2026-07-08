import mongoose from "mongoose";

import { databaseConfig } from "../../config/database.config";
import { logger } from "../../infrastructure/logger/logger";

export async function connectMongoDB(): Promise<void> {
    try {
//         console.log("Type:", typeof databaseConfig.uri);
// console.log("Raw:", databaseConfig.uri);
// console.log("JSON:", JSON.stringify(databaseConfig.uri));
// console.log("Length:", databaseConfig.uri.length);
        await mongoose.connect(databaseConfig.uri, {
            dbName: databaseConfig.dbName,
        });

        logger.info(
            `MongoDB connected successfully (${databaseConfig.dbName})`
        );
    } catch (error) {
        logger.fatal(error, "Failed to connect to MongoDB");
        process.exit(1);
    }
}