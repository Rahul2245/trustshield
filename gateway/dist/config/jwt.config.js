"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
const env_1 = require("./env");
exports.jwtConfig = {
    accessSecret: env_1.env.JWT_ACCESS_SECRET,
    refreshSecret: env_1.env.JWT_REFRESH_SECRET,
    accessExpiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
};
//# sourceMappingURL=jwt.config.js.map