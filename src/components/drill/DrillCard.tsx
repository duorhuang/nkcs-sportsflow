"use client";

import React, { useState } from "react";
import { TrainingDrillItem } from "@/types";
import { useApp } from "@/context/AppContext";
import {
  Clock,
  Users,
  Maximize2,
  CheckCircle2,
  Flame,
  Play,
  X,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
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
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/40",
  },
  TACTICAL: {
    labelZh: "实战战术对抗演练",
    labelEn: "Tactical Transition",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/40",
  },
  TECHNICAL: {
    labelZh: "专项位置技术细节",
    labelEn: "Technical Position",
    bg: "bg-blue-500/15",
    text: "text-blue-300",
    border: "border-blue-500/40",
  },
  CONDITIONING: {
    labelZh: "专项体能与负荷",
    labelEn: "Conditioning & Intensity",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "border-rose-500/40",
  },
  COOLDOWN: {
    labelZh: "整理放松与拉伸",
    labelEn: "Cooldown & Stretch",
    bg: "bg-teal-500/15",
    text: "text-teal-300",
    border: "border-teal-500/40",
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
    <div className="bg-gradient-to-b from-[#181B20] to-[#0E1013] border-2 border-white/15 hover:border-white/25 rounded-2xl p-4 sm:p-6 shadow-2xl transition-all duration-300 hover:shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex flex-col justify-between">
      <div>
        {/* Top Header: Index, Category Badge, Title, Duration & Audience Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-start space-x-3.5">
            {index !== undefined && (
              <span className="font-serif font-black text-lg text-heritage-gold bg-heritage-gold/15 border border-heritage-gold/40 rounded-xl w-10 h-10 flex items-center justify-center shrink-0 shadow-inner">
                {String(index).padStart(2, "0")}
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}
                >
                  {isZh ? cat.labelZh : cat.labelEn}
                </span>

                {drill.durationMins && (
                  <span className="flex items-center space-x-1 text-xs text-gray-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-heritage-gold" />
                    <span>{drill.durationMins} {isZh ? "分钟" : "mins"}</span>
                  </span>
                )}

                {drill.setsAndReps && (
                  <span className="flex items-center space-x-1 text-xs text-amber-200 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{drill.setsAndReps}</span>
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-serif font-bold text-white mt-1.5 tracking-wide">
                {isZh ? drill.titleZh : drill.titleEn}
              </h3>
              <p className="text-xs text-gray-400">
                {isZh ? drill.titleEn : drill.titleZh}
              </p>
            </div>
          </div>

          {/* Age-Level Adaptation Switcher (U19 深度 / U15 通俗) */}
          <div className="flex items-center self-start lg:self-center bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("U19")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "U19"
                  ? "bg-heritage-gold text-black shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              U19 深度战术
            </button>
            <button
              onClick={() => setViewMode("U15")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "U15"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              U15/U12 直观演示
            </button>
          </div>
        </div>

        {/* Visual Tactical Diagram Preview (教练端图解示范核心) */}
        {drill.diagramUrl && (
          <div className="relative mt-4 rounded-xl overflow-hidden border-2 border-white/15 bg-black/80 shadow-inner group">
            <div className="relative w-full aspect-[16/10] bg-black/40 flex items-center justify-center">
              <img
                src={drill.diagramUrl}
                alt="Tactical Drill Diagram"
                className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                onClick={() => setIsZoomOpen(true)}
              />

              {/* Tap to Zoom Overlay Button for iPad sideline coach */}
              <button
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs font-bold flex items-center space-x-1.5 border border-white/20 shadow-lg backdrop-blur-md transition-all group-hover:border-heritage-gold"
              >
                <Maximize2 className="w-3.5 h-3.5 text-heritage-gold" />
                <span>{isZh ? "全屏大图讲解" : "Expand Diagram"}</span>
              </button>

              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-black/75 border border-white/10 text-[10px] text-gray-300 font-mono tracking-wider backdrop-blur-sm">
                TACTICAL SCHEMATIC • 标准跑位示意图
              </div>
            </div>
          </div>
        )}

        {/* Specs: Pitch & Personnel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3.5 text-xs text-gray-300">
          {drill.pitchSpecs && (
            <div className="flex items-center space-x-2.5 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">{isZh ? "场地规范" : "Pitch Dimension"}</span>
                <span className="font-bold text-white">{drill.pitchSpecs}</span>
              </div>
            </div>
          )}
          {drill.playerCount && (
            <div className="flex items-center space-x-2.5 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-blue-300" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">{isZh ? "人员编成" : "Personnel"}</span>
                <span className="font-bold text-white">{drill.playerCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Coaching Cues: Mode-dependent presentation */}
        {viewMode === "U19" ? (
          /* U19 Senior Tactical Principles */
          cues.length > 0 && (
            <div className="mt-3 bg-white/[0.03] border border-white/10 rounded-xl p-3.5 sm:p-4">
              <h4 className="text-xs font-serif font-black text-heritage-gold uppercase tracking-wider mb-2.5 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-heritage-gold" />
                <span>{isZh ? "教练 3 点核心指导原则 (Coaching Cues)" : "Key Coaching Principles"}</span>
              </h4>
              <div className="space-y-2">
                {cues.map((cue, i) => (
                  <div key={i} className="flex items-start space-x-2.5 text-xs text-gray-200 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-heritage-gold/20 text-heritage-gold border border-heritage-gold/40 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{cue.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* U15 / U12 Junior Simplified Cues */
          <div className="mt-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 sm:p-4">
            <h4 className="text-xs font-serif font-black text-emerald-300 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{isZh ? "青少年梯队直观执行口诀 (Junior Cues)" : "Junior Guidelines"}</span>
            </h4>
            <div className="space-y-2 text-xs text-emerald-100">
              <div className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">🎯 核心目标：</span>
                <span>传球后立刻主动跑动，把球在 3 脚内准确送到空当队友脚下。</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">👟 动作要点：</span>
                <span>抬头观察场面，脚踝锁紧，身体面向开阔空间接球。</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">⚠️ 提醒避免：</span>
                <span>低头只看脚下的球，原地等待队友传球导致被对手抢断。</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Demonstration Pill (if available) */}
      {drill.videoUrl && (
        <div className="mt-4 flex items-center justify-between text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-950/40 transition-colors">
          <span className="flex items-center space-x-2 font-bold">
            <Play className="w-4 h-4 fill-current text-emerald-400" />
            <span>{isZh ? "观看动作高清示范视频" : "Watch Drill Demo Video"}</span>
          </span>
          <span className="text-[10px] text-gray-400 font-mono">1080P HD</span>
        </div>
      )}

      {/* Full-Screen Diagram Zoom Lightbox Modal */}
      {isZoomOpen && drill.diagramUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 animate-fadeIn">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between pb-3 border-b border-white/20 mb-4">
            <div>
              <span className="text-xs font-bold text-heritage-gold uppercase tracking-widest block">
                {isZh ? "教练端大屏讲解模式" : "COACH SIDELINE PRESENTATION"}
              </span>
              <h2 className="text-lg font-bold text-white">
                {isZh ? drill.titleZh : drill.titleEn}
              </h2>
            </div>
            <button
              onClick={() => setIsZoomOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Expanded High-Resolution Image Container */}
          <div className="w-full max-w-5xl max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden border-2 border-heritage-gold/50 shadow-2xl bg-black">
            <img
              src={drill.diagramUrl}
              alt="Expanded Drill Diagram"
              className="w-full h-full object-contain max-h-[75vh]"
            />
          </div>

          {/* Coaching Keys Bar below Expanded Diagram */}
          <div className="w-full max-w-5xl mt-3 flex items-center justify-between text-xs text-gray-300 bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-heritage-gold">{isZh ? "训练要点：" : "Key Focus: "}</span>
              <span>{drill.setsAndReps || "连续轮转对抗"}</span>
            </div>
            <span className="text-gray-400 font-mono">
              NKCS ATHLETICS TACTICAL BOARD
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillCard;
