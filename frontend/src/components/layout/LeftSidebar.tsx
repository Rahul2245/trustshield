import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Users, Bell, User as UserIcon, Shield } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export const LeftSidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    { label: "Home", icon: Home, path: "/community" },
    { label: "Explore", icon: Compass, path: "/explore" },
    { label: "Organizations", icon: Users, path: "/organizations" },
    { label: "Notifications", icon: Bell, path: "/notifications" },
    { label: "Profile", icon: UserIcon, path: "/profile" },
  ];

  return (
    <aside className="fixed hidden md:flex flex-col w-64 h-screen pt-4 pb-8 px-4 border-r border-slate-200">
      <Link to="/community" className="flex items-center gap-2 px-4 mb-8">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
          <Shield size={16} />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">EchoSphere</span>
      </Link>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/community' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-full text-[17px] font-medium transition-all ${
                isActive 
                  ? "bg-slate-100 text-slate-900 font-bold" 
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-slate-900" : "text-slate-700"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button className="w-full mt-4 py-3.5 bg-orange-500 text-white rounded-full font-bold text-[17px] hover:bg-orange-600 transition-colors shadow-sm">
        Post
      </button>

      {user ? (
        <Link to="/profile" className="flex items-center gap-3 mt-auto p-3 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="User Avatar" className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="flex flex-col flex-1 truncate">
            <span className="font-semibold text-slate-900 text-sm truncate">{user.email.split('@')[0]}</span>
            <span className="text-slate-500 text-sm truncate">@{user.email.split('@')[0]}</span>
          </div>
        </Link>
      ) : (
        <div className="mt-auto flex flex-col gap-3 p-3">
          <Link to="/login" className="w-full py-3 bg-slate-900 text-white text-center rounded-full font-bold text-[15px] hover:bg-slate-800 transition-colors shadow-sm">
            Log in
          </Link>
          <Link to="/register" className="w-full py-3 bg-white text-slate-900 text-center border-2 border-slate-200 rounded-full font-bold text-[15px] hover:bg-slate-50 transition-colors">
            Sign up
          </Link>
        </div>
      )}
    </aside>
  );
};
