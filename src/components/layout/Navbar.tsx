"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel } from "@/types";
import {
  Shield,
  BookOpen,
  CalendarDays,
  Activity,
  Trophy,
  Users,
  Settings,
  LogOut,
  User,
  Globe,
  ChevronRight,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { sport, setSport, locale, setLocale, t, user, logout } = useApp();
  const isZh = locale === "zh";

  const sportLower = sport.toLowerCase();

  // Sports Channels metadata
  const sports = [
    { key: "FOOTBALL" as SportChannel, icon: "⚽", labelZh: "足球专区", labelEn: "Football", path: "/football" },
    { key: "VOLLEYBALL" as SportChannel, icon: "🏐", labelZh: "排球专区", labelEn: "Volleyball", path: "/volleyball" },
    { key: "BASKETBALL" as SportChannel, icon: "🏀", labelZh: "篮球专区", labelEn: "Basketball", path: "/basketball" },
  ];

  // Secondary submodules navigation for active sport
  const navTabs = [
    {
      key: "tactics",
      path: `/${sportLower}/tactics`,
      labelZh: "战术宝典",
      labelEn: "Tactics",
      icon: BookOpen,
    },
    {
      key: "schedule",
      path: `/${sportLower}/schedule`,
      labelZh: "训练计划",
      labelEn: "Training",
      icon: CalendarDays,
    },
    {
      key: "recovery",
      path: `/${sportLower}/recovery`,
      labelZh: "身体恢复",
      labelEn: "Recovery",
      icon: Activity,
    },
    {
      key: "matches",
      path: `/${sportLower}/matches`,
      labelZh: "比赛中心",
      labelEn: "Matches",
      icon: Trophy,
    },
    {
      key: "squad",
      path: `/${sportLower}/squad`,
      labelZh: "队伍花名册",
      labelEn: "Squad Roster",
      icon: Users,
    },
  ];

  // Sport color highlights for Bar 2 (Natural Sports Style, no fluorescent glow)
  const getSubBarAccent = () => {
    switch (sport) {
      case "FOOTBALL":
        return {
          activeTab: "bg-emerald-950/70 text-emerald-100 border-b-2 border-emerald-600 font-bold",
          glow: "border-b border-emerald-950/80 bg-[#0A1812]",
        };
      case "VOLLEYBALL":
        return {
          activeTab: "bg-amber-950/70 text-amber-100 border-b-2 border-amber-600 font-bold",
          glow: "border-b border-stone-800 bg-[#16120E]",
        };
      case "BASKETBALL":
        return {
          activeTab: "bg-stone-900 text-stone-100 border-b-2 border-amber-600 font-bold",
          glow: "border-b border-stone-800 bg-[#16110D]",
        };
      default:
        return {
          activeTab: "bg-stone-900 text-white font-bold",
          glow: "border-b border-stone-800 bg-[#121212]",
        };
    }
  };

  const accent = getSubBarAccent();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md">
      {/* ================= BAR 1: 全局专区切换、国际化与用户状态 ================= */}
      <div className="bg-black/85 border-b border-white/10 px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Classical Emblem */}
          <Link
            href={`/${sportLower}`}
            className="flex items-center space-x-3 shrink-0 group select-none"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#140D05] border border-heritage-gold/50 flex items-center justify-center shadow-md p-0.5 group-hover:scale-105 transition-transform">
              <img
                src={`/assets/crests/nkcs-${sportLower}-crest.svg`}
                alt="NKCS Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-serif font-black tracking-wider text-sm lg:text-base text-gold-foil uppercase">
                NKCS SPORTSFLOW
              </span>
              <p className="text-[10px] text-gray-400 -mt-0.5 tracking-tight hidden sm:block">
                {t("appSub")}
              </p>
            </div>
          </Link>

          {/* Center: 3-Sport Classical Channel Switchers */}
          <nav className="flex items-center space-x-1.5 md:space-x-2 bg-white/5 p-1 rounded-full border border-white/10">
            {sports.map((item) => {
              const isSelected = sport === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setSport(item.key)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? item.key === "FOOTBALL"
                        ? "bg-emerald-800 text-stone-100 border border-emerald-700/80 shadow-sm"
                        : item.key === "VOLLEYBALL"
                        ? "bg-amber-800 text-stone-100 border border-amber-700/80 shadow-sm"
                        : "bg-amber-700 text-stone-100 border border-amber-600/80 shadow-sm"
                      : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="hidden sm:inline">
                    {isZh ? item.labelZh : item.labelEn}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Tools: Language Toggle & Profile/Logout */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-gray-300 border border-white/10 transition-colors"
              title={isZh ? "Switch to English" : "切换为中文"}
            >
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold">{locale === "zh" ? "EN" : "中"}</span>
            </button>

            {/* User Session Status */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs text-gray-200"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-5 h-5 rounded-full object-cover border border-heritage-gold/50"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-heritage-antiqueGold" />
                  )}
                  <span className="font-medium hidden md:inline">
                    {isZh ? user.nameZh : user.nameEn}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-heritage-gold font-bold">
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  title={t("logout")}
                  className="p-1.5 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1 rounded-md bg-heritage-gold/20 text-heritage-gold border border-heritage-gold/40 text-xs font-bold hover:bg-heritage-gold/30 transition-colors"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ================= BAR 2: 专区二级功能子模块导航 ================= */}
      <div className={`${accent.glow} px-4 lg:px-8 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1 py-1">
            {/* Quick Home / Brief Link */}
            <Link
              href={`/${sportLower}`}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors ${
                pathname === `/${sportLower}`
                  ? accent.activeTab
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>{t("todayBrief")}</span>
            </Link>

            {/* Submodule Tabs */}
            {navTabs.map((tab) => {
              const isActive = pathname.startsWith(tab.path);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.key}
                  href={tab.path}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-md transition-all whitespace-nowrap ${
                    isActive ? accent.activeTab : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isZh ? tab.labelZh : tab.labelEn}</span>
                </Link>
              );
            })}

            {/* Admin Only: Roster Admin Page */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin/roster"
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-md transition-all whitespace-nowrap ${
                  pathname.startsWith("/admin/roster")
                    ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-400"
                    : "text-purple-400/80 hover:text-purple-300"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t("rosterAdmin")}</span>
              </Link>
            )}
          </div>

          {/* Quick Breadcrumb Indicator on Right */}
          <div className="hidden lg:flex items-center space-x-1.5 text-[11px] text-gray-500 font-mono">
            <span>NKCS</span>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-gray-300 font-bold uppercase">{sport}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
