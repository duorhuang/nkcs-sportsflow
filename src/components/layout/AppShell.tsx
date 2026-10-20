"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import MobileTabBar from "@/components/layout/MobileTabBar";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { sport } = useApp();
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#090C10] text-[#EDEDED]">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-[#EDEDED] antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {isOffline && (
        <div className="bg-amber-950/90 text-amber-200 text-xs px-4 py-1.5 text-center font-bold flex items-center justify-center space-x-2 border-b border-amber-700/80 z-50">
          <span>⚠️ 场边离线模式已激活 · 已启用 PWA 本地缓存，您可无网查阅战术白皮书与康复指南</span>
        </div>
      )}
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
};

export default AppShell;
