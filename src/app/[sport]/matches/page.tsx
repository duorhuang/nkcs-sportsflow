"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Trophy, Calendar, MapPin, CheckCircle, Shield } from "lucide-react";

export default function MatchesPage() {
  const params = useParams();
  const sport = (params.sport as string)?.toUpperCase();
  const { locale } = useApp();
  const isZh = locale === "zh";

  const matches = [
    {
      id: "1",
      opponent: "德威国际学校 (Dulwich College)",
      date: "2026-10-24 15:30",
      location: "NKCS 1号主场",
      isHome: true,
      status: "UPCOMING",
      linkedTactic: "高位逼抢与肋部快速传切",
    },
    {
      id: "2",
      opponent: "包玉刚实验学校 (YK Pao School)",
      date: "2026-10-12",
      location: "客场",
      isHome: false,
      status: "FINISHED",
      ourScore: 3,
      opponentScore: 1,
      scorers: "张伟 (42'), 李明 (68', 81')",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>{isZh ? `${sport} 比赛中心与全场景复盘` : `${sport} Match Center & Debriefs`}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "赛程预告 · 极简比分录入 · 1对1 专属复盘卡 · 疲劳恢复处方 · 经验结算"
              : "Upcoming fixtures · Minimalist scores · 1-on-1 private debrief cards · Recovery prescription"}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30">
            阶段三复盘工作台待接入
          </span>
        </div>
      </div>

      {/* Match Cards */}
      <div className="space-y-4">
        {matches.map((m) => (
          <div
            key={m.id}
            className="p-6 rounded-2xl bg-black/60 border border-white/15 shadow-chiseled flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === "UPCOMING"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {m.status === "UPCOMING" ? (isZh ? "下场预告" : "Upcoming") : (isZh ? "完赛" : "Finished")}
                </span>
                <span className="text-xs text-gray-400">{m.date}</span>
                <span className="text-xs text-gray-500">· {m.location}</span>
              </div>

              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-bold text-white">
                  NKCS 校队 vs {m.opponent}
                </h3>
              </div>

              {m.linkedTactic && (
                <p className="text-xs text-emerald-400 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isZh ? `关联演练战术：${m.linkedTactic}` : `Linked Tactic: ${m.linkedTactic}`}</span>
                </p>
              )}

              {m.scorers && (
                <p className="text-xs text-gray-300">
                  {isZh ? `进球/表现：${m.scorers}` : `Stats: ${m.scorers}`}
                </p>
              )}
            </div>

            {m.status === "FINISHED" ? (
              <div className="flex items-center space-x-6 shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-serif font-black text-heritage-gold">
                    {m.ourScore} : {m.opponentScore}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">WIN 胜利</span>
                </div>
              </div>
            ) : (
              <div className="shrink-0">
                <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors">
                  {isZh ? "查看赛前战术准备" : "Pre-Match Brief"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
