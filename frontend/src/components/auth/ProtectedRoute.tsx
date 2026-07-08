import { Navigate, Outlet } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/auth";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
