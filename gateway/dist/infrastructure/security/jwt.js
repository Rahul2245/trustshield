"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRandomRefreshToken = generateRandomRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../../config/jwt.config");
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.jwtConfig.accessSecret, {
        expiresIn: '15m',
    });
}
const crypto_1 = __importDefault(require("crypto"));
function generateRandomRefreshToken() {
    return crypto_1.default.randomBytes(40).toString('hex');
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.accessSecret);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.refreshSecret);
}
//# sourceMappingURL=jwt.js.map