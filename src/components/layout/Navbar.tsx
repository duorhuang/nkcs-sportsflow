"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Bell,
  Check,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { sport, setSport, locale, setLocale, t, user, logout } = useApp();
  const isZh = locale === "zh";
  const [showNotifications, setShowNotifications] = React.useState(false);

  const sportLower = sport.toLowerCase();

  // Sports Channels metadata
  const sports = [
    { key: "FOOTBALL" as SportChannel, icon: "⚽", labelZh: "足球专区", labelEn: "Football", path: "/football" },
    { key: "VOLLEYBALL" as SportChannel, icon: "🏐", labelZh: "排球专区", labelEn: "Volleyball", path: "/volleyball" },
    { key: "BASKETBALL" as SportChannel, icon: "🏀", labelZh: "篮球专区", labelEn: "Basketball", path: "/basketball" },
  ];

  const handleSportSwitch = (targetSport: SportChannel, targetPath: string) => {
    setSport(targetSport);
    const currentSegments = pathname.split("/").filter(Boolean);
    if (
      currentSegments[0] === "football" ||
      currentSegments[0] === "volleyball" ||
      currentSegments[0] === "basketball"
    ) {
      const subRoute = currentSegments.slice(1).join("/");
      router.push(`/${targetSport.toLowerCase()}${subRoute ? `/${subRoute}` : ""}`);
    } else {
      router.push(targetPath);
    }
  };

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
      labelEn: "Squad",
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
      <div className="bg-black/90 border-b border-white/10 px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Classical Emblem -> Direct Portal Link */}
          <Link
            href="/"
            className="flex items-center space-x-3 shrink-0 group select-none"
            title={isZh ? "返回 NKCS 体育总门户" : "Return to NKCS Varsity Portal"}
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#140D05] border border-heritage-gold/50 flex items-center justify-center shadow-md p-0.5 group-hover:scale-105 transition-transform">
              <img
                src={`/assets/crests/nkcs-${sportLower}-crest.svg`}
                alt="NKCS Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-black tracking-wider text-sm lg:text-base text-gold-foil uppercase">
                  NKCS SPORTSFLOW
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30 hidden sm:inline">
                  BILINGUAL 双语
                </span>
              </div>
              <p className="text-[10px] text-gray-400 -mt-0.5 tracking-tight hidden sm:block">
                {isZh ? "三大校队专属战术·康复·执教中枢" : "Varsity Tactics, Training & Health Hub"}
              </p>
            </div>
          </Link>

          {/* Center: Portal & 3-Sport Classical Channel Switchers */}
          <nav className="flex items-center space-x-1 md:space-x-1.5 bg-stone-900/95 p-1 rounded-full border border-stone-800">
            {/* Top-Level Portal Link */}
            <Link
              href="/"
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname === "/"
                  ? "bg-amber-600/20 text-amber-300 border border-amber-500/50 shadow-sm"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
              }`}
              title={isZh ? "校园体育总门户" : "Varsity Sports Portal"}
            >
              <span>🏛️</span>
              <span className="hidden md:inline">{isZh ? "总门户 Portal" : "Portal"}</span>
            </Link>

            <span className="w-[1px] h-4 bg-white/10 mx-0.5" />

            {sports.map((item) => {
              const isSelected = sport === item.key && pathname !== "/";
              return (
                <button
                  key={item.key}
                  onClick={() => handleSportSwitch(item.key, item.path)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? item.key === "FOOTBALL"
                        ? "bg-emerald-800 text-stone-100 border border-emerald-700/80 shadow-sm"
                        : item.key === "VOLLEYBALL"
                        ? "bg-amber-800 text-stone-100 border border-amber-700/80 shadow-sm"
                        : "bg-amber-700 text-stone-100 border border-amber-600/80 shadow-sm"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.labelZh}</span>
                  <span className="text-[10px] opacity-75 hidden xl:inline">({item.labelEn})</span>
                </button>
              );
            })}
          </nav>

          {/* Right Tools: Language Toggle & Profile/Logout */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs font-bold text-amber-300 border border-white/10 transition-colors"
              title={isZh ? "Switch to English" : "切换为中文"}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{locale === "zh" ? "🇨🇳 中文 / EN" : "🇬🇧 English / 中"}</span>
            </button>

            {/* Notification Bell Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 rounded-md bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors relative"
                  title={isZh ? "队内通知 / Notifications" : "Team Notifications"}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#141B18] border border-stone-800 shadow-2xl p-3 z-50 animate-fadeIn space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <span className="font-bold text-stone-100 flex items-center space-x-1.5">
                        <Bell className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isZh ? "队内动态 / Notifications" : "Team Notifications"}</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono">3条未读</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="p-2 rounded-lg bg-stone-900/90 border border-stone-800/80">
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-200">
                          <span>📅 今日训练课重点已下发</span>
                          <span className="text-[10px] text-stone-500 font-mono">10m前</span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          主教练发布了今日 16:30 场地 2 的防反与定位球战术科目。
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-stone-900/90 border border-stone-800/80">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                          <span>🏆 赛后 1对1 专属复盘卡</span>
                          <span className="text-[10px] text-stone-500 font-mono">1h前</span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          你收到了一张赛后表现评分卡与 8 分钟针对性疲劳恢复处方。
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-stone-900/90 border border-stone-800/80">
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-200">
                          <span>📖 战术白皮书新相位推演</span>
                          <span className="text-[10px] text-stone-500 font-mono">3h前</span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          更新了经典边后卫套边内切攻防转换动画相位。
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full mt-2 py-1 rounded bg-stone-900 text-[11px] text-stone-400 hover:text-stone-200 transition-colors"
                    >
                      {isZh ? "全部标为已读 / Mark All Read" : "Mark All Read"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* User Session Status */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs text-gray-200"
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
                  <span className="font-bold hidden md:inline">
                    {user.nameZh} / {user.nameEn}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    {user.role === "COACH" ? "教练 COACH" : user.role === "ADMIN" ? "总监 ADMIN" : "队员 ATHLETE"}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold transition-all shadow-sm"
                  title={isZh ? "退出当前账号并切换队伍" : "Sign out of current account"}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">退出 Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition-colors shadow-sm"
              >
                登录 Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ================= BAR 2: 专区二级功能子模块导航 (严格双语对照) ================= */}
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
              <span>{isZh ? "今日聚焦 Overview" : "Overview"}</span>
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
                  <span>{tab.labelZh}</span>
                  <span className="text-[10px] opacity-75 font-normal">({tab.labelEn})</span>
                </Link>
              );
            })}

            {/* Admin / Coach Governance Links */}
            {(user?.role === "ADMIN" || user?.role === "COACH") && (
              <Link
                href="/admin/review"
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-md transition-all whitespace-nowrap ${
                  pathname.startsWith("/admin/review")
                    ? "bg-amber-950/70 text-amber-200 border-b-2 border-amber-600 font-bold"
                    : "text-amber-400/80 hover:text-amber-300"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>共建审核</span>
                <span className="text-[10px] opacity-75 font-normal">(Review)</span>
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <Link
                href="/admin/roster"
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-md transition-all whitespace-nowrap ${
                  pathname.startsWith("/admin/roster")
                    ? "bg-purple-950/70 text-purple-200 border-b-2 border-purple-500 font-bold"
                    : "text-purple-400/80 hover:text-purple-300"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>花名册管理</span>
                <span className="text-[10px] opacity-75 font-normal">(Admin Roster)</span>
              </Link>
            )}
          </div>

          {/* Quick Breadcrumb Indicator on Right */}
          <div className="hidden lg:flex items-center space-x-1.5 text-[11px] text-gray-500 font-mono">
            <span>NKCS</span>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-amber-300 font-bold uppercase">{sport}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
