import { env } from "./env";

export const databaseConfig = {
    uri: env.MONGO_URI,
    dbName: env.DATABASE_NAME,
};