"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { SportChannel } from "@/types";
import {
  User,
  Shield,
  Crown,
  Award,
  Star,
  CheckCircle,
  Flame,
  Calendar,
  LogOut,
} from "lucide-react";

export default function ProfilePage() {
  const { user, locale, sport, setSport, logout } = useApp();
  const isZh = locale === "zh";

  if (!user) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm">
        {isZh ? "未检测到有效登录信息" : "Not authenticated"}
      </div>
    );
  }

  const profiles = user.playerProfiles || [];
  const activeProfileInCurrentSport = profiles.find(
    (p) => p.sport.toUpperCase() === sport
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* User Header Card */}
      <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          {/* Avatar with classical crest border */}
          <div className="w-20 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-heritage-gold/30 via-black to-black border-2 border-heritage-gold/50 flex items-center justify-center font-serif text-3xl font-black text-heritage-gold shadow-frameGold shrink-0">
            {user.avatarUrl || activeProfileInCurrentSport?.photoUrl ? (
              <img
                src={user.avatarUrl || activeProfileInCurrentSport?.photoUrl!}
                alt={user.nameEn}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              user.nameZh.slice(0, 1)
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-white">{isZh ? user.nameZh : user.nameEn}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-heritage-gold/20 text-heritage-gold font-bold border border-heritage-gold/40">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              @{user.username} · {isZh ? user.nameEn : user.nameZh}
            </p>

            {/* Multi-sport tags */}
            {profiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSport(p.sport as SportChannel)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      sport === p.sport.toUpperCase()
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm"
                        : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                    }`}
                  >
                    <span>{p.sport === "FOOTBALL" ? "⚽ 足球" : p.sport === "VOLLEYBALL" ? "🏐 排球" : "🏀 篮球"}</span>
                    <span>#{p.jerseyNumber} {p.primaryPosition}</span>
                    {p.isCaptain && <Crown className="w-3 h-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/15 text-gray-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 text-xs font-semibold transition-colors flex items-center space-x-2 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>{isZh ? "退出当前账号" : "Sign Out"}</span>
        </button>
      </div>

      {/* FC26 Progression & Dopamine Section (for Athletes) */}
      {activeProfileInCurrentSport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Progression Box */}
          <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Flame className="w-4 h-4 text-heritage-antiqueGold" />
                <span>{isZh ? "竞技卡牌经验成长 (XP Growth)" : "Athletic XP Progression"}</span>
              </h3>
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/60">
                {activeProfileInCurrentSport.cardTier} TIER
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-400">{isZh ? "当前经验值" : "Total XP"}</span>
                <span className="font-bold text-amber-400">{activeProfileInCurrentSport.xpPoints} XP</span>
              </div>
              <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (activeProfileInCurrentSport.xpPoints % 500) / 5)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-stone-400 text-right">
                {isZh
                  ? `距离升级至下一阶还需 ${500 - (activeProfileInCurrentSport.xpPoints % 500)} XP`
                  : `${500 - (activeProfileInCurrentSport.xpPoints % 500)} XP needed for next tier`}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-800 grid grid-cols-2 gap-2 text-xs text-stone-300">
              <div className="p-2.5 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400 text-[10px] block">{isZh ? "球衣号码" : "Jersey"}</span>
                <strong className="text-sm text-stone-100 font-serif">#{activeProfileInCurrentSport.jerseyNumber}</strong>
              </div>
              <div className="p-2.5 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400 text-[10px] block">{isZh ? "战术位置组" : "Unit"}</span>
                <strong className="text-sm text-stone-100 truncate block">{activeProfileInCurrentSport.positionGroup || "主力组"}</strong>
              </div>
            </div>
          </div>

          {/* Honors & Duties Spotlight */}
          <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{isZh ? "荣誉勋章与战术使命" : "Honors & Duties"}</span>
            </h3>

            {activeProfileInCurrentSport.honors ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 text-xs text-amber-200">
                <Star className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{activeProfileInCurrentSport.honors}</span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                {isZh ? "暂未录入赛事单项奖荣誉" : "No individual honors logged yet"}
              </p>
            )}

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed">
              <strong className="text-emerald-300 block mb-1">
                {isZh ? "教练战术寄语：" : "Coaching Focus:"}
              </strong>
              {isZh
                ? `保持赛后拉伸与自愈习惯，在每一次防守转换与进攻推进中担当基石！`
                : `Maintain recovery disciplines and anchor transitions with tactical rigor!`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
