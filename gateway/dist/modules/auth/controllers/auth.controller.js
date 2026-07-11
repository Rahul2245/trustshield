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
            api_response_1.ApiResponse.error(res, 400, 'Registration failed', error);
        }
    };
    setRefreshCookie(res, token, rememberMe, isAdmin) {
        const cookieName = isAdmin ? 'admin_refresh_token' : 'user_refresh_token';
        const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 5 * 60 * 60 * 1000;
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge,
            path: '/'
        });
    }
    clearRefreshCookie(res, isAdmin) {
        const cookieName = isAdmin ? 'admin_refresh_token' : 'user_refresh_token';
        res.clearCookie(cookieName, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
    }
    login = async (req, res) => {
        await this.processLogin(req, res, false);
    };
    adminLogin = async (req, res) => {
        await this.processLogin(req, res, true);
    };
    processLogin = async (req, res, isAdmin) => {
        try {
            const schema = isAdmin ? auth_validation_1.AdminLoginSchema : auth_validation_1.LoginSchema;
            const validatedData = schema.parse(req.body);
            const result = await this.authService.login(validatedData, isAdmin);
            this.setRefreshCookie(res, result.tokens.refreshToken, validatedData.rememberMe, isAdmin);
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
                    payloadText: `${isAdmin ? 'Admin' : 'User'} login attempt`,
                }
            };
            connection_1.rabbitMQClient.publishThreatEvent(threatPayload).catch(err => {
                logger_1.logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event');
            });
            // Remove refresh token from response body to strictly use cookies
            const responseData = {
                user: result.user,
                tokens: {
                    accessToken: result.tokens.accessToken
                }
            };
            api_response_1.ApiResponse.success(res, 'Logged in successfully', responseData, 200);
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
    };
    refresh = async (req, res) => {
        try {
            const isAdminRoute = req.path.includes('/admin');
            const cookieName = isAdminRoute ? 'admin_refresh_token' : 'user_refresh_token';
            const refreshToken = req.cookies?.[cookieName];
            if (!refreshToken) {
                api_response_1.ApiResponse.error(res, 401, 'No refresh token provided');
                return;
            }
            const result = await this.authService.refresh(refreshToken);
            this.setRefreshCookie(res, result.refreshToken, true, isAdminRoute); // keep session rolling
            api_response_1.ApiResponse.success(res, 'Token refreshed', { accessToken: result.accessToken });
        }
        catch (error) {
            const isAdminRoute = req.path.includes('/admin');
            this.clearRefreshCookie(res, isAdminRoute);
            if (error instanceof AppError_1.AppError) {
                api_response_1.ApiResponse.error(res, error.statusCode, error.message, error);
                return;
            }
            api_response_1.ApiResponse.error(res, 401, 'Refresh failed', error);
        }
    };
    logout = async (req, res) => {
        try {
            const isAdminRoute = req.path.includes('/admin');
            const cookieName = isAdminRoute ? 'admin_refresh_token' : 'user_refresh_token';
            const refreshToken = req.cookies?.[cookieName];
            if (refreshToken) {
                await this.authService.logout(refreshToken);
            }
            this.clearRefreshCookie(res, isAdminRoute);
            api_response_1.ApiResponse.success(res, 'Logged out successfully', null);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 500, 'Logout failed', error);
        }
    };
    logoutAll = async (req, res) => {
        try {
            const isAdminRoute = req.path.includes('/admin');
            await this.authService.logoutAll(req.user.id);
            this.clearRefreshCookie(res, isAdminRoute);
            api_response_1.ApiResponse.success(res, 'Logged out from all devices successfully', null);
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