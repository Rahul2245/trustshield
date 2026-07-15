import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

import { UserRole } from "../../../core/enums/user-role.enum";
import { AppError } from "../../../core/errors/AppError";
import { rabbitMQClient } from "../../../infrastructure/rabbitmq/connection";
import { logger } from "../../../infrastructure/logger/logger";
import { redisService } from "../../../infrastructure/redis/redis";
import { emailService } from "../../../infrastructure/email/email.service";
import {
    generateAccessToken,
    generateRandomRefreshToken,
} from "../../../infrastructure/security/jwt";
import { hashPassword, comparePassword } from "../../../infrastructure/security/bcrypt";
import { AuthRepository } from "../repositories/auth.repository";

export class AuthService {
    private authRepository: AuthRepository;

    constructor() {
        this.authRepository = new AuthRepository();
    }

    public async register(userData: { email: string; password: string; role?: UserRole }) {
        if (userData.role && userData.role !== UserRole.USER) {
            throw new AppError("Admin registration is not allowed", 403, "FORBIDDEN");
        }

        const existingUser = await this.authRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new AppError("User already exists", 400, "BAD_REQUEST");
        }

        const avatarId = uuidv4();
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarId}`;

        const newUser = await this.authRepository.create({
            email: userData.email,
            password: userData.password,
            role: UserRole.USER,
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

    public async login(userData: { email: string; password: string; rememberMe?: boolean }, isAdminLogin = false) {
        const user = await this.authRepository.findByEmail(userData.email);
        if (!user) {
            throw new AppError("Invalid credentials", 401, "UNAUTHORIZED");
        }

        if (isAdminLogin && user.role === UserRole.USER) {
            user.isUnderInvestigation = true;
            await user.save();

            const threatPayload = {
                eventId: uuidv4(),
                eventType: 'ThreatAdminAccessAttempt',
                userId: String(user._id),
                email: user.email,
                ipAddress: 'unknown',
                userAgent: 'unknown',
                timestamp: new Date().toISOString(),
                correlationId: uuidv4(),
                requestId: uuidv4(),
                metadata: {
                    burstVelocity: 0.0,
                    targetRecipientRatio: 0.0,
                    uriHyperlinkDensity: 0.0,
                    sessionDwellDuration: 0.0,
                    payloadText: 'Standard user attempted to access the Admin Panel',
                }
            };
            
            rabbitMQClient.publishThreatEvent(threatPayload).catch(err => {
                logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event for admin access attempt');
            });

            throw new AppError("Access denied. Admins only.", 403, "FORBIDDEN");
        }

        if (!isAdminLogin && user.role !== UserRole.USER) {
            throw new AppError("Invalid login route. Please use the admin login portal.", 403, "FORBIDDEN");
        }

        if (user.status === "SUSPENDED") {
            throw new AppError("Account suspended.", 403, "ACCOUNT_SUSPENDED");
        }

        const isMatch = await user.comparePassword(userData.password);
        if (!isMatch) {
            throw new AppError("Invalid credentials", 401, "UNAUTHORIZED");
        }

        const lastActiveDate = user.lastLoginAt || user.createdAt;
        if (lastActiveDate) {
            const daysSinceLastActive = (new Date().getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLastActive >= 180 && user.status !== 'INACTIVE') {
                const { UserModel } = require("../../users/models/user.model");
                await UserModel.findByIdAndUpdate(user._id, { status: 'INACTIVE' });
                
                // Generate 6-digit OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Store in Redis with 10 mins expiry
                await redisService.set(`otp:${user.email}`, otp, 600);
                
                // Send real email with OTP
                await emailService.sendOtpEmail(user.email, otp);
                
                throw new AppError("Dormant Account Takeover anomaly detected. Step-up email MFA required.", 403, "OTP_REQUIRED");
            }
            if (user.status === 'INACTIVE') {
                 // Generate 6-digit OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Store in Redis with 10 mins expiry
                await redisService.set(`otp:${user.email}`, otp, 600);
                
                // Send real email with OTP
                await emailService.sendOtpEmail(user.email, otp);
                
                throw new AppError("Dormant Account Takeover anomaly detected. Step-up email MFA required.", 403, "OTP_REQUIRED");
            }
        }

        await this.authRepository.updateLastLogin((user._id as { toString(): string }).toString());

        const sessionId = uuidv4();
        const tokenPayload = {
            userId: (user._id as { toString(): string }).toString(),
            email: user.email,
            role: user.role,
            sessionId,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshTokenString = generateRandomRefreshToken();
        const hashedToken = await hashPassword(refreshTokenString);

        // Calculate Expiry
        const durationHours = userData.rememberMe ? 24 * 7 : 5; // 7 days or 5 hours
        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

        await this.authRepository.saveRefreshToken({
            tokenHash: hashedToken,
            userId: new mongoose.Types.ObjectId(tokenPayload.userId),
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

    public async verifyOtp(email: string, otp: string, isAdminLogin: boolean = false): Promise<any> {
        const storedOtp = await redisService.get(`otp:${email}`);
        
        if (!storedOtp || storedOtp !== otp) {
            throw new AppError("Invalid or expired OTP", 401, "UNAUTHORIZED");
        }
        
        const { UserModel } = require("../../users/models/user.model");
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            throw new AppError("User not found", 404, "NOT_FOUND");
        }

        if (isAdminLogin && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
            throw new AppError("Access denied. Admins only.", 403, "FORBIDDEN");
        }

        // Restore account state and delete OTP
        await UserModel.findByIdAndUpdate(user._id, { status: 'ACTIVE' });
        await redisService.delete(`otp:${email}`);
        
        await this.authRepository.updateLastLogin((user._id as { toString(): string }).toString());

        const sessionId = uuidv4();
        const tokenPayload = {
            userId: (user._id as { toString(): string }).toString(),
            email: user.email,
            role: user.role,
            sessionId,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshTokenString = generateRandomRefreshToken();
        const hashedToken = await hashPassword(refreshTokenString);

        // Calculate Expiry
        const durationHours = 5; 
        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

        await this.authRepository.saveRefreshToken({
            tokenHash: hashedToken,
            userId: new mongoose.Types.ObjectId(tokenPayload.userId),
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
                status: 'ACTIVE',
            },
            tokens: {
                accessToken,
                refreshToken: finalRefreshToken
            }
        };
    }

    public async refresh(finalRefreshToken: string) {
        if (!finalRefreshToken) {
            throw new AppError("No refresh token provided", 401, "UNAUTHORIZED");
        }

        const [sessionId, rawToken] = finalRefreshToken.split("::");
        if (!sessionId || !rawToken) {
            throw new AppError("Invalid refresh token format", 401, "INVALID_TOKEN");
        }

        const tokenRecord = await this.authRepository.findBySessionId(sessionId);
        
        if (!tokenRecord) {
            throw new AppError("Invalid refresh token", 401, "INVALID_TOKEN");
        }

        if (tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
            await this.authRepository.deleteAllRefreshTokens(tokenRecord.userId.toString());
            throw new AppError("Refresh token revoked or expired. Please login again.", 401, "TOKEN_EXPIRED");
        }

        const isValidToken = await comparePassword(rawToken, tokenRecord.tokenHash);
        if (!isValidToken) {
            await this.authRepository.deleteAllRefreshTokens(tokenRecord.userId.toString());
            throw new AppError("Invalid refresh token", 401, "INVALID_TOKEN");
        }

        const user = await this.authRepository.findById(tokenRecord.userId.toString());
        if (!user || user.status !== "ACTIVE") {
            throw new AppError("User not active", 401, "UNAUTHORIZED");
        }

        // Rotate Token
        await this.authRepository.deleteBySessionId(sessionId);

        const newSessionId = uuidv4();
        const tokenPayload = {
            userId: (user._id as { toString(): string }).toString(),
            email: user.email,
            role: user.role,
            sessionId: newSessionId,
        };

        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshTokenString = generateRandomRefreshToken();
        const hashedToken = await hashPassword(newRefreshTokenString);
        
        await this.authRepository.saveRefreshToken({
            tokenHash: hashedToken,
            userId: new mongoose.Types.ObjectId(tokenPayload.userId),
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

    public async logout(finalRefreshToken: string) {
        if (finalRefreshToken) {
            const [sessionId] = finalRefreshToken.split("::");
            if (sessionId) {
                await this.authRepository.deleteBySessionId(sessionId);
            }
        }
    }

    public async logoutAll(userId: string) {
        await this.authRepository.deleteAllRefreshTokens(userId);
    }

    public async getProfile(userId: string) {
        const user = await this.authRepository.findById(userId);
        if (!user) {
            throw new AppError("User not found", 404, "NOT_FOUND");
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
