import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]),

    PORT: z.coerce.number(),

    APP_NAME: z.string(),

    MONGO_URI: z.string(),

    REDIS_URL: z.string(),

    RABBITMQ_URL: z.string(),

    JWT_SECRET: z.string(),

    JWT_REFRESH_SECRET: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;