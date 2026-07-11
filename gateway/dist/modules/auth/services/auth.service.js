"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const user_role_enum_1 = require("../../../core/enums/user-role.enum");
const AppError_1 = require("../../../core/errors/AppError");
const jwt_1 = require("../../../infrastructure/security/jwt");
const auth_repository_1 = require("../repositories/auth.repository");
const mongoose_1 = __importDefault(require("mongoose"));
class AuthService {
    authRepository;
    constructor() {
        this.authRepository = new auth_repository_1.AuthRepository();
    }
    async register(userData) {
        if (userData.role && userData.role !== user_role_enum_1.UserRole.USER) {
            throw new AppError_1.AppError("Admin registration is not allowed", 403, "FORBIDDEN");
        }
        const existingUser = await this.authRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error("User already exists");
        }
        const avatarId = (0, uuid_1.v4)();
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarId}`;
        const newUser = await this.authRepository.create({
            email: userData.email,
            password: userData.password,
            role: user_role_enum_1.UserRole.USER,
        });
        const { UserModel } = require("../../users/models/user.model");
        await UserModel.findByIdAndUpdate(newUser._id, { avatar: avatarUrl });
        return {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            avatar: avatarUrl
        };
    }
    async login(userData, isAdminLogin = false) {
        const user = await this.authRepository.findByEmail(userData.email);
        if (!user) {
            throw new AppError_1.AppError("Invalid credentials", 401, "UNAUTHORIZED");
        }
        if (isAdminLogin && user.role === user_role_enum_1.UserRole.USER) {
            throw new AppError_1.AppError("Access denied. Admins only.", 403, "FORBIDDEN");
        }
        if (!isAdminLogin && user.role !== user_role_enum_1.UserRole.USER) {
            throw new AppError_1.AppError("Invalid login route. Please use the admin login portal.", 403, "FORBIDDEN");
        }
        if (user.status === "SUSPENDED") {
            throw new AppError_1.AppError("Account suspended.", 403, "ACCOUNT_SUSPENDED");
        }
        if (user.status === "INACTIVE") {
            throw new AppError_1.AppError("Account locked due to 180+ days of inactivity. Please contact support.", 403, "ACCOUNT_INACTIVE");
        }
        const lastActiveDate = user.lastLoginAt || user.createdAt;
        if (lastActiveDate) {
            const daysSinceLastActive = (new Date().getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLastActive >= 180) {
                const { UserModel } = require("../../users/models/user.model");
                await UserModel.findByIdAndUpdate(user._id, { status: 'INACTIVE' });
                throw new AppError_1.AppError("Dormant Account Takeover anomaly detected. Step-up email MFA required.", 202, "OTP_REQUIRED");
            }
        }
        const isMatch = await user.comparePassword(userData.password);
        if (!isMatch) {
            throw new AppError_1.AppError("Invalid credentials", 401, "UNAUTHORIZED");
        }
        await this.authRepository.updateLastLogin(user._id.toString());
        const sessionId = (0, uuid_1.v4)();
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            sessionId,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshTokenString = (0, jwt_1.generateRandomRefreshToken)();
        // Calculate Expiry
        const durationHours = userData.rememberMe ? 24 * 7 : 5; // 7 days or 5 hours
        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        await this.authRepository.saveRefreshToken({
            tokenHash: refreshTokenString,
            userId: new mongoose_1.default.Types.ObjectId(tokenPayload.userId),
            sessionId,
            expiresAt,
            revoked: false
        });
        return {
            user: {
                id: tokenPayload.userId,
                email: user.email,
                role: user.role,
                status: user.status,
            },
            tokens: {
                accessToken,
                refreshToken: refreshTokenString,
            },
        };
    }
    async refresh(refreshTokenString) {
        if (!refreshTokenString) {
            throw new AppError_1.AppError("No refresh token provided", 401, "UNAUTHORIZED");
        }
        const tokenRecord = await this.authRepository.findRefreshToken(refreshTokenString);
        if (!tokenRecord) {
            throw new AppError_1.AppError("Invalid refresh token", 401, "UNAUTHORIZED");
        }
        if (tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
            // Reuse detected on a revoked or expired token -> kill all sessions for safety
            await this.authRepository.deleteAllRefreshTokens(tokenRecord.userId.toString());
            throw new AppError_1.AppError("Refresh token revoked or expired. Please login again.", 401, "UNAUTHORIZED");
        }
        const user = await this.authRepository.findById(tokenRecord.userId.toString());
        if (!user || user.status !== "ACTIVE") {
            throw new AppError_1.AppError("User not active", 401, "UNAUTHORIZED");
        }
        // Rotate Token
        await this.authRepository.deleteRefreshToken(refreshTokenString);
        const sessionId = tokenRecord.sessionId;
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            sessionId,
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const newRefreshTokenString = (0, jwt_1.generateRandomRefreshToken)();
        // Preserve original expiry to not indefinitely extend session unless desired.
        // We will extend the expiry from now to simulate rolling sessions, up to max limit, 
        // but for strictness, let's just keep the original expiry.
        await this.authRepository.saveRefreshToken({
            tokenHash: newRefreshTokenString,
            userId: new mongoose_1.default.Types.ObjectId(tokenPayload.userId),
            sessionId,
            expiresAt: tokenRecord.expiresAt,
            revoked: false
        });
        return { accessToken: newAccessToken, refreshToken: newRefreshTokenString };
    }
    async logout(refreshTokenString) {
        if (refreshTokenString) {
            await this.authRepository.deleteRefreshToken(refreshTokenString);
        }
    }
    async logoutAll(userId) {
        await this.authRepository.deleteAllRefreshTokens(userId);
    }
    async getProfile(userId) {
        const user = await this.authRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map