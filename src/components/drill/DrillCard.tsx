"use client";

import React from "react";
import { TrainingDrillItem } from "@/types";
import { useApp } from "@/context/AppContext";
import { Clock, Users, Maximize2, CheckCircle2, Flame, Play, ShieldAlert } from "lucide-react";

interface DrillCardProps {
  drill: TrainingDrillItem;
  index?: number;
}

const categoryStyles: Record<string, { labelZh: string; labelEn: string; bg: string; text: string; border: string }> = {
  WARMUP: {
    labelZh: "热身激活",
    labelEn: "Warmup & Activation",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
  },
  TACTICAL: {
    labelZh: "战术演练",
    labelEn: "Tactical Transition",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
  TECHNICAL: {
    labelZh: "专项技术",
    labelEn: "Technical Position",
    bg: "bg-blue-500/15",
    text: "text-blue-300",
    border: "border-blue-500/30",
  },
  CONDITIONING: {
    labelZh: "体能对抗",
    labelEn: "Conditioning & Intensity",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "border-rose-500/30",
  },
  COOLDOWN: {
    labelZh: "整理放松",
    labelEn: "Cooldown & Stretch",
    bg: "bg-teal-500/15",
    text: "text-teal-300",
    border: "border-teal-500/30",
  },
};

export const DrillCard: React.FC<DrillCardProps> = ({ drill, index }) => {
  const { locale } = useApp();
  const isZh = locale === "zh";

  const cat = categoryStyles[drill.category] || categoryStyles.TACTICAL;

  // Split coaching cues by line or semicolon
  const cues = isZh
    ? drill.coachingCuesZh?.split(/[;\n]/).filter(Boolean) || []
    : drill.coachingCuesEn?.split(/[;\n]/).filter(Boolean) || [];

  return (
    <div className="bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-5 shadow-chiseled transition-all duration-300 hover:shadow-lg">
      {/* Top Header: Index, Category Badge, Title, Duration */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-start space-x-3">
          {index !== undefined && (
            <span className="font-serif font-black text-xl text-heritage-antiqueGold bg-heritage-gold/10 border border-heritage-gold/30 rounded-lg w-9 h-9 flex items-center justify-center shrink-0">
              {index}
            </span>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}
              >
                {isZh ? cat.labelZh : cat.labelEn}
              </span>
              {drill.durationMins && (
                <span className="flex items-center space-x-1 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{drill.durationMins} {isZh ? "分钟" : "mins"}</span>
                </span>
              )}
            </div>
            <h3 className="text-base md:text-lg font-bold text-white mt-1">
              {isZh ? drill.titleZh : drill.titleEn}
            </h3>
            <p className="text-xs text-gray-400">
              {isZh ? drill.titleEn : drill.titleZh}
            </p>
          </div>
        </div>

        {/* Load / Sets pill */}
        {drill.setsAndReps && (
          <div className="self-start md:self-center shrink-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-amber-200/90 flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{drill.setsAndReps}</span>
          </div>
        )}
      </div>

      {/* Middle Specs: Pitch & Personnel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3.5 text-xs text-gray-300">
        {drill.pitchSpecs && (
          <div className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
            <Maximize2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-gray-400 font-normal">{isZh ? "场地：" : "Pitch: "}</strong>
              {drill.pitchSpecs}
            </span>
          </div>
        )}
        {drill.playerCount && (
          <div className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong className="text-gray-400 font-normal">{isZh ? "配置：" : "Personnel: "}</strong>
              {drill.playerCount}
            </span>
          </div>
        )}
      </div>

      {/* Coaching Cues: 3 Key Points */}
      {cues.length > 0 && (
        <div className="mt-3 bg-white/[0.02] border border-white/5 rounded-lg p-3.5">
          <h4 className="text-xs font-bold text-heritage-antiqueGold uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-heritage-antiqueGold" />
            <span>{isZh ? "教练 3 点核心指导原则" : "Key Coaching Principles"}</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-gray-200">
            {cues.map((cue, i) => (
              <li key={i} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{cue.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Optional Demo preview slot */}
      {drill.videoUrl && (
        <div className="mt-3 flex items-center justify-between text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-500/20 px-3.5 py-2 rounded-lg cursor-pointer hover:bg-emerald-950/40 transition-colors">
          <span className="flex items-center space-x-2">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isZh ? "观看动作高清示范视频" : "Watch Drill Demo Video"}</span>
          </span>
          <span className="text-[10px] text-gray-400">1080P HD</span>
        </div>
      )}
    </div>
  );
};

export default DrillCard;
