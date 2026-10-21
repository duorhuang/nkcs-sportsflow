"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Shield, Lock, User, AlertCircle, ArrowRight, Award } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale, refreshUser } = useApp();
  const isZh = locale === "zh";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      await refreshUser();
      let targetPath = "/football";
      const u = username.toLowerCase();
      if (u.includes("volleyball")) targetPath = "/volleyball";
      else if (u.includes("basketball")) targetPath = "/basketball";
      else if (u === "admin") targetPath = "/";
      router.push(targetPath);
      router.refresh();
    } catch {
      setError("An unexpected network error occurred");
      setLoading(false);
    }
  };

  // Quick preset login helper for testing
  const selectPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen texture-pitch flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-heritage-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher on Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          className="px-3 py-1.5 rounded-full bg-black/60 border border-white/15 text-xs text-gray-300 hover:text-white hover:border-white/30 transition-colors font-medium flex items-center space-x-1.5"
        >
          <span>{locale === "zh" ? "English" : "中文"}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Classical Collegiate Header Emblem */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#1C1408] via-black to-[#0A0703] border-2 border-heritage-gold/50 shadow-2xl mb-4 w-24 h-28 items-center justify-center">
            <img
              src="/assets/crests/nkcs-football-crest.svg"
              alt="NKCS Crest"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-serif font-black text-2xl md:text-3xl tracking-wide text-gold-foil">
            NKCS SPORTSFLOW
          </h1>
          <p className="text-sm font-semibold text-gray-200 mt-1">
            {isZh ? "NKCS 球队战术与综合竞技管理平台" : "Team Tactics & Training Hub"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 tracking-tight">
            {isZh ? "战术代际传承 · 精确日常训练 · 竞技康复自愈" : "Legacy Tactics · Precision Drills · Athletic Recovery"}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#121A16] border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-center space-x-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                {t("username")}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / football / volleyball / basketball / zhangwei"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-white text-sm outline-none transition-all placeholder:text-stone-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-white text-sm outline-none transition-all placeholder:text-stone-500 focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-sm tracking-wider active:scale-[0.99] transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <span>{loading ? (isZh ? "验证凭证中..." : "Authenticating...") : t("signIn")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Preset Chips for Fast Role Exploration */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 text-center">
              {isZh ? "一键快捷测试账号体验" : "Quick Role Presets"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => selectPreset("admin", "admin123")}
                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-left transition-colors truncate"
              >
                <strong className="text-purple-300">🛡️ Admin</strong> (admin)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("football", "coach123")}
                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-left transition-colors truncate"
              >
                <strong className="text-emerald-300">⚽ Football</strong> (coach)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("volleyball", "coach123")}
                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-left transition-colors truncate"
              >
                <strong className="text-orange-300">🏐 Volleyball</strong> (coach)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("basketball", "coach123")}
                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-left transition-colors truncate"
              >
                <strong className="text-amber-400">🏀 Basketball</strong> (coach)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-gray-500 mt-6">
          © 2026 NKCS Athletics Department · Confidential Team Tactics Hub
        </p>
      </div>
    </div>
  );
}
