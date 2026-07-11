"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const mongoose_1 = __importDefault(require("mongoose"));
const user_role_enum_1 = require("../../../core/enums/user-role.enum");
const AppError_1 = require("../../../core/errors/AppError");
const connection_1 = require("../../../infrastructure/rabbitmq/connection");
const logger_1 = require("../../../infrastructure/logger/logger");
const jwt_1 = require("../../../infrastructure/security/jwt");
const bcrypt_1 = require("../../../infrastructure/security/bcrypt");
const auth_repository_1 = require("../repositories/auth.repository");
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
            throw new AppError_1.AppError("User already exists", 400, "BAD_REQUEST");
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
            user.isUnderInvestigation = true;
            await user.save();
            const threatPayload = {
                eventId: (0, uuid_1.v4)(),
                eventType: 'ThreatAdminAccessAttempt',
                userId: String(user._id),
                email: user.email,
                ipAddress: 'unknown',
                userAgent: 'unknown',
                timestamp: new Date().toISOString(),
                correlationId: (0, uuid_1.v4)(),
                requestId: (0, uuid_1.v4)(),
                metadata: {
                    burstVelocity: 0.0,
                    targetRecipientRatio: 0.0,
                    uriHyperlinkDensity: 0.0,
                    sessionDwellDuration: 0.0,
                    payloadText: 'Standard user attempted to access the Admin Panel',
                }
            };
            connection_1.rabbitMQClient.publishThreatEvent(threatPayload).catch(err => {
                logger_1.logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event for admin access attempt');
            });
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
        const hashedToken = await (0, bcrypt_1.hashPassword)(refreshTokenString);
        // Calculate Expiry
        const durationHours = userData.rememberMe ? 24 * 7 : 5; // 7 days or 5 hours
        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        await this.authRepository.saveRefreshToken({
            tokenHash: hashedToken,
            userId: new mongoose_1.default.Types.ObjectId(tokenPayload.userId),
            sessionId,
            expiresAt,
            revoked: false
        });
        const finalRefreshToken = `${sessionId}::${refreshTokenString}`;
        return {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                isUnderInvestigation: user.isUnderInvestigation,
                lastLoginAt: user.lastLoginAt,
            },
            tokens: {
                accessToken,
                refreshToken: finalRefreshToken,
            },
            expiresAt,
        };
    }
    async refresh(finalRefreshToken) {
        if (!finalRefreshToken) {
            throw new AppError_1.AppError("No refresh token provided", 401, "UNAUTHORIZED");
        }
        const [sessionId, rawToken] = finalRefreshToken.split("::");
        if (!sessionId || !rawToken) {
            throw new AppError_1.AppError("Invalid refresh token format", 401, "INVALID_TOKEN");
        }
        const tokenRecord = await this.authRepository.findBySessionId(sessionId);
        if (!tokenRecord) {
            throw new AppError_1.AppError("Invalid refresh token", 401, "INVALID_TOKEN");
        }
        if (tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
            await this.authRepository.deleteAllRefreshTokens(tokenRecord.userId.toString());
            throw new AppError_1.AppError("Refresh token revoked or expired. Please login again.", 401, "TOKEN_EXPIRED");
        }
        const isValidToken = await (0, bcrypt_1.comparePassword)(rawToken, tokenRecord.tokenHash);
        if (!isValidToken) {
            await this.authRepository.deleteAllRefreshTokens(tokenRecord.userId.toString());
            throw new AppError_1.AppError("Invalid refresh token", 401, "INVALID_TOKEN");
        }
        const user = await this.authRepository.findById(tokenRecord.userId.toString());
        if (!user || user.status !== "ACTIVE") {
            throw new AppError_1.AppError("User not active", 401, "UNAUTHORIZED");
        }
        // Rotate Token
        await this.authRepository.deleteBySessionId(sessionId);
        const newSessionId = (0, uuid_1.v4)();
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            sessionId: newSessionId,
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const newRefreshTokenString = (0, jwt_1.generateRandomRefreshToken)();
        const hashedToken = await (0, bcrypt_1.hashPassword)(newRefreshTokenString);
        await this.authRepository.saveRefreshToken({
            tokenHash: hashedToken,
            userId: new mongoose_1.default.Types.ObjectId(tokenPayload.userId),
            sessionId: newSessionId,
            expiresAt: tokenRecord.expiresAt,
            revoked: false
        });
        const newFinalRefreshToken = `${newSessionId}::${newRefreshTokenString}`;
        return {
            accessToken: newAccessToken,
            refreshToken: newFinalRefreshToken,
            expiresAt: tokenRecord.expiresAt,
            userRole: user.role
        };
    }
    async logout(finalRefreshToken) {
        if (finalRefreshToken) {
            const [sessionId] = finalRefreshToken.split("::");
            if (sessionId) {
                await this.authRepository.deleteBySessionId(sessionId);
            }
        }
    }
    async logoutAll(userId) {
        await this.authRepository.deleteAllRefreshTokens(userId);
    }
    async getProfile(userId) {
        const user = await this.authRepository.findById(userId);
        if (!user) {
            throw new AppError_1.AppError("User not found", 404, "NOT_FOUND");
        }
        return {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            isUnderInvestigation: user.isUnderInvestigation,
            lastLoginAt: user.lastLoginAt,
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map