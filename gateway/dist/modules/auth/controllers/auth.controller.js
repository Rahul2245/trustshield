"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const auth_validation_1 = require("../validators/auth.validation");
const api_response_1 = require("../../../shared/responses/api-response");
const connection_1 = require("../../../infrastructure/rabbitmq/connection");
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
            // Publish threat event
            const threatPayload = {
                user_id: result.user.id,
                payload_text: 'User login attempt',
                ip: req.ip || req.connection.remoteAddress
            };
            await connection_1.rabbitMQClient.publishThreatEvent(threatPayload);
            api_response_1.ApiResponse.success(res, 'User logged in successfully', result, 200);
        }
        catch (error) {
            api_response_1.ApiResponse.error(res, 401, 'Login failed', error);
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map