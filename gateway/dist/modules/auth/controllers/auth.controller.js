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
    login = async (req, res) => {
        try {
            const validatedData = auth_validation_1.LoginSchema.parse(req.body);
            const result = await this.authService.login(validatedData);
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
                    payloadText: 'User login attempt',
                }
            };
            connection_1.rabbitMQClient.publishThreatEvent(threatPayload).catch(err => {
                logger_1.logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event');
            });
            api_response_1.ApiResponse.success(res, 'User logged in successfully', result, 200);
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                api_response_1.ApiResponse.error(res, error.statusCode, error.message, error);
                return;
            }
            api_response_1.ApiResponse.error(res, 401, 'Login failed', error);
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