"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const user_model_1 = require("../../users/models/user.model");
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
}
exports.AuthRepository = AuthRepository;
//# sourceMappingURL=auth.repository.js.map