import { HydratedDocument } from "mongoose";

import { AccountStatus, UserRole } from "../../../core/enums";

export interface IUser {
    email: string;

    username: string;

    passwordHash: string;

    role: UserRole;

    status: AccountStatus;

    failedLoginAttempts: number;

    accountLockedUntil?: Date;

    lastLoginAt?: Date;

    refreshTokenHash?: string;

    createdAt: Date;

    updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;