"use client";

import React, { useState } from "react";
import { TrainingDrillItem } from "@/types";
import { useApp } from "@/context/AppContext";
import {
  Clock,
  Users,
  Maximize2,
  CheckCircle2,
  X,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface DrillCardProps {
  drill: TrainingDrillItem;
  index?: number;
}

const categoryStyles: Record<
  string,
  { labelZh: string; labelEn: string; bg: string; text: string; border: string }
> = {
  WARMUP: {
    labelZh: "热身与神经激活",
    labelEn: "Warmup & Activation",
    bg: "bg-amber-950/70",
    text: "text-amber-200",
    border: "border-amber-800/70",
  },
  TACTICAL: {
    labelZh: "实战战术对抗演练",
    labelEn: "Tactical Transition",
    bg: "bg-emerald-950/70",
    text: "text-emerald-200",
    border: "border-emerald-800/70",
  },
  TECHNICAL: {
    labelZh: "专项位置技术细节",
    labelEn: "Technical Position",
    bg: "bg-stone-800",
    text: "text-stone-200",
    border: "border-stone-700",
  },
  CONDITIONING: {
    labelZh: "专项体能与负荷",
    labelEn: "Conditioning & Intensity",
    bg: "bg-rose-950/70",
    text: "text-rose-200",
    border: "border-rose-800/70",
  },
  COOLDOWN: {
    labelZh: "整理放松与拉伸",
    labelEn: "Cooldown & Stretch",
    bg: "bg-teal-950/70",
    text: "text-teal-200",
    border: "border-teal-800/70",
  },
};

export const DrillCard: React.FC<DrillCardProps> = ({ drill, index }) => {
  const { locale } = useApp();
  const isZh = locale === "zh";

  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"U19" | "U15">("U19");

  const cat = categoryStyles[drill.category] || categoryStyles.TACTICAL;

  // Split coaching cues by line or semicolon
  const cues = isZh
    ? drill.coachingCuesZh?.split(/[;\n]/).filter(Boolean) || []
    : drill.coachingCuesEn?.split(/[;\n]/).filter(Boolean) || [];

  return (
    <div className="bg-[#121815] border border-stone-800 hover:border-stone-700 rounded-xl p-4 sm:p-5 shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header: Index, Category Badge, Title, Duration */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-3 border-b border-stone-800">
          <div className="flex items-start space-x-3">
            {index !== undefined && (
              <span className="font-serif font-black text-base text-amber-400 bg-stone-900 border border-stone-800 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                {String(index).padStart(2, "0")}
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}
                >
                  {isZh ? cat.labelZh : cat.labelEn}
                </span>

                {drill.durationMins && (
                  <span className="flex items-center space-x-1 text-[11px] text-stone-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>{drill.durationMins} 分钟</span>
                  </span>
                )}
              </div>

              <h3 className="font-serif font-black text-base sm:text-lg text-stone-100 mt-1">
                {isZh ? drill.titleZh : drill.titleEn}
              </h3>
            </div>
          </div>

          {/* Age-tier Toggle (U19 High School Varsity vs U15 Junior) */}
          <div className="flex items-center space-x-1 self-start lg:self-center p-0.5 rounded-lg bg-stone-900 border border-stone-800 text-[11px] font-bold">
            <button
              onClick={() => setViewMode("U19")}
              className={`px-2.5 py-0.5 rounded transition-all ${
                viewMode === "U19"
                  ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              U19 高中校队
            </button>
            <button
              onClick={() => setViewMode("U15")}
              className={`px-2.5 py-0.5 rounded transition-all ${
                viewMode === "U15"
                  ? "bg-stone-700 text-stone-100 font-bold"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              U15 初中精讲
            </button>
          </div>
        </div>

        {/* Drill Specs Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3 text-xs">
          {drill.setsAndReps && (
            <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
              <span className="text-[10px] text-stone-400 font-bold block uppercase">
                {isZh ? "组数与间歇" : "Sets & Interval"}
              </span>
              <span className="font-medium text-stone-200 text-[11px]">
                {drill.setsAndReps}
              </span>
            </div>
          )}

          {drill.pitchSpecs && (
            <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
              <span className="text-[10px] text-stone-400 font-bold block uppercase">
                {isZh ? "场地规格" : "Pitch Specs"}
              </span>
              <span className="font-medium text-stone-200 text-[11px]">
                {drill.pitchSpecs}
              </span>
            </div>
          )}

          {drill.playerCount && (
            <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-stone-400 font-bold block uppercase">
                {isZh ? "人数配比" : "Personnel"}
              </span>
              <span className="font-medium text-stone-200 text-[11px]">
                {drill.playerCount}
              </span>
            </div>
          )}
        </div>

        {/* Tactical Pitch Illustration / Diagram Banner */}
        {drill.diagramUrl && (
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-stone-950 border border-stone-800 my-2.5 group">
            <img
              src={drill.diagramUrl}
              alt={drill.titleZh}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <button
              onClick={() => setIsZoomOpen(true)}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 transition-colors"
              title="放大查看战术图解"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Coaching Cues */}
        <div className="space-y-1.5 mt-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3" />
            <span>
              {isZh
                ? viewMode === "U19"
                  ? "教练核心指令与战术要点 (U19)"
                  : "基础动作拆解与安全提示 (U15)"
                : "Coaching Cues"}
            </span>
          </h4>

          {viewMode === "U15" && (
            <p className="text-[11px] text-amber-200/90 bg-amber-950/40 p-2 rounded-lg border border-amber-900/50 leading-relaxed">
              💡 <strong>初中梯队教学口诀：</strong>{" "}
              {isZh
                ? "动作重在重心压低与连贯性，不追求极限对抗速率，确保落地支撑脚踝保护！"
                : "Prioritize body mechanics and stability over extreme tempo."}
            </p>
          )}

          <ul className="space-y-1 text-xs text-stone-300">
            {cues.map((cue, idx) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-stone-400 font-bold shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{cue.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal for Fullscreen Tactical Diagram */}
      {isZoomOpen && drill.diagramUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-[#121815] border border-stone-800 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-stone-100">
                {isZh ? drill.titleZh : drill.titleEn} — 战术图解白皮书
              </h3>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 aspect-[16/9] rounded-xl overflow-hidden bg-black border border-stone-800">
              <img
                src={drill.diagramUrl}
                alt={drill.titleZh}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillCard;
