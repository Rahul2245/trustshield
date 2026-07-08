import { AccountStatus } from "../../../core/enums";
import { IUser } from "../interfaces/user.interface";
import { UserModel } from "../models/user.model"

export class UserRepository {

    async findByEmail(email: string) {
    return UserModel.findOne({
        email,
    }).select("+passwordHash +refreshTokenHash");
}
    async findById(id: string) {
    return UserModel.findById(id);
}
    async create(user: Partial<IUser>) {
    return UserModel.create(user as any);
}
    async updateLastLogin(userId: string) {
        return UserModel.findByIdAndUpdate(
            userId,
            {
                lastLoginAt: new Date(),
            },
            {
                new: true,
            }
        )
    }

    async incrementFailedAttempts(userId: string) {
    return UserModel.findByIdAndUpdate(userId, {
        $inc: {
            failedLoginAttempts: 1,
        },
    });
}     

    async resetFailedAttempts(userId: string) {
    return UserModel.findByIdAndUpdate(userId, {
        failedLoginAttempts: 0,
        accountLockedUntil: undefined,
    });
}

    async updateRefreshToken(
    userId: string,
    refreshTokenHash: string
) {
    return UserModel.findByIdAndUpdate(userId, {
        refreshTokenHash,
    });
}

    async lockAccount(userId: string, until: Date) {
    return UserModel.findByIdAndUpdate(userId, {
        accountLockedUntil: until,
        status: AccountStatus.LOCKED,
    });
}

}