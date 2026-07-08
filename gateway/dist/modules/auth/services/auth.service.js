"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_repository_1 = require("../repositories/auth.repository");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    authRepository;
    constructor() {
        this.authRepository = new auth_repository_1.AuthRepository();
    }
    async register(userData) {
        const existingUser = await this.authRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const newUser = await this.authRepository.create({
            email: userData.email,
            password: userData.password
        });
        return {
            id: newUser._id,
            email: newUser.email
        };
    }
    async login(userData) {
        const user = await this.authRepository.findByEmail(userData.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isMatch = await user.comparePassword(userData.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        await this.authRepository.updateLastLogin(user._id.toString());
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', { expiresIn: '7d' });
        return {
            user: {
                id: user._id,
                email: user.email
            },
            tokens: {
                accessToken,
                refreshToken
            }
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map