import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegistrationSchema, LoginSchema } from '../validators/auth.validation';
import { ApiResponse } from '../../../shared/responses/api-response';
import { rabbitMQClient } from '../../../infrastructure/rabbitmq/connection';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = RegistrationSchema.parse(req.body);
      const result = await this.authService.register(validatedData);
      ApiResponse.success(res, 'User registered successfully', result, 201);
    } catch (error: any) {
      ApiResponse.error(res, 400, 'Registration failed', error);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const result = await this.authService.login(validatedData);

      // Publish threat event
      const threatPayload = {
        user_id: result.user.id,
        payload_text: 'User login attempt',
        ip: req.ip || req.connection.remoteAddress
      };
      
      await rabbitMQClient.publishThreatEvent(threatPayload);

      ApiResponse.success(res, 'User logged in successfully', result, 200);
    } catch (error: any) {
      ApiResponse.error(res, 401, 'Login failed', error);
    }
  };
}
