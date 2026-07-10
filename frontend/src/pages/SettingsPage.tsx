import { useState } from "react";
import { User, Bell, Palette, Upload, Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";
import * as Switch from "@radix-ui/react-switch";
import * as Avatar from "@radix-ui/react-avatar";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"account" | "preferences" | "theme">("account");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "system">("dark");

  const email = user?.email || "admin@trustshield.io";
  const initials = email.substring(0, 2).toUpperCase();

  const handleSave = () => {
    toast.success("Settings saved successfully.");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
        <p className="mt-1 text-muted">
          Manage your account settings, preferences, and workspace theme.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <button
            onClick={() => setActiveTab("account")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "account" ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted hover:bg-primary/5 hover:text-primary"}`}
          >
            <User className="h-5 w-5" /> Account Profile
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "preferences" ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted hover:bg-primary/5 hover:text-primary"}`}
          >
            <Bell className="h-5 w-5" /> Preferences
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "theme" ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted hover:bg-primary/5 hover:text-primary"}`}
          >
            <Palette className="h-5 w-5" /> Theme
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-surface border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
          {activeTab === "account" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-primary border-b border-border pb-4">Account Profile</h2>
              
              <div className="flex items-center gap-6">
                <Avatar.Root className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent-green/30 to-accent-blue/30 border-2 border-accent-green/20 shadow-inner">
                  <Avatar.Fallback className="text-2xl font-bold text-accent-green">
                    {initials}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div className="space-y-2">
                  <Button variant="outline" className="gap-2 text-primary border-border hover:bg-primary/5">
                    <Upload className="h-4 w-4" /> Upload new picture
                  </Button>
                  <p className="text-xs text-muted">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid gap-4 mt-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted uppercase tracking-wider">Email Address</label>
                  <input 
                    type="text" 
                    value={email}
                    disabled
                    className="w-full bg-primary/5 border border-border rounded-lg px-4 py-2 text-primary opacity-70 cursor-not-allowed outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted uppercase tracking-wider">Role</label>
                  <input 
                    type="text" 
                    value="Super Admin"
                    disabled
                    className="w-full bg-primary/5 border border-border rounded-lg px-4 py-2 text-primary opacity-70 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="bg-accent-blue hover:bg-accent-blue/90 text-white">Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-primary border-b border-border pb-4">Notification & Security Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-border/50 hover:bg-primary/10 transition-colors">
                  <div className="space-y-0.5">
                    <label className="text-base font-medium text-primary">Email Notifications</label>
                    <p className="text-sm text-muted">Receive a daily digest of threat activity.</p>
                  </div>
                  <Switch.Root 
                    checked={emailAlerts}
                    onCheckedChange={setEmailAlerts}
                    className="w-[42px] h-[25px] bg-border rounded-full relative shadow-inner focus:outline-none focus:ring-2 focus:ring-accent-blue data-[state=checked]:bg-accent-green transition-colors duration-200"
                  >
                    <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
                  </Switch.Root>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-border/50 hover:bg-primary/10 transition-colors">
                  <div className="space-y-0.5">
                    <label className="text-base font-medium text-primary">SMS Alerts for Critical Threats</label>
                    <p className="text-sm text-muted">Immediate text messages for high severity alerts.</p>
                  </div>
                  <Switch.Root 
                    checked={smsAlerts}
                    onCheckedChange={setSmsAlerts}
                    className="w-[42px] h-[25px] bg-border rounded-full relative shadow-inner focus:outline-none focus:ring-2 focus:ring-accent-blue data-[state=checked]:bg-accent-green transition-colors duration-200"
                  >
                    <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
                  </Switch.Root>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-border/50 hover:bg-primary/10 transition-colors">
                  <div className="space-y-0.5">
                    <label className="text-base font-medium text-primary">Auto-lock Session</label>
                    <p className="text-sm text-muted">Require re-authentication after 15 minutes of inactivity.</p>
                  </div>
                  <Switch.Root 
                    checked={autoLock}
                    onCheckedChange={setAutoLock}
                    className="w-[42px] h-[25px] bg-border rounded-full relative shadow-inner focus:outline-none focus:ring-2 focus:ring-accent-blue data-[state=checked]:bg-accent-green transition-colors duration-200"
                  >
                    <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
                  </Switch.Root>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="bg-accent-blue hover:bg-accent-blue/90 text-white">Save Preferences</Button>
              </div>
            </div>
          )}

          {activeTab === "theme" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-primary border-b border-border pb-4">Workspace Theme</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setThemeMode("light")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${themeMode === "light" ? "border-accent-blue bg-accent-blue/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-border bg-primary/5 hover:border-border/80"}`}
                >
                  <div className="w-full h-24 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col p-2 gap-2">
                    <div className="w-1/2 h-2 bg-gray-200 rounded" />
                    <div className="w-full h-12 bg-gray-100 rounded mt-auto" />
                  </div>
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Sun className="h-4 w-4" /> Light
                  </div>
                </button>
                
                <button
                  onClick={() => setThemeMode("dark")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${themeMode === "dark" ? "border-accent-blue bg-accent-blue/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-border bg-primary/5 hover:border-border/80"}`}
                >
                  <div className="w-full h-24 bg-slate-900 rounded-lg border border-slate-700 shadow-sm flex flex-col p-2 gap-2">
                    <div className="w-1/2 h-2 bg-slate-700 rounded" />
                    <div className="w-full h-12 bg-slate-800 rounded mt-auto" />
                  </div>
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Moon className="h-4 w-4" /> Dark
                  </div>
                </button>

                <button
                  onClick={() => setThemeMode("system")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${themeMode === "system" ? "border-accent-blue bg-accent-blue/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-border bg-primary/5 hover:border-border/80"}`}
                >
                  <div className="w-full h-24 bg-gradient-to-r from-white to-slate-900 rounded-lg border border-gray-400 shadow-sm flex flex-col p-2 gap-2 overflow-hidden">
                    <div className="w-1/2 h-2 bg-gray-300 rounded mix-blend-difference" />
                    <div className="w-full h-12 bg-gray-500/50 rounded mt-auto backdrop-blur-sm" />
                  </div>
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Monitor className="h-4 w-4" /> System
                  </div>
                </button>
              </div>

              <p className="text-sm text-muted mt-4">
                Note: The Admin Dashboard currently forces the dark theme for optimal data visualization. This toggle updates your community-facing profile.
              </p>
              
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="bg-accent-blue hover:bg-accent-blue/90 text-white">Save Theme</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
