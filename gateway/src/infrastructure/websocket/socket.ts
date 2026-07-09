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

            // Allow both ADMINs and regular USERs for different rooms
            if (decoded.role === UserRole.ADMIN || decoded.role === UserRole.ANALYST) {
                socket.data.isAdmin = true;
            } else {
                socket.data.isAdmin = false;
            }

            socket.data.user = decoded;
            next();
        } catch (error) {
            logger.warn(error, "Socket authentication failed");
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const userId = socket.data.user?.userId;
        
        // Join personalized notification room
        if (userId) {
            socket.join(`user_${userId}`);
        }

        // Admins join security room
        if (socket.data.isAdmin) {
            socket.join(SECURITY_ADMIN_ROOM);
            logger.info({ userId, socketId: socket.id }, "Admin connected to security room");
        } else {
            // Regular users join public feed room
            socket.join("public_feed");
            logger.info({ userId, socketId: socket.id }, "User connected to public feed");
        }

        socket.on("disconnect", () => {
            logger.info({ socketId: socket.id }, "Socket disconnected");
        });
    });

    logger.info("Socket.io server initialized");
    return io;
}

export function getSocketServer(): Server | null {
    return io;
}

export function broadcastThreatAlert(alert: ThreatAlertPayload): void {
    if (!io) return;
    io.to(SECURITY_ADMIN_ROOM).emit("threat:alert", alert);
    logger.info({ alertId: alert.alertId, type: alert.type }, "Threat alert broadcast");
}

export function broadcastNewPost(post: any): void {
    if (!io) return;
    io.to("public_feed").emit("feed:new_post", post);
}

export function broadcastNewComment(comment: any): void {
    if (!io) return;
    io.to("public_feed").emit("feed:new_comment", comment);
}

export function broadcastUserNotification(userId: string, notification: any): void {
    if (!io) return;
    io.to(`user_${userId}`).emit("user:notification", notification);
}

export function broadcastSystemMetrics(metrics: any): void {
    if (!io) return;
    io.to(SECURITY_ADMIN_ROOM).emit("dashboard:metrics", metrics);
}
