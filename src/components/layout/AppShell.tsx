"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import MobileTabBar from "@/components/layout/MobileTabBar";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { sport } = useApp();

  const isLoginPage = pathname === "/login";

  // Dynamic texture class according to current active sport
  const getSportTexture = () => {
    switch (sport) {
      case "FOOTBALL":
        return "texture-pitch text-gray-100";
      case "VOLLEYBALL":
        return "texture-maple text-amber-50";
      case "BASKETBALL":
        return "texture-hardwood text-stone-100";
      default:
        return "texture-pitch text-gray-100";
    }
  };

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#0A1A14]">{children}</main>;
  }

  return (
    <div className={`min-h-screen flex flex-col ${getSportTexture()} transition-colors duration-500`}>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
};

export default AppShell;
