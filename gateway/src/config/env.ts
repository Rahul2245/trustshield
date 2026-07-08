import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]),

    PORT: z.coerce.number(),

    APP_NAME: z.string(),

    DATABASE_NAME: z.string(),

    MONGO_URI: z.string().url().or(z.string()),

    REDIS_URL: z.string(),

    RABBITMQ_URL: z.string(),

    JWT_ACCESS_SECRET: z.string(),

    JWT_REFRESH_SECRET: z.string(),

    JWT_ACCESS_EXPIRES_IN: z.string(),

    JWT_REFRESH_EXPIRES_IN: z.string(),

    FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),

    WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;