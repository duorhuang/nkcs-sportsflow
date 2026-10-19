"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { BookOpen, Play, Bookmark, Sliders, Shield } from "lucide-react";

export default function TacticsPage() {
  const params = useParams();
  const sport = (params.sport as string)?.toUpperCase();
  const { locale } = useApp();
  const isZh = locale === "zh";

  const dummyTactics = [
    {
      id: "1",
      titleZh: "高位逼抢与肋部快速传切 (High Press)",
      titleEn: "High-Press Transition & Half-Space Overload",
      scenario: "常规阵地逼抢",
      courtFormat: "11人制 / 4-3-3",
      tags: ["高位逼抢", "4-3-3", "2024赛季"],
      phasesCount: 3,
    },
    {
      id: "2",
      titleZh: "角球B战术：前点后蹭与后门柱冲顶",
      titleEn: "Corner Variant B: Near-Post Flick & Far-Post Crash",
      scenario: "定位球进攻",
      courtFormat: "定位球",
      tags: ["角球", "空霸配合", "必杀战术"],
      phasesCount: 2,
    },
    {
      id: "3",
      titleZh: "领先阶段 4-4-2 低位双层防线固守",
      titleEn: "Low Block 4-4-2 Defensive Compactness",
      scenario: "领先稳守",
      courtFormat: "11人制 / 4-4-2",
      tags: ["低位防守", "造越位", "关门保护"],
      phasesCount: 2,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <BookOpen className="w-7 h-7 text-emerald-400" />
            <span>{isZh ? `${sport} 战术白皮书宝典` : `${sport} Tactics Playbook`}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "历届经典传世战术 · 阶段平滑推演 (Phase 1 → 2) · 角色选择器调入名宿 · 导出出版级 A4 战术手册"
              : "Enduring tactical library · Phased keyframing · Character tray legends · Print-ready A4 PDF"}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            阶段二推演引擎待接入
          </span>
        </div>
      </div>

      {/* Tactical Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dummyTactics.map((tactic) => (
          <div
            key={tactic.id}
            className="p-5 rounded-xl bg-black/50 border border-white/10 hover:border-emerald-500/40 shadow-chiseled flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-emerald-400">
                  {tactic.scenario}
                </span>
                <span>{tactic.courtFormat}</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {isZh ? tactic.titleZh : tactic.titleEn}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isZh ? tactic.titleEn : tactic.titleZh}
              </p>

              <div className="flex flex-wrap gap-1 mt-3">
                {tactic.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-mono text-[11px]">{tactic.phasesCount} 个动画阶段</span>
              <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>推演演示</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
