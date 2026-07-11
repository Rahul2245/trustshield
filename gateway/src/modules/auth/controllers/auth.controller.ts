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
      if (error instanceof AppError) {
        ApiResponse.error(res, error.statusCode, error.message, error);
        return;
      }
      ApiResponse.error(res, 400, 'Registration failed', error);
    }
  };

  private async processLogin(req: Request, res: Response, isAdminLogin: boolean): Promise<void> {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const result = await this.authService.login(validatedData, isAdminLogin);

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
          payloadText: isAdminLogin ? 'Admin login attempt' : 'User login attempt',
        }
      };
      
      rabbitMQClient.publishThreatEvent(threatPayload).catch(err => {
        logger.error({ err, eventId: threatPayload.eventId }, 'Failed to publish threat event');
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

      ApiResponse.success(res, 'User logged in successfully', responseData, 200);
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
  }

  public login = async (req: Request, res: Response): Promise<void> => {
    await this.processLogin(req, res, false);
  };

  public adminLogin = async (req: Request, res: Response): Promise<void> => {
    await this.processLogin(req, res, true);
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      // Determine context by inspecting the expired access token if provided
      const authHeader = req.headers.authorization;
      let requestedRole = 'USER';
      if (authHeader && authHeader.startsWith('Bearer ')) {
          const expiredToken = authHeader.split(' ')[1];
          try {
              const jwt = require('jsonwebtoken');
              const decoded = jwt.decode(expiredToken) as any;
              if (decoded && decoded.role && decoded.role !== 'USER') {
                  requestedRole = 'ADMIN';
              }
          } catch (e) {
              // ignore
          }
      }

      const userRefreshToken = req.cookies?.refreshToken;
      const adminRefreshToken = req.cookies?.adminRefreshToken;

      let tokenToUse = requestedRole === 'ADMIN' 
          ? (adminRefreshToken || userRefreshToken) 
          : (userRefreshToken || adminRefreshToken);

      if (!tokenToUse) {
         ApiResponse.error(res, 401, 'No refresh token cookie found');
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

      ApiResponse.success(res, 'Token refreshed successfully', { accessToken: result.accessToken }, 200);
    } catch (error: unknown) {
      // If refresh fails, kill the cookies
      res.clearCookie('refreshToken');
      res.clearCookie('adminRefreshToken');
      if (error instanceof AppError) {
        ApiResponse.error(res, error.statusCode, error.message, error);
        return;
      }
      ApiResponse.error(res, 401, 'Refresh failed', error);
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userRefreshToken = req.cookies?.refreshToken;
      const adminRefreshToken = req.cookies?.adminRefreshToken;
      const tokenToUse = userRefreshToken || adminRefreshToken;

      if (tokenToUse) {
        await this.authService.logout(tokenToUse);
      }

      res.clearCookie('refreshToken');
      res.clearCookie('adminRefreshToken');

      ApiResponse.success(res, 'Logged out successfully', null, 200);
    } catch (error: unknown) {
      ApiResponse.error(res, 500, 'Logout failed', error);
    }
  };

  public logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
         ApiResponse.error(res, 401, 'Unauthorized');
         return;
      }
      await this.authService.logoutAll(req.user.id);

      res.clearCookie('refreshToken');
      res.clearCookie('adminRefreshToken');

      ApiResponse.success(res, 'Logged out from all devices successfully', null, 200);
    } catch (error: unknown) {
      ApiResponse.error(res, 500, 'Logout all failed', error);
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
