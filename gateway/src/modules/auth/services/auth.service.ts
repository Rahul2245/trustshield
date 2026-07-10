import { v4 as uuidv4 } from "uuid";

import { UserRole } from "../../../core/enums/user-role.enum";
import { AppError } from "../../../core/errors/AppError";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../../../infrastructure/security/jwt";
import { AuthRepository } from "../repositories/auth.repository";

export class AuthService {
    private authRepository: AuthRepository;

    constructor() {
        this.authRepository = new AuthRepository();
    }

    public async register(userData: { email: string; password: string; role?: UserRole }) {
        const existingUser = await this.authRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error("User already exists");
        }

        const avatarId = uuidv4();
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarId}`;

        const newUser = await this.authRepository.create({
            email: userData.email,
            password: userData.password,
            role: userData.role ?? UserRole.USER,
        });

        // The auth repo create method doesn't accept avatar right now unless we modify the interface,
        // let's do it directly on the model or assume it gets added.
        // Actually, let's just update the user model directly here if the repo doesn't support it.
        const { UserModel } = require("../../users/models/user.model");
        await UserModel.findByIdAndUpdate(newUser._id, { avatar: avatarUrl });

        return {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            avatar: avatarUrl
        };
    }

    public async login(userData: { email: string; password: string }) {
        const user = await this.authRepository.findByEmail(userData.email);
        if (!user) {
            throw new Error("Invalid credentials");
        }

        if (user.status === "SUSPENDED") {
            throw new AppError("Account suspended.", 403, "ACCOUNT_SUSPENDED");
        }
        if (user.status === "INACTIVE") {
            throw new AppError("Account locked due to 180+ days of inactivity. Please contact support.", 403, "ACCOUNT_INACTIVE");
        }

        if (user.lastLoginAt) {
            const daysSinceLastLogin = (new Date().getTime() - user.lastLoginAt.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLastLogin >= 180) {
                const { UserModel } = require("../../users/models/user.model");
                await UserModel.findByIdAndUpdate(user._id, { status: 'INACTIVE' });
                throw new AppError("Dormant Account Takeover anomaly detected. Step-up email MFA required.", 202, "OTP_REQUIRED");
            }
        }

        const isMatch = await user.comparePassword(userData.password);
        if (!isMatch) {
            throw new Error("Invalid credentials");
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
        const refreshToken = generateRefreshToken(tokenPayload);

        return {
            user: {
                id: (user._id as { toString(): string }).toString(),
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

    public async getProfile(userId: string) {
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
