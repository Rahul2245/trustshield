import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminProfileMenu } from "./AdminProfileMenu";

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
  return (
    <div className="admin-theme min-h-screen bg-background p-4 md:p-6 text-primary font-sans transition-colors duration-300">
      <div className="mx-auto max-w-[1600px] rounded-[16px] bg-surface p-4 shadow-2xl md:p-6 border border-border transition-colors duration-300">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green/10">
              <Shield className="h-5 w-5 text-accent-green" />
            </div>
            <span className="text-xl font-bold tracking-widest text-primary">
              TRUSTSHIELD <span className="text-xs text-accent-green ml-2">ADMIN</span>
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-1 rounded-lg bg-background p-1 border border-border">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent-green/10 text-accent-green shadow-sm"
                      : "text-muted hover:text-primary hover:bg-primary/5"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button onClick={() => { import('sonner').then(m => m.toast.info('Notifications feature coming soon!')); }} variant="ghost" size="icon" className="relative text-muted hover:text-primary">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-green animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </Button>
            
            <AdminProfileMenu />
          </div>
        </header>

        <main className="animate-in fade-in duration-500">{children}</main>
      </div>
    </div>
  );
}
