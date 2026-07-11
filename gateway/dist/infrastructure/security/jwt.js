"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.generateRandomRefreshToken = generateRandomRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../../config/jwt.config");
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.jwtConfig.accessSecret, {
        expiresIn: jwt_config_1.jwtConfig.accessExpiresIn,
    });
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.jwtConfig.refreshSecret, {
        expiresIn: jwt_config_1.jwtConfig.refreshExpiresIn,
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.accessSecret);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.refreshSecret);
}
function generateRandomRefreshToken() {
    const crypto = require("crypto");
    return crypto.randomBytes(40).toString("hex");
}
//# sourceMappingURL=jwt.js.map