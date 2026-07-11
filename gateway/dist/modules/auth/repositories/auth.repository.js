"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const user_model_1 = require("../../users/models/user.model");
const refresh_token_model_1 = require("../models/refresh-token.model");
const crypto_1 = __importDefault(require("crypto"));
class AuthRepository {
    async findByEmail(email) {
        return user_model_1.UserModel.findOne({ email }).exec();
    }
    async findById(userId) {
        return user_model_1.UserModel.findById(userId).exec();
    }
    async create(userData) {
        const user = new user_model_1.UserModel(userData);
        return user.save();
    }
    async updateLastLogin(userId) {
        await user_model_1.UserModel.findByIdAndUpdate(userId, { lastLoginAt: new Date() }).exec();
    }
    // Refresh Token Management
    async saveRefreshToken(data) {
        const token = new refresh_token_model_1.RefreshTokenModel(data);
        return token.save();
    }
    async findRefreshToken(token) {
        const hash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        return refresh_token_model_1.RefreshTokenModel.findOne({ tokenHash: hash }).exec();
    }
    async deleteRefreshToken(token) {
        const hash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        await refresh_token_model_1.RefreshTokenModel.deleteOne({ tokenHash: hash }).exec();
    }
    async deleteAllRefreshTokens(userId) {
        await refresh_token_model_1.RefreshTokenModel.deleteMany({ userId }).exec();
    }
}
exports.AuthRepository = AuthRepository;
//# sourceMappingURL=auth.repository.js.map