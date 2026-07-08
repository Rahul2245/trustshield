"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const enums_1 = require("../../../core/enums");
const user_model_1 = require("../models/user.model");
class UserRepository {
    async findByEmail(email) {
        return user_model_1.UserModel.findOne({
            email,
        }).select("+passwordHash +refreshTokenHash");
    }
    async findById(id) {
        return user_model_1.UserModel.findById(id);
    }
    async create(user) {
        return user_model_1.UserModel.create(user);
    }
    async updateLastLogin(userId) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            lastLoginAt: new Date(),
        }, {
            new: true,
        });
    }
    async incrementFailedAttempts(userId) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            $inc: {
                failedLoginAttempts: 1,
            },
        });
    }
    async resetFailedAttempts(userId) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            failedLoginAttempts: 0,
            accountLockedUntil: undefined,
        });
    }
    async updateRefreshToken(userId, refreshTokenHash) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            refreshTokenHash,
        });
    }
    async lockAccount(userId, until) {
        return user_model_1.UserModel.findByIdAndUpdate(userId, {
            accountLockedUntil: until,
            status: enums_1.AccountStatus.LOCKED,
        });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map