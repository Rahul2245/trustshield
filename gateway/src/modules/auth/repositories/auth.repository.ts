import mongoose from 'mongoose';
import { UserModel, IUser } from '../../users/models/user.model';
import { RefreshTokenModel, IRefreshToken } from '../models/refresh-token.model';

export class AuthRepository {
  public async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }).exec();
  }

  public async findById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId).exec();
  }

  public async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(userData);
    return user.save();
  }

  public async updateLastLogin(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { lastLoginAt: new Date() }).exec();
  }

  public async saveRefreshToken(data: {
    tokenHash: string;
    userId: mongoose.Types.ObjectId;
    sessionId: string;
    expiresAt: Date;
    revoked: boolean;
  }): Promise<void> {
    await RefreshTokenModel.create(data);
  }

  public async findBySessionId(sessionId: string): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findOne({ sessionId }).exec();
  }

  public async deleteBySessionId(sessionId: string): Promise<void> {
    await RefreshTokenModel.findOneAndDelete({ sessionId }).exec();
  }

  public async deleteAllRefreshTokens(userId: string): Promise<void> {
    await RefreshTokenModel.deleteMany({ userId }).exec();
  }
}