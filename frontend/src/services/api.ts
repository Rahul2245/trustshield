import axios from "axios";

import type {
  ApiResponse,
  AuthTokens,
  DashboardStats,
  PaginatedResponse,
  ThreatAlert,
  ThreatLog,
  TrendPoint,
  User,
} from "@/types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Allow sending HttpOnly cookies
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Attach access token to headers
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Automatic token rotation interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent intercepting auth routes to allow them to handle their own errors (e.g. wrong password)
    if (
      originalRequest.url === "/api/v1/auth/refresh" ||
      originalRequest.url === "/api/v1/auth/login" ||
      originalRequest.url === "/api/v1/auth/admin-login"
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // The HttpOnly refresh token cookie will be sent automatically
        const { data } = await axios.post<{ data: { accessToken: string } }>(
          `${api.defaults.baseURL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        setAccessToken(data.data.accessToken);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. cookie expired or revoked). Clear state and force relogin
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  const { data } = await api.post<
    ApiResponse<{ user: User; tokens: AuthTokens }>
  >("/api/v1/auth/login", { email, password });
  return data.data;
}

export async function adminLogin(email: string, password: string) {
  const { data } = await api.post<
    ApiResponse<{ user: User; tokens: AuthTokens }>
  >("/api/v1/auth/admin-login", { email, password });
  return data.data;
}

export async function logout() {
  await api.post("/api/v1/auth/logout");
  setAccessToken(null);
}

export async function getProfile() {
  const { data } = await api.get<ApiResponse<User>>("/api/v1/auth/me");
  return data.data;
}

export async function getDashboardStats() {
  const { data } = await api.get<ApiResponse<DashboardStats>>(
    "/api/v1/admin/stats"
  );
  return data.data;
}

export async function getThreatTrend(days = 7) {
  const { data } = await api.get<ApiResponse<TrendPoint[]>>(
    "/api/v1/admin/trend",
    { params: { days } }
  );
  return data.data;
}

export async function getThreats(params: {
  page?: number;
  limit?: number;
  action?: string;
  minRisk?: number;
  search?: string;
}) {
  const { data } = await api.get<ApiResponse<PaginatedResponse<ThreatLog>>>(
    "/api/v1/admin/threats",
    { params }
  );
  return data.data;
}

export async function getThreatById(eventId: string) {
  const { data } = await api.get<ApiResponse<ThreatLog>>(
    `/api/v1/admin/threats/${eventId}`
  );
  return data.data;
}

export async function getAlerts(params: {
  page?: number;
  limit?: number;
  acknowledged?: boolean;
}) {
  const { data } = await api.get<ApiResponse<PaginatedResponse<ThreatAlert>>>(
    "/api/v1/admin/alerts",
    { params }
  );
  return data.data;
}

export async function getAlertById(alertId: string) {
  const { data } = await api.get<ApiResponse<ThreatAlert & { auditLogs?: any[] }>>(
    `/api/v1/admin/alerts/${alertId}`
  );
  return data.data;
}

export async function acknowledgeAlert(alertId: string, payload: { decision: string, resolution: string, userStatus?: string, remarks: string }) {
  const { data } = await api.patch<ApiResponse<ThreatAlert>>(
    `/api/v1/admin/alerts/${alertId}/acknowledge`,
    payload
  );
  return data.data;
}

export async function lockAlert(alertId: string) {
  const { data } = await api.post<ApiResponse<{ locked: boolean }>>(
    `/api/v1/admin/alerts/${alertId}/lock`
  );
  return data.data;
}

export async function getUsers(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { data } = await api.get<ApiResponse<PaginatedResponse<User>>>(
    "/api/v1/admin/users",
    { params }
  );
  return data.data;
}

export async function updateUserStatus(
  userId: string,
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
) {
  const { data } = await api.patch<ApiResponse<User>>(
    `/api/v1/admin/users/${userId}/status`,
    { status }
  );
  return data.data;
}

export async function getGatewayHealth() {
  const { data } = await api.get("/health");
  return data;
}

export async function getAiWorkerHealth() {
  const aiUrl = import.meta.env.VITE_AI_WORKER_URL || "http://localhost:8000";
  const { data } = await axios.get(`${aiUrl}/api/v1/health`);
  return data;
}
