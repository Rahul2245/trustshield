import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AlertListener } from "@/components/alerts/AlertListener";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { AlertsPage } from "@/pages/AlertsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { SystemHealthPage } from "@/pages/SystemHealthPage";
import { ThreatDetailPage } from "@/pages/ThreatDetailPage";
import { ThreatsPage } from "@/pages/ThreatsPage";
import { UsersPage } from "@/pages/UsersPage";
import { LandingPage } from "@/pages/LandingPage";
import { CommunityPage } from "@/pages/CommunityPage";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { OrganizationsPage } from "@/pages/OrganizationsPage";
import { OrgDetailPage } from "@/pages/OrgDetailPage";
import { SearchPage } from "@/pages/SearchPage";
import { UserLoginPage } from "@/pages/auth/UserLoginPage";
import { UserRegisterPage } from "@/pages/auth/UserRegisterPage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AlertDetailPage } from "@/pages/AlertDetailPage";
import { ContactUsPage } from "@/pages/ContactUsPage";
import { useAuthStore } from "@/store/auth";

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Toaster />
      {isAuthenticated && <AlertListener />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/post/:postId" element={<PostDetailPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/org/:orgId" element={<OrgDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/login" element={<UserLoginPage />} />
        <Route path="/register" element={<UserRegisterPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/alerts/:alertId" element={<AlertDetailPage />} />
          <Route path="/threats" element={<ThreatsPage />} />
          <Route path="/threats/:eventId" element={<ThreatDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/system" element={<SystemHealthPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
