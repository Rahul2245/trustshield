import { StringValue } from "ms";
import { env } from "./env";

export const jwtConfig = {
    accessSecret: env.JWT_ACCESS_SECRET,

    refreshSecret: env.JWT_REFRESH_SECRET,

    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue,
};