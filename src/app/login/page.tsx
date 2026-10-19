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
      // Redirect immediately to /football
      router.push("/football");
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
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-heritage-gold/20 via-black/60 to-black/90 border border-heritage-gold/40 shadow-frameGold mb-4">
            <Shield className="w-12 h-12 text-heritage-gold" />
          </div>
          <h1 className="font-serif font-black text-2xl md:text-3xl tracking-wide text-gold-foil">
            NKCS SPORTSFLOW
          </h1>
          <p className="text-sm font-semibold text-gray-200 mt-1">
            {isZh ? "球队战术与综合竞技管理平台" : "Team Tactics & Training Hub"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 tracking-tight">
            {isZh ? "战术代际传承 · 精确日常训练 · 竞技康复自愈" : "Legacy Tactics · Precision Drills · Athletic Recovery"}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-black/75 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-chiseled backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                {t("username")}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / football / volleyball / basketball / zhangwei"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-heritage-gold/60 focus:bg-white/10 text-white text-sm outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-heritage-gold/60 focus:bg-white/10 text-white text-sm outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-gradient-to-r from-heritage-gold via-heritage-antiqueGold to-heritage-brass text-black font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
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
                <strong className="text-emerald-300">⚽ Coach</strong> (football)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("volleyball", "coach123")}
                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-left transition-colors truncate"
              >
                <strong className="text-orange-300">🏐 Coach</strong> (volleyball)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("basketball", "coach123")}
                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-left transition-colors truncate"
              >
                <strong className="text-amber-400">🏀 Coach</strong> (basketball)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("zhangwei", "player123")}
                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-left transition-colors truncate"
              >
                <strong className="text-cyan-300">🏃 Athlete</strong> (zhangwei)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("liming", "player123")}
                className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-left transition-colors truncate"
              >
                <strong className="text-amber-300">🏆 Legend</strong> (liming)
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
