"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECURITY_ADMIN_ROOM = void 0;
exports.initializeSocketServer = initializeSocketServer;
exports.getSocketServer = getSocketServer;
exports.broadcastThreatAlert = broadcastThreatAlert;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const jwt_config_1 = require("../../config/jwt.config");
const user_role_enum_1 = require("../../core/enums/user-role.enum");
const logger_1 = require("../logger/logger");
exports.SECURITY_ADMIN_ROOM = "security_admin_room";
let io = null;
function initializeSocketServer(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.FRONTEND_ORIGIN,
            methods: ["GET", "POST"],
            credentials: true,
        },
        path: "/socket.io",
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers.authorization?.replace("Bearer ", "");
            if (!token) {
                return next(new Error("Authentication required"));
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.accessSecret);
            if (decoded.role !== user_role_enum_1.UserRole.ADMIN && decoded.role !== user_role_enum_1.UserRole.ANALYST) {
                return next(new Error("Admin access required"));
            }
            socket.data.user = decoded;
            next();
        }
        catch (error) {
            logger_1.logger.warn(error, "Socket authentication failed");
            next(new Error("Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        socket.join(exports.SECURITY_ADMIN_ROOM);
        logger_1.logger.info({ userId: socket.data.user?.userId, socketId: socket.id }, "Admin connected to security room");
        socket.on("disconnect", () => {
            logger_1.logger.info({ socketId: socket.id }, "Admin disconnected from security room");
        });
    });
    logger_1.logger.info("Socket.io server initialized");
    return io;
}
function getSocketServer() {
    return io;
}
function broadcastThreatAlert(alert) {
    if (!io) {
        logger_1.logger.warn("Socket.io not initialized; alert not broadcast");
        return;
    }
    io.to(exports.SECURITY_ADMIN_ROOM).emit("threat:alert", alert);
    logger_1.logger.info({ alertId: alert.alertId, type: alert.type }, "Threat alert broadcast");
}
//# sourceMappingURL=socket.js.map