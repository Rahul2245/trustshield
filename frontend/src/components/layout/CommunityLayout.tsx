import React from "react";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { AlertListener } from "../alerts/AlertListener";

export const CommunityLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
