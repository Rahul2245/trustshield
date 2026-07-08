import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { jwtConfig } from "../../config/jwt.config";
import { UserRole } from "../../core/enums/user-role.enum";
import { logger } from "../logger/logger";

export const SECURITY_ADMIN_ROOM = "security_admin_room";

export interface ThreatAlertPayload {
    alertId: string;
    eventId?: string;
    correlationId: string;
    type: "RATE_LIMIT" | "AI_THREAT" | "BLOCK" | "SHADOW";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    userId?: string;
    email?: string;
    ipAddress?: string;
    riskScore?: number;
    action?: string;
    message: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}

interface SocketAuthPayload {
    userId: string;
    role: UserRole;
    sessionId: string;
}

let io: Server | null = null;

export function initializeSocketServer(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: env.FRONTEND_ORIGIN,
            methods: ["GET", "POST"],
            credentials: true,
        },
        path: "/socket.io",
    });

    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers.authorization?.replace("Bearer ", "");

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, jwtConfig.accessSecret) as SocketAuthPayload;

            if (decoded.role !== UserRole.ADMIN && decoded.role !== UserRole.ANALYST) {
                return next(new Error("Admin access required"));
            }

            socket.data.user = decoded;
            next();
        } catch (error) {
            logger.warn(error, "Socket authentication failed");
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket: Socket) => {
        socket.join(SECURITY_ADMIN_ROOM);
        logger.info(
            { userId: socket.data.user?.userId, socketId: socket.id },
            "Admin connected to security room"
        );

        socket.on("disconnect", () => {
            logger.info({ socketId: socket.id }, "Admin disconnected from security room");
        });
    });

    logger.info("Socket.io server initialized");
    return io;
}

export function getSocketServer(): Server | null {
    return io;
}

export function broadcastThreatAlert(alert: ThreatAlertPayload): void {
    if (!io) {
        logger.warn("Socket.io not initialized; alert not broadcast");
        return;
    }

    io.to(SECURITY_ADMIN_ROOM).emit("threat:alert", alert);
    logger.info({ alertId: alert.alertId, type: alert.type }, "Threat alert broadcast");
}
