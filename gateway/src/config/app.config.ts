import { env } from "./env";

export const appConfig = {
    name: env.APP_NAME,

    port: env.PORT,

    apiPrefix: "/api",

    apiVersion: "v1",
};