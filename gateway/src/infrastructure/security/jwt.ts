import jwt from "jsonwebtoken";

import { jwtConfig } from "../../config/jwt.config";
import { UserRole } from "../../core/enums";

export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    sessionId: string;
}

export function generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(
        payload,
        jwtConfig.accessSecret,
        {
            expiresIn: jwtConfig.accessExpiresIn,
        }
    );
}

export function generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(
        payload,
        jwtConfig.refreshSecret,
        {
            expiresIn: jwtConfig.refreshExpiresIn,
        }
    );
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(
        token,
        jwtConfig.accessSecret
    ) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(
        token,
        jwtConfig.refreshSecret
    ) as JwtPayload;
}