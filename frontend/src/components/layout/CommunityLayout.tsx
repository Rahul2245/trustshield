import React from "react";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { AlertListener } from "../alerts/AlertListener";
import { useAuthStore } from "@/store/auth";
import { AlertTriangle } from "lucide-react";

export const CommunityLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-white">
      <AlertListener />
      
      <div className="max-w-7xl mx-auto flex">
        {/* Left Nav */}
        <div className="w-16 md:w-64 shrink-0">
          <LeftSidebar />
        </div>

        {/* Main Feed/Content */}
        <main className="flex-1 min-h-screen border-r border-slate-200 sm:w-[600px] max-w-[600px] xl:max-w-[700px] pb-24">
          {user?.isUnderInvestigation && (
            <div className="bg-red-50 border-b border-red-200 p-4 sticky top-0 z-50 shadow-sm flex items-start gap-3">
              <AlertTriangle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-bold text-sm">Action Required: Account Restricted</h3>
                <p className="text-red-700 text-sm mt-1">
                  🚨 You are at risk. Your account is under investigation for suspicious activity. You are not allowed to send messages in the community until an admin makes a decision.
                </p>
              </div>
            </div>
          )}
          {children}
        </main>

        {/* Right Nav */}
        <div className="hidden lg:block w-80 shrink-0">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};
