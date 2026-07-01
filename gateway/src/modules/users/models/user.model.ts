import { Schema, model } from "mongoose";

import { AccountStatus, UserRole } from "../../../core/enums";

import { IUser } from "../interfaces/user.interface";

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        passwordHash: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
        },

        status: {
            type: String,
            enum: Object.values(AccountStatus),
            default: AccountStatus.ACTIVE,
        },

        failedLoginAttempts: {
            type: Number,
            default: 0,
        },

        accountLockedUntil: {
            type: Date,
        },

        lastLoginAt: {
            type: Date,
        },

        refreshTokenHash: {
            type: String,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

export const UserModel = model<IUser>("User", userSchema);