import { UserModel, IUser } from '../../users/models/user.model';

export class AuthRepository {
  public async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }).exec();
  }

  public async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(userData);
    return user.save();
  }

  public async updateLastLogin(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { lastLoginAt: new Date() }).exec();
  }
}