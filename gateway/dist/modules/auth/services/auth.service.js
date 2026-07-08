"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const user_role_enum_1 = require("../../../core/enums/user-role.enum");
const AppError_1 = require("../../../core/errors/AppError");
const jwt_1 = require("../../../infrastructure/security/jwt");
const auth_repository_1 = require("../repositories/auth.repository");
class AuthService {
    authRepository;
    constructor() {
        this.authRepository = new auth_repository_1.AuthRepository();
    }
    async register(userData) {
        const existingUser = await this.authRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error("User already exists");
        }
        const newUser = await this.authRepository.create({
            email: userData.email,
            password: userData.password,
            role: userData.role ?? user_role_enum_1.UserRole.USER,
        });
        return {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
        };
    }
    async login(userData) {
        const user = await this.authRepository.findByEmail(userData.email);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        if (user.status === "SUSPENDED") {
            throw new AppError_1.AppError("Account suspended.", 403, "ACCOUNT_SUSPENDED");
        }
        const isMatch = await user.comparePassword(userData.password);
        if (!isMatch) {
            throw new Error("Invalid credentials");
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
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                status: user.status,
            },
            tokens: {
                accessToken,
                refreshToken,
            },
        };
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