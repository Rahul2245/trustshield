import { useState } from "react";
import { LogOut, Settings, ShieldAlert, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { useAuthStore } from "@/store/auth";

export function AdminProfileMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const email = user?.email || "admin@trustshield.io";
  const initials = email.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-3 bg-surface border border-border rounded-full pl-1 pr-4 py-1 hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          aria-label="Admin Profile"
        >
          <Avatar.Root className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent-green/20">
            <Avatar.Fallback className="text-sm font-bold text-accent-green">
              {initials}
            </Avatar.Fallback>
          </Avatar.Root>
          <span className="text-sm font-medium text-primary hidden sm:block">
            {email}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[240px] z-50 rounded-xl border border-border bg-surface p-2 shadow-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
          sideOffset={8}
          align="end"
        >
          <div className="flex flex-col gap-1 p-2 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar.Root className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent-green/30 to-accent-blue/30 border border-accent-green/20 shadow-inner">
                <Avatar.Fallback className="text-lg font-bold text-accent-green">
                  {initials}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary">{email}</span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-accent-green" /> Super Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 py-2">
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 focus:bg-primary/5 focus:outline-none transition-colors"
              onClick={() => { setOpen(false); navigate("/settings"); }}
            >
              <User className="h-4 w-4 text-muted" />
              Account Settings
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 focus:bg-primary/5 focus:outline-none transition-colors"
              onClick={() => { setOpen(false); navigate("/settings"); }}
            >
              <Settings className="h-4 w-4 text-muted" />
              Preferences
            </DropdownMenu.Item>
          </div>

          <div className="border-t border-border pt-2">
            <DropdownMenu.Item
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
