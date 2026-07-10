import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  getProfile,
  login as apiLogin,
  setAccessToken,
} from "@/services/api";
import { connectSocket, disconnectSocket } from "@/services/socket";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = await apiLogin(email, password);

          const validRoles = ["ADMIN", "ANALYST", "SUPER_ADMIN", "SECURITY_ADMIN", "MODERATOR"];
          if (!validRoles.includes(result.user.role)) {
            throw new Error("Admin or Analyst access required");
          }

          setAccessToken(result.tokens.accessToken);
          set({
            user: result.user,
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          connectSocket();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        setAccessToken(null);
        disconnectSocket();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      hydrate: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        setAccessToken(accessToken);
        try {
          const user = await getProfile();
          const validRoles = ["ADMIN", "ANALYST", "SUPER_ADMIN", "SECURITY_ADMIN", "MODERATOR"];
          if (!validRoles.includes(user.role)) {
            get().logout();
            return;
          }
          set({ user, isAuthenticated: true });
          connectSocket();
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: "trustshield-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
