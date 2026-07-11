"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const user_model_1 = require("../../users/models/user.model");
const refresh_token_model_1 = require("../models/refresh-token.model");
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
    async saveRefreshToken(data) {
        await refresh_token_model_1.RefreshTokenModel.create(data);
    }
    async findBySessionId(sessionId) {
        return refresh_token_model_1.RefreshTokenModel.findOne({ sessionId }).exec();
    }
    async deleteBySessionId(sessionId) {
        await refresh_token_model_1.RefreshTokenModel.findOneAndDelete({ sessionId }).exec();
    }
    async deleteAllRefreshTokens(userId) {
        await refresh_token_model_1.RefreshTokenModel.deleteMany({ userId }).exec();
    }
}
exports.AuthRepository = AuthRepository;
//# sourceMappingURL=auth.repository.js.map