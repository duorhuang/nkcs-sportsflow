"use client";

import React, { useState } from "react";
import { SportChannel } from "@/types";
import { Shield, Sparkles, CheckCircle2, AlertTriangle, HeartPulse, RefreshCw } from "lucide-react";

export type BodyPartKey =
  | "neck"
  | "shoulders"
  | "chest"
  | "core"
  | "lower_back"
  | "groin"
  | "quads"
  | "hamstrings"
  | "knees"
  | "calves"
  | "ankles";

interface InteractiveBodyVisualizerProps {
  sport: SportChannel;
  selectedPart: BodyPartKey;
  onSelectPart: (part: BodyPartKey) => void;
}

export default function InteractiveBodyVisualizer({
  sport,
  selectedPart,
  onSelectPart,
}: InteractiveBodyVisualizerProps) {
  const [view, setView] = useState<"FRONT" | "BACK">("FRONT");

  // Sport-specific high-risk priority mapping
  const isHighRiskForSport = (part: BodyPartKey): boolean => {
    if (sport === "FOOTBALL") {
      return ["hamstrings", "groin", "knees", "ankles", "calves"].includes(part);
    }
    if (sport === "VOLLEYBALL") {
      return ["shoulders", "knees", "ankles", "lower_back", "calves"].includes(part);
    }
    if (sport === "BASKETBALL") {
      return ["ankles", "knees", "groin", "lower_back", "calves"].includes(part);
    }
    return false;
  };

  return (
    <div className="bg-black/60 border border-white/15 rounded-2xl p-4 sm:p-6 shadow-chiseled flex flex-col items-center">
      {/* View Toggle */}
      <div className="flex items-center justify-between w-full pb-3 mb-2 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            3D 竞技解剖交互定位仪 (ANATOMICAL BODY MAP)
          </span>
        </div>

        <div className="flex items-center space-x-1 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
          <button
            onClick={() => setView("FRONT")}
            className={`px-3 py-1 rounded-lg transition-all ${
              view === "FRONT"
                ? "bg-rose-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            人体前侧 (Front)
          </button>
          <button
            onClick={() => setView("BACK")}
            className={`px-3 py-1 rounded-lg transition-all ${
              view === "BACK"
                ? "bg-rose-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            人体后侧 (Back)
          </button>
        </div>
      </div>

      {/* Anatomical SVG Canvas with Clickable Target Zones */}
      <div className="relative w-full max-w-[340px] aspect-[340/560] select-none py-2">
        <svg
          viewBox="0 0 340 560"
          className="w-full h-full drop-shadow-2xl"
        >
          <defs>
            <radialGradient id="bodyGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Silhouette Base Wireframe */}
          <g opacity="0.4" stroke="#64748B" strokeWidth="1.5" fill="none">
            {/* Head & Neck */}
            <ellipse cx="170" cy="45" rx="26" ry="32" />
            <path d="M 160 76 L 160 95 M 180 76 L 180 95" />

            {/* Torso Outline */}
            <path d="M 115 105 L 140 95 L 200 95 L 225 105 L 220 220 L 195 240 L 145 240 L 120 220 Z" />

            {/* Arms */}
            <path d="M 115 105 L 90 170 L 75 240 L 65 290" />
            <path d="M 225 105 L 250 170 L 265 240 L 275 290" />

            {/* Pelvis & Legs */}
            <path d="M 145 240 L 135 340 L 130 430 L 125 510 L 115 540" />
            <path d="M 195 240 L 205 340 L 210 430 L 215 510 L 225 540" />
            <path d="M 170 260 L 155 350 L 150 430 L 145 515 L 135 540" />
            <path d="M 170 260 L 185 350 L 190 430 L 195 515 L 205 540" />
          </g>

          {/* INTERACTIVE MUSCLE / JOINT ZONES */}
          {/* 1. Neck / Trapezius */}
          <g
            onClick={() => onSelectPart("neck")}
            className="cursor-pointer group"
          >
            <path
              d="M 150 82 L 190 82 L 205 102 L 135 102 Z"
              fill={selectedPart === "neck" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "neck" ? "#FDA4AF" : isHighRiskForSport("neck") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <text x="170" y="96" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
              颈肩
            </text>
          </g>

          {/* 2. Shoulders */}
          <g
            onClick={() => onSelectPart("shoulders")}
            className="cursor-pointer group"
          >
            {/* Left & Right Deltoids */}
            <ellipse
              cx="110"
              cy="118"
              rx="18"
              ry="22"
              fill={selectedPart === "shoulders" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "shoulders" ? "#FDA4AF" : isHighRiskForSport("shoulders") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <ellipse
              cx="230"
              cy="118"
              rx="18"
              ry="22"
              fill={selectedPart === "shoulders" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "shoulders" ? "#FDA4AF" : isHighRiskForSport("shoulders") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <text x="110" y="122" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">肩袖</text>
            <text x="230" y="122" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">肩袖</text>
          </g>

          {/* 3. Chest (Front) or Upper Back (Back) */}
          {view === "FRONT" ? (
            <g
              onClick={() => onSelectPart("chest")}
              className="cursor-pointer group"
            >
              <rect
                x="135"
                y="110"
                width="70"
                height="42"
                rx="6"
                fill={selectedPart === "chest" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "chest" ? "#FDA4AF" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <text x="170" y="135" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">胸大肌</text>
            </g>
          ) : (
            <g
              onClick={() => onSelectPart("lower_back")}
              className="cursor-pointer group"
            >
              <rect
                x="135"
                y="110"
                width="70"
                height="50"
                rx="6"
                fill={selectedPart === "lower_back" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "lower_back" ? "#FDA4AF" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <text x="170" y="138" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">背阔肌/上背</text>
            </g>
          )}

          {/* 4. Core (Front) or Lower Back (Back) */}
          {view === "FRONT" ? (
            <g
              onClick={() => onSelectPart("core")}
              className="cursor-pointer group"
            >
              <rect
                x="142"
                y="158"
                width="56"
                height="55"
                rx="6"
                fill={selectedPart === "core" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "core" ? "#FDA4AF" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <text x="170" y="190" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">腹肌核心</text>
            </g>
          ) : (
            <g
              onClick={() => onSelectPart("lower_back")}
              className="cursor-pointer group"
            >
              <rect
                x="140"
                y="166"
                width="60"
                height="55"
                rx="6"
                fill={selectedPart === "lower_back" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "lower_back" ? "#FDA4AF" : isHighRiskForSport("lower_back") ? "#F59E0B" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <text x="170" y="198" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">腰椎竖脊肌</text>
            </g>
          )}

          {/* 5. Groin / Adductors (Front) or Glutes (Back) */}
          {view === "FRONT" ? (
            <g
              onClick={() => onSelectPart("groin")}
              className="cursor-pointer group"
            >
              <polygon
                points="140,220 200,220 185,265 155,265"
                fill={selectedPart === "groin" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "groin" ? "#FDA4AF" : isHighRiskForSport("groin") ? "#F59E0B" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <text x="170" y="246" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">腹股沟内收</text>
            </g>
          ) : (
            <g
              onClick={() => onSelectPart("hamstrings")}
              className="cursor-pointer group"
            >
              <rect
                x="136"
                y="226"
                width="68"
                height="45"
                rx="8"
                fill={selectedPart === "hamstrings" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "hamstrings" ? "#FDA4AF" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <text x="170" y="252" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">臀大肌</text>
            </g>
          )}

          {/* 6. Quads (Front) or Hamstrings (Back) */}
          {view === "FRONT" ? (
            <g
              onClick={() => onSelectPart("quads")}
              className="cursor-pointer group"
            >
              {/* Left & Right Quads */}
              <rect
                x="126"
                y="272"
                width="38"
                height="80"
                rx="8"
                fill={selectedPart === "quads" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "quads" ? "#FDA4AF" : isHighRiskForSport("quads") ? "#F59E0B" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <rect
                x="176"
                y="272"
                width="38"
                height="80"
                rx="8"
                fill={selectedPart === "quads" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "quads" ? "#FDA4AF" : isHighRiskForSport("quads") ? "#F59E0B" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <text x="145" y="316" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">股四头</text>
              <text x="195" y="316" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">股四头</text>
            </g>
          ) : (
            <g
              onClick={() => onSelectPart("hamstrings")}
              className="cursor-pointer group"
            >
              {/* Left & Right Hamstrings */}
              <rect
                x="126"
                y="276"
                width="38"
                height="80"
                rx="8"
                fill={selectedPart === "hamstrings" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "hamstrings" ? "#FDA4AF" : isHighRiskForSport("hamstrings") ? "#F59E0B" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <rect
                x="176"
                y="276"
                width="38"
                height="80"
                rx="8"
                fill={selectedPart === "hamstrings" ? "#E11D48" : "#1E293B"}
                stroke={selectedPart === "hamstrings" ? "#FDA4AF" : isHighRiskForSport("hamstrings") ? "#F59E0B" : "#475569"}
                strokeWidth="2"
                className="transition-colors hover:fill-rose-500/80"
              />
              <text x="145" y="320" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">腘绳肌</text>
              <text x="195" y="320" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">腘绳肌</text>
            </g>
          )}

          {/* 7. Knees (Patellar Tendon / ACL) */}
          <g
            onClick={() => onSelectPart("knees")}
            className="cursor-pointer group"
          >
            <circle
              cx="145"
              cy="372"
              r="14"
              fill={selectedPart === "knees" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "knees" ? "#FDA4AF" : isHighRiskForSport("knees") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <circle
              cx="195"
              cy="372"
              r="14"
              fill={selectedPart === "knees" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "knees" ? "#FDA4AF" : isHighRiskForSport("knees") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <text x="145" y="376" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">髌骨</text>
            <text x="195" y="376" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">髌骨</text>
          </g>

          {/* 8. Calves (Gastrocnemius & Soleus) */}
          <g
            onClick={() => onSelectPart("calves")}
            className="cursor-pointer group"
          >
            <rect
              x="130"
              y="400"
              width="30"
              height="75"
              rx="6"
              fill={selectedPart === "calves" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "calves" ? "#FDA4AF" : isHighRiskForSport("calves") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <rect
              x="180"
              y="400"
              width="30"
              height="75"
              rx="6"
              fill={selectedPart === "calves" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "calves" ? "#FDA4AF" : isHighRiskForSport("calves") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <text x="145" y="440" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">小腿</text>
            <text x="195" y="440" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">小腿</text>
          </g>

          {/* 9. Ankles & Achilles */}
          <g
            onClick={() => onSelectPart("ankles")}
            className="cursor-pointer group"
          >
            <rect
              x="126"
              y="490"
              width="36"
              height="30"
              rx="6"
              fill={selectedPart === "ankles" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "ankles" ? "#FDA4AF" : isHighRiskForSport("ankles") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <rect
              x="178"
              y="490"
              width="36"
              height="30"
              rx="6"
              fill={selectedPart === "ankles" ? "#E11D48" : "#1E293B"}
              stroke={selectedPart === "ankles" ? "#FDA4AF" : isHighRiskForSport("ankles") ? "#F59E0B" : "#475569"}
              strokeWidth="2"
              className="transition-colors hover:fill-rose-500/80"
            />
            <text x="144" y="508" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">踝/跟腱</text>
            <text x="196" y="508" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">踝/跟腱</text>
          </g>
        </svg>
      </div>

      {/* Legend & Risk Warning */}
      <div className="flex items-center space-x-4 text-[11px] text-gray-400 mt-2">
        <div className="flex items-center space-x-1">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-400" />
          <span>当前选定部位</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-400" />
          <span>{sport} 重点高频损耗点</span>
        </div>
      </div>
    </div>
  );
}
