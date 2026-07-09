import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/threats", label: "Threats", icon: Shield },
  { to: "/users", label: "Users", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/system", label: "System", icon: Activity },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#111111] p-4 md:p-6 text-white font-sans">
      <div className="mx-auto max-w-[1600px] rounded-[16px] bg-[#1a1a1a] p-4 shadow-2xl md:p-6 border border-[#2a2a2a]">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#2a2a2a] pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00FF9D]/10">
              <Shield className="h-5 w-5 text-[#00FF9D]" />
            </div>
            <span className="text-xl font-bold tracking-widest text-white">TRUSTSHIELD <span className="text-xs text-[#00FF9D] ml-2">ADMIN</span></span>
          </div>

          <nav className="flex flex-wrap items-center gap-1 rounded-lg bg-[#111111] p-1 border border-[#2a2a2a]">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#00FF9D]/10 text-[#00FF9D]"
                      : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00FF9D] animate-pulse" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 bg-[#111111] border border-[#2a2a2a] rounded-full pl-1 pr-4 py-1">
               <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FF9D]/20 text-sm font-bold text-[#00FF9D]">
                 {user?.email?.charAt(0).toUpperCase()}
               </div>
               <span className="text-sm font-medium text-gray-300">{user?.email || 'admin@trustshield.io'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400 hover:text-red-400 hover:bg-[#2a2a2a]">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
