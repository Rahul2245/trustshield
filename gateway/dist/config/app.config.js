"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const env_1 = require("./env");
exports.appConfig = {
    name: env_1.env.APP_NAME,
    port: env_1.env.PORT,
    apiPrefix: "/api",
    apiVersion: "v1",
};
//# sourceMappingURL=app.config.js.map