import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/services/api";
import type { ThreatAlert } from "@/types";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;

  socket = io(wsUrl, {
    path: "/socket.io",
    auth: { token: getAccessToken() },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onThreatAlert(callback: (alert: ThreatAlert) => void): () => void {
  const s = connectSocket();
  s.on("threat:alert", callback);
  return () => {
    s.off("threat:alert", callback);
  };
}

export function getSocket(): Socket | null {
  return socket;
}
