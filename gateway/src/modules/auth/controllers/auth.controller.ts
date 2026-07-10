import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/auth.service';
import { RegistrationSchema, LoginSchema } from '../validators/auth.validation';
import { ApiResponse } from '../../../shared/responses/api-response';
import { rabbitMQClient } from '../../../infrastructure/rabbitmq/connection';
import { ThreatEvent } from '../../../shared/events/threat-event.interface';
import { logger } from '../../../infrastructure/logger/logger';
import { AppError } from '../../../core/errors/AppError';

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
    } catch (error: unknown) {
      ApiResponse.error(res, 400, 'Registration failed', error);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const result = await this.authService.login(validatedData);

      const clientIp = this.extractClientIp(req);
      const correlationId = uuidv4();

      const threatPayload: ThreatEvent = {
        eventId: uuidv4(),
        eventType: 'ThreatLoginEvent',
        userId: String(result.user.id),
        email: result.user.email,
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date().toISOString(),
        correlationId,
        requestId: req.requestId || uuidv4(),
        metadata: {
          burstVelocity: 0.0,
          targetRecipientRatio: 0.0,
          uriHyperlinkDensity: 0.0,
          sessionDwellDuration: 0.0,
          payloadText: 'User login attempt',
        }
      };
      
      rabbitMQClient.publishThreatEvent(threatPayload).catch(err => {
        logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event');
      });

      ApiResponse.success(res, 'User logged in successfully', result, 200);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        if (error.statusCode === 202) {
          ApiResponse.success(res, error.message, { code: error.code }, 202);
          return;
        }
        ApiResponse.error(res, error.statusCode, error.message, error);
        return;
      }
      ApiResponse.error(res, 401, 'Login failed', error);
    }
  };

  public me = async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await this.authService.getProfile(req.user!.id);
      ApiResponse.success(res, 'Profile retrieved', profile);
    } catch (error: unknown) {
      ApiResponse.error(res, 404, 'Profile not found', error);
    }
  };

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }
}
