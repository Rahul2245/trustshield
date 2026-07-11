"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const uuid_1 = require("uuid");
const auth_service_1 = require("../services/auth.service");
const auth_validation_1 = require("../validators/auth.validation");
const api_response_1 = require("../../../shared/responses/api-response");
const connection_1 = require("../../../infrastructure/rabbitmq/connection");
const logger_1 = require("../../../infrastructure/logger/logger");
const AppError_1 = require("../../../core/errors/AppError");
class AuthController {
    authService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    register = async (req, res) => {
        try {
            const validatedData = auth_validation_1.RegistrationSchema.parse(req.body);
            const result = await this.authService.register(validatedData);
            api_response_1.ApiResponse.success(res, 'User registered successfully', result, 201);
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                api_response_1.ApiResponse.error(res, error.statusCode, error.message, error);
                return;
            }
            api_response_1.ApiResponse.error(res, 400, 'Registration failed', error);
        }
    };
    async processLogin(req, res, isAdminLogin) {
        try {
            const validatedData = auth_validation_1.LoginSchema.parse(req.body);
            const result = await this.authService.login(validatedData, isAdminLogin);
            const clientIp = this.extractClientIp(req);
            const correlationId = (0, uuid_1.v4)();
            const threatPayload = {
                eventId: (0, uuid_1.v4)(),
                eventType: 'ThreatLoginEvent',
                userId: String(result.user.id),
                email: result.user.email,
                ipAddress: clientIp,
                userAgent: req.headers['user-agent'] || 'unknown',
                timestamp: new Date().toISOString(),
                correlationId,
                requestId: req.requestId || (0, uuid_1.v4)(),
                metadata: {
                    burstVelocity: 0.0,
                    targetRecipientRatio: 0.0,
                    uriHyperlinkDensity: 0.0,
                    sessionDwellDuration: 0.0,
                    payloadText: isAdminLogin ? 'Admin login attempt' : 'User login attempt',
                }
            };
            connection_1.rabbitMQClient.publishThreatEvent(threatPayload).catch(err => {
                logger_1.logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event');
            });
            const cookieName = isAdminLogin ? 'adminRefreshToken' : 'refreshToken';
            res.cookie(cookieName, result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: result.expiresAt
            });
            // Remove refreshToken from body as it is now in cookie
            const { refreshToken, ...tokensWithoutRefresh } = result.tokens;
            const responseData = { ...result, tokens: tokensWithoutRefresh };
            api_response_1.ApiResponse.success(res, 'User logged in successfully', responseData, 200);
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                if (error.statusCode === 202) {
                    api_response_1.ApiResponse.success(res, error.message, { code: error.code }, 202);
                    return;
                }
                api_response_1.ApiResponse.error(res, error.statusCode, error.message, error);
                return;
            }
            api_response_1.ApiResponse.error(res, 401, 'Login failed', error);
        }
    }
    login = async (req, res) => {
        await this.processLogin(req, res, false);
    };
    adminLogin = async (req, res) => {
        await this.processLogin(req, res, true);
    };
    refresh = async (req, res) => {
        try {
            // Determine context by inspecting the expired access token if provided
            const authHeader = req.headers.authorization;
            let requestedRole = 'USER';
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const expiredToken = authHeader.split(' ')[1];
                try {
                    const jwt = require('jsonwebtoken');
                    const decoded = jwt.decode(expiredToken);
                    if (decoded && decoded.role && decoded.role !== 'USER') {
                        requestedRole = 'ADMIN';
                    }
                }
                catch (e) {
                    // ignore
                }
            }
            const userRefreshToken = req.cookies?.refreshToken;
            const adminRefreshToken = req.cookies?.adminRefreshToken;
            let tokenToUse = requestedRole === 'ADMIN'
                ? (adminRefreshToken || userRefreshToken)
                : (userRefreshToken || adminRefreshToken);
            if (!tokenToUse) {
                api_response_1.ApiResponse.error(res, 401, 'No refresh token cookie found');
                return;
            }
            const result = await this.authService.refresh(tokenToUse);
            const cookieName = result.userRole === 'USER' ? 'refreshToken' : 'adminRefreshToken';
            res.cookie(cookieName, result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: result.expiresAt
            });
            api_response_1.ApiResponse.success(res, 'Token refreshed successfully', { accessToken: result.accessToken }, 200);
        }
        catch (error) {
            // If refresh fails, kill the cookies
            res.clearCookie('refreshToken');
            res.clearCookie('adminRefreshToken');
            if (error instanceof AppError_1.AppError) {
                api_response_1.ApiResponse.error(res, error.statusCode, error.message, error);
                return;
            }
            api_response_1.ApiResponse.error(res, 401, 'Refresh failed', error);
        }
    };
    logout = async (req, res) => {
        try {
            const userRefreshToken = req.cookies?.refreshToken;
            const adminRefreshToken = req.cookies?.adminRefreshToken;
            const tokenToUse = userRefreshToken || adminRefreshToken;
            if (tokenToUse) {
                await this.authService.logout(tokenToUse);
            }
            res.clearCookie('refreshToken');
            res.clearCookie('adminRefreshToken');
            api_response_1.ApiResponse.success(res, 'Logged out successfully', null, 200);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, 'Logout failed', error);
        }
    };
    logoutAll = async (req, res) => {
        try {
            if (!req.user?.id) {
                api_response_1.ApiResponse.error(res, 401, 'Unauthorized');
                return;
            }
            await this.authService.logoutAll(req.user.id);
            res.clearCookie('refreshToken');
            res.clearCookie('adminRefreshToken');
            api_response_1.ApiResponse.success(res, 'Logged out from all devices successfully', null, 200);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, 'Logout all failed', error);
        }
    };
    me = async (req, res) => {
        try {
            const profile = await this.authService.getProfile(req.user.id);
            api_response_1.ApiResponse.success(res, 'Profile retrieved', profile);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 404, 'Profile not found', error);
        }
    };
    extractClientIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.socket.remoteAddress || '127.0.0.1';
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map