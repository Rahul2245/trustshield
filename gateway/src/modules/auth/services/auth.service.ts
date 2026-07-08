import { AuthRepository } from '../repositories/auth.repository';
import jwt from 'jsonwebtoken';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  public async register(userData: any): Promise<any> {
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

  public async login(userData: any): Promise<any> {
    const user = await this.authRepository.findByEmail(userData.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(userData.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    await this.authRepository.updateLastLogin((user._id as any).toString());

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      { expiresIn: '7d' }
    );

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
