"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Zap, BookOpen, Calendar, Activity, Users } from "lucide-react";

export const MobileTabBar: React.FC = () => {
  const pathname = usePathname();
  const { sport, locale } = useApp();
  const isZh = locale === "zh";
  const sportLower = sport.toLowerCase();

  const tabs = [
    {
      path: `/${sportLower}`,
      exact: true,
      labelZh: "速览",
      labelEn: "Brief",
      icon: Zap,
    },
    {
      path: `/${sportLower}/tactics`,
      exact: false,
      labelZh: "战术",
      labelEn: "Tactics",
      icon: BookOpen,
    },
    {
      path: `/${sportLower}/schedule`,
      exact: false,
      labelZh: "训练",
      labelEn: "Drills",
      icon: Calendar,
    },
    {
      path: `/${sportLower}/recovery`,
      exact: false,
      labelZh: "恢复",
      labelEn: "Recovery",
      icon: Activity,
    },
    {
      path: `/${sportLower}/squad`,
      exact: false,
      labelZh: "队员",
      labelEn: "Squad",
      icon: Users,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/90 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.path
          : pathname.startsWith(tab.path);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-lg transition-colors ${
              isActive
                ? "text-heritage-gold font-bold bg-white/5"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-heritage-gold" : "text-gray-400"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">
              {isZh ? tab.labelZh : tab.labelEn}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileTabBar;
