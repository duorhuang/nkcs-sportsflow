"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  TacticData,
  TacticPhaseData,
  TacticToken,
  TacticTrajectory,
  SportChannel,
  PlayerProfileData,
} from "@/types";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Maximize2,
  Printer,
  ChevronRight,
  ChevronLeft,
  Users,
  Award,
  GraduationCap,
  Sparkles,
  Info,
} from "lucide-react";

interface TacticsBoardProps {
  sport: SportChannel;
  tactic: TacticData;
  players?: PlayerProfileData[];
  editable?: boolean;
  onUpdateTactic?: (updated: TacticData) => void;
  onOpenBigScreen?: () => void;
  onPrintA4?: () => void;
}

export default function TacticsBoard({
  sport,
  tactic,
  players = [],
  editable = false,
  onUpdateTactic,
  onOpenBigScreen,
  onPrintA4,
}: TacticsBoardProps) {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animProgress, setAnimProgress] = useState(0); // 0 to 1 between phases
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const phases = tactic.phases || [];
  const currentPhase: TacticPhaseData = phases[currentPhaseIdx] || {
    phaseIndex: 1,
    titleZh: "阶段一",
    titleEn: "Phase 1",
    tokens: [],
    trajectories: [],
  };

  // Setup animated playback loop
  useEffect(() => {
    if (!isPlaying || phases.length <= 1) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 2400; // ms per phase transition

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      setAnimProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Transition to next phase
        setCurrentPhaseIdx((prev) => (prev + 1) % phases.length);
        startTimestamp = null;
        setAnimProgress(0);
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, phases.length, currentPhaseIdx]);

  // Compute interpolated token positions if currently animating
  const nextPhase = phases[(currentPhaseIdx + 1) % phases.length];
  const displayedTokens: TacticToken[] = currentPhase.tokens.map((token) => {
    if (!isPlaying || !nextPhase) return token;
    const nextToken = nextPhase.tokens.find((t) => t.id === token.id);
    if (!nextToken) return token;

    // Linear interpolation with smooth easing
    const ease = (t: number) => t * t * (3 - 2 * t);
    const easedProgress = ease(animProgress);
    const interpX = token.x + (nextToken.x - token.x) * easedProgress;
    const interpY = token.y + (nextToken.y - token.y) * easedProgress;

    return {
      ...token,
      x: interpX,
      y: interpY,
    };
  });

  // Handle Dragging in SVG
  const handlePointerDown = (tokenId: string, e: React.PointerEvent) => {
    if (!editable || isPlaying) return;
    e.stopPropagation();
    setDraggingTokenId(tokenId);
    setSelectedTokenId(tokenId);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTokenId || !svgRef.current || !editable) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Convert to normalized 1000 x 700
    const normX = Math.round(Math.max(20, Math.min(980, (rawX / rect.width) * 1000)));
    const normY = Math.round(Math.max(20, Math.min(680, (rawY / rect.height) * 700)));

    const updatedTokens = currentPhase.tokens.map((t) =>
      t.id === draggingTokenId ? { ...t, x: normX, y: normY } : t
    );

    const updatedPhases = phases.map((p, idx) =>
      idx === currentPhaseIdx ? { ...p, tokens: updatedTokens } : p
    );

    if (onUpdateTactic) {
      onUpdateTactic({
        ...tactic,
        phases: updatedPhases,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingTokenId) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingTokenId(null);
    }
  };

  const selectedToken = currentPhase.tokens.find((t) => t.id === selectedTokenId);

  return (
    <div className="bg-black/60 border border-white/15 rounded-2xl p-4 sm:p-6 shadow-chiseled backdrop-blur-md flex flex-col space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          {phases.map((phase, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsPlaying(false);
                setCurrentPhaseIdx(idx);
                setAnimProgress(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentPhaseIdx === idx
                  ? "bg-heritage-gold text-black shadow-md scale-105"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <span>{phase.titleZh || `阶段 ${idx + 1}`}</span>
            </button>
          ))}

          {editable && onUpdateTactic && (
            <button
              onClick={() => {
                const newIdx = phases.length + 1;
                const newPhase: TacticPhaseData = {
                  phaseIndex: newIdx,
                  titleZh: `阶段 ${newIdx}`,
                  titleEn: `Phase ${newIdx}`,
                  notesZh: "新演练阶段战术跑位",
                  notesEn: "New tactical phase instructions",
                  tokens: JSON.parse(JSON.stringify(currentPhase.tokens)),
                  trajectories: [],
                };
                onUpdateTactic({
                  ...tactic,
                  phases: [...phases, newPhase],
                });
                setCurrentPhaseIdx(phases.length);
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-emerald-400 hover:text-emerald-300 transition-colors"
              title="添加阶段 (Add Phase)"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Playback Controls & Utility Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              setAnimProgress(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              isPlaying
                ? "bg-amber-500 text-black hover:bg-amber-400 animate-pulse"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>暂停演播</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>连续推演</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentPhaseIdx(0);
              setAnimProgress(0);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 transition-colors"
            title="复位至阶段一 (Reset)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onOpenBigScreen && (
            <button
              onClick={onOpenBigScreen}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-heritage-gold text-xs font-bold flex items-center space-x-1.5 transition-colors"
              title="大屏演播模式 (Big-Screen Presentation)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">大屏演播</span>
            </button>
          )}

          {onPrintA4 && (
            <button
              onClick={onPrintA4}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-colors"
              title="打印战术白皮书 A4 手册"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Phase Description Banner */}
      <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-gray-300">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-heritage-gold">
            {currentPhase.titleZh || `阶段 ${currentPhaseIdx + 1}`}:
          </span>
          <span className="text-gray-200">
            {currentPhase.notesZh || currentPhase.notesEn || "观察跑位路线与战术职责"}
          </span>
        </div>
        <div className="text-[11px] text-gray-400 font-mono">
          {currentPhaseIdx + 1} / {phases.length}
        </div>
      </div>

      {/* SVG Interactive Pitch Canvas (1000 x 700 normalized) */}
      <div className="relative w-full aspect-[1000/700] rounded-xl overflow-hidden border border-white/20 shadow-2xl select-none">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 700"
          className="w-full h-full cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            {/* Markers for Trajectory Arrows */}
            <marker
              id="arrow-pass"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#D4AF37" />
            </marker>
            <marker
              id="arrow-run"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
            </marker>
            <marker
              id="arrow-dribble"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E" />
            </marker>

            {/* Ball texture gradients */}
            <radialGradient id="soccerGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
            <radialGradient id="volleyGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="60%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </radialGradient>
            <radialGradient id="basketGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="70%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#7C2D12" />
            </radialGradient>

            {/* Pitch pattern gradients */}
            <linearGradient id="grassStripes" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0E3320" />
              <stop offset="50%" stopColor="#0B2618" />
              <stop offset="100%" stopColor="#0E3320" />
            </linearGradient>
            <linearGradient id="hardwood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#261A13" />
              <stop offset="50%" stopColor="#1F140E" />
              <stop offset="100%" stopColor="#261A13" />
            </linearGradient>
            <linearGradient id="volleyballCourt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9A4822" />
              <stop offset="50%" stopColor="#B85D2A" />
              <stop offset="100%" stopColor="#8C3F1B" />
            </linearGradient>
          </defs>

          {/* COURT BACKGROUND RENDERING ACCORDING TO SPORT */}
          {sport === "FOOTBALL" && (
            <g id="footballPitch">
              {/* Grass Bands */}
              <rect width="1000" height="700" fill="#0A2215" />
              {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((x, i) => (
                <rect
                  key={x}
                  x={x}
                  y="0"
                  width="100"
                  height="700"
                  fill={i % 2 === 0 ? "#0C291A" : "#0E301F"}
                />
              ))}

              {/* Pitch Boundaries & Lines */}
              <rect
                x="40"
                y="35"
                width="920"
                height="630"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />

              {/* Halfway Line */}
              <line
                x1="500"
                y1="35"
                x2="500"
                y2="665"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />

              {/* Center Circle & Spot */}
              <circle
                cx="500"
                cy="350"
                r="85"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />
              <circle cx="500" cy="350" r="4.5" fill="#FFFFFF" fillOpacity="0.9" />

              {/* Left Penalty Area (18-yard box) */}
              <rect
                x="40"
                y="175"
                width="155"
                height="350"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />
              {/* Left Goal Area (6-yard box) */}
              <rect
                x="40"
                y="265"
                width="55"
                height="170"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeOpacity="0.75"
              />
              {/* Left Penalty Spot & Arc */}
              <circle cx="145" cy="350" r="4" fill="#FFFFFF" fillOpacity="0.9" />
              <path
                d="M 195 295 A 85 85 0 0 1 195 405"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />
              {/* Left Goal Net */}
              <rect
                x="15"
                y="305"
                width="25"
                height="90"
                fill="#FFFFFF"
                fillOpacity="0.1"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeOpacity="0.6"
              />

              {/* Right Penalty Area */}
              <rect
                x="805"
                y="175"
                width="155"
                height="350"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />
              {/* Right Goal Area */}
              <rect
                x="905"
                y="265"
                width="55"
                height="170"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeOpacity="0.75"
              />
              {/* Right Penalty Spot & Arc */}
              <circle cx="855" cy="350" r="4" fill="#FFFFFF" fillOpacity="0.9" />
              <path
                d="M 805 295 A 85 85 0 0 0 805 405"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />
              {/* Right Goal Net */}
              <rect
                x="960"
                y="305"
                width="25"
                height="90"
                fill="#FFFFFF"
                fillOpacity="0.1"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeOpacity="0.6"
              />

              {/* Corner Arcs */}
              <path d="M 40 55 A 20 20 0 0 0 60 35" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.7" />
              <path d="M 40 645 A 20 20 0 0 1 60 665" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.7" />
              <path d="M 940 35 A 20 20 0 0 0 960 55" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.7" />
              <path d="M 940 665 A 20 20 0 0 1 960 645" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.7" />
            </g>
          )}

          {sport === "VOLLEYBALL" && (
            <g id="volleyballPitch">
              {/* Outer Surround Flooring */}
              <rect width="1000" height="700" fill="#1A365D" />
              {/* Main Court (18m x 9m ratio, centered) */}
              <rect
                x="120"
                y="110"
                width="760"
                height="480"
                fill="url(#volleyballCourt)"
                stroke="#FFFFFF"
                strokeWidth="3.5"
              />

              {/* Center Net Line */}
              <line
                x1="500"
                y1="110"
                x2="500"
                y2="590"
                stroke="#E2E8F0"
                strokeWidth="5"
                strokeDasharray="4 2"
              />
              {/* Net Top Band & Poles */}
              <line x1="500" y1="90" x2="500" y2="610" stroke="#CBD5E1" strokeWidth="3" />
              <circle cx="500" cy="90" r="5" fill="#DC2626" />
              <circle cx="500" cy="610" r="5" fill="#DC2626" />

              {/* Left Attack Line (3m line) */}
              <line
                x1="373"
                y1="110"
                x2="373"
                y2="590"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              {/* Right Attack Line (3m line) */}
              <line
                x1="627"
                y1="110"
                x2="627"
                y2="590"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeDasharray="6 4"
              />

              {/* Zone Annotations */}
              <g fill="#FFFFFF" fillOpacity="0.35" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                <text x="430" y="210">Zone 4 (OH)</text>
                <text x="430" y="355">Zone 3 (MB)</text>
                <text x="430" y="500">Zone 2 (OPP)</text>
                <text x="230" y="210">Zone 5 (DS)</text>
                <text x="230" y="355">Zone 6 (PIPE)</text>
                <text x="230" y="500">Zone 1 (SET)</text>
              </g>
            </g>
          )}

          {sport === "BASKETBALL" && (
            <g id="basketballPitch">
              {/* Hardwood Flooring */}
              <rect width="1000" height="700" fill="url(#hardwood)" />

              {/* Wood Grain Lines */}
              {[70, 140, 210, 280, 350, 420, 490, 560, 630].map((y) => (
                <line
                  key={y}
                  x1="40"
                  y1={y}
                  x2="960"
                  y2={y}
                  stroke="#FFFFFF"
                  strokeWidth="0.5"
                  strokeOpacity="0.08"
                />
              ))}

              {/* Perimeter Boundary */}
              <rect
                x="50"
                y="50"
                width="900"
                height="600"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeOpacity="0.8"
              />

              {/* Half Court Line & Center Circle */}
              <line
                x1="500"
                y1="50"
                x2="500"
                y2="650"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeOpacity="0.8"
              />
              <circle
                cx="500"
                cy="350"
                r="70"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeOpacity="0.8"
              />

              {/* Left Key / Paint & Free Throw */}
              <rect
                x="50"
                y="240"
                width="170"
                height="220"
                fill="#78350F"
                fillOpacity="0.25"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              <circle
                cx="220"
                cy="350"
                r="65"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              {/* Left 3-Point Arc */}
              <path
                d="M 50 110 L 140 110 A 240 240 0 0 1 140 590 L 50 590"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              {/* Left Rim & Backboard */}
              <line x1="85" y1="315" x2="85" y2="385" stroke="#FFFFFF" strokeWidth="4" />
              <circle cx="105" cy="350" r="14" fill="none" stroke="#EA580C" strokeWidth="3" />

              {/* Right Key / Paint & Free Throw */}
              <rect
                x="780"
                y="240"
                width="170"
                height="220"
                fill="#78350F"
                fillOpacity="0.25"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              <circle
                cx="780"
                cy="350"
                r="65"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              {/* Right 3-Point Arc */}
              <path
                d="M 950 110 L 860 110 A 240 240 0 0 0 860 590 L 950 590"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              {/* Right Rim & Backboard */}
              <line x1="915" y1="315" x2="915" y2="385" stroke="#FFFFFF" strokeWidth="4" />
              <circle cx="895" cy="350" r="14" fill="none" stroke="#EA580C" strokeWidth="3" />
            </g>
          )}

          {/* TACTICAL TRAJECTORIES (ARROWS, PASSES, RUNS) */}
          {currentPhase.trajectories?.map((traj) => {
            const isCurve = traj.controlX && traj.controlY;
            const pathData = isCurve
              ? `M ${traj.startX} ${traj.startY} Q ${traj.controlX} ${traj.controlY} ${traj.endX} ${traj.endY}`
              : `M ${traj.startX} ${traj.startY} L ${traj.endX} ${traj.endY}`;

            let strokeColor = "#38BDF8"; // RUN = Sky Blue
            let markerEnd = "url(#arrow-run)";
            let strokeDash = "6 4";

            if (traj.type === "PASS") {
              strokeColor = "#FACC15"; // PASS = Bright Gold
              markerEnd = "url(#arrow-pass)";
              strokeDash = "none";
            } else if (traj.type === "DRIBBLE") {
              strokeColor = "#F43F5E"; // DRIBBLE = Crimson
              markerEnd = "url(#arrow-dribble)";
              strokeDash = "3 3";
            }

            return (
              <g key={traj.id} className="pointer-events-none">
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3.5"
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  markerEnd={markerEnd}
                  opacity="0.9"
                />
                {traj.label && (
                  <text
                    x={traj.controlX || (traj.startX + traj.endX) / 2}
                    y={(traj.controlY || (traj.startY + traj.endY) / 2) - 8}
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="bg-black/60 px-1 py-0.5"
                  >
                    {traj.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* TACTICAL TOKENS (PLAYERS, OPPONENTS, BALL) */}
          {displayedTokens.map((token) => {
            const isSelected = token.id === selectedTokenId;
            const isDragging = token.id === draggingTokenId;

            if (token.type === "BALL") {
              let ballFill = "url(#soccerGrad)";
              if (sport === "VOLLEYBALL") ballFill = "url(#volleyGrad)";
              if (sport === "BASKETBALL") ballFill = "url(#basketGrad)";

              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  onPointerDown={(e) => handlePointerDown(token.id, e)}
                  className="cursor-grab active:cursor-grabbing transition-transform duration-75"
                >
                  <circle cx="0" cy="0" r="14" fill="#000000" fillOpacity="0.4" />
                  <circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill={ballFill}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="filter drop-shadow-md"
                  />
                  {sport === "FOOTBALL" && (
                    <polygon
                      points="0,-6 5,-2 3,5 -3,5 -5,-2"
                      fill="#000000"
                      fillOpacity="0.75"
                    />
                  )}
                  {sport === "BASKETBALL" && (
                    <path
                      d="M -10 0 L 10 0 M 0 -10 L 0 10"
                      stroke="#000000"
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            }

            if (token.type === "OPPONENT") {
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  onPointerDown={(e) => handlePointerDown(token.id, e)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="17"
                    fill="#991B1B"
                    stroke="#EF4444"
                    strokeWidth="2"
                    className="filter drop-shadow-lg"
                  />
                  <text
                    x="0"
                    y="5"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="black"
                    textAnchor="middle"
                  >
                    {token.label || "X"}
                  </text>
                </g>
              );
            }

            // Athlete Token (Active / Hall of Fame / Alumni)
            const isHoF = token.alumniTier === "HALL_OF_FAME";
            const isAlumni = token.isRetired && !isHoF;

            let badgeStroke = "#34D399"; // Emerald active
            let badgeFill = "#064E3B";
            if (isHoF) {
              badgeStroke = "#F59E0B"; // Gold laurel
              badgeFill = "#78350F";
            } else if (isAlumni) {
              badgeStroke = "#94A3B8"; // Silver alumni
              badgeFill = "#334155";
            }

            const matchedPlayer = players?.find(
              (p) =>
                (token.jerseyNumber && p.jerseyNumber === token.jerseyNumber) ||
                p.user.nameZh === token.label ||
                p.user.nameEn === token.label ||
                (token.label && token.label.includes(p.user.nameZh))
            );
            const photo = token.photoUrl || matchedPlayer?.photoUrl;

            return (
              <g
                key={token.id}
                transform={`translate(${token.x}, ${token.y})`}
                onPointerDown={(e) => handlePointerDown(token.id, e)}
                onClick={() => setSelectedTokenId(token.id)}
                className={`cursor-pointer transition-transform ${
                  isSelected ? "scale-110" : ""
                } ${isDragging ? "opacity-90" : ""}`}
              >
                {/* Glow ring if selected */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="28"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin-slow"
                  />
                )}

                {photo ? (
                  <g>
                    <clipPath id={`clip-${token.id}`}>
                      <circle cx="0" cy="0" r="20" />
                    </clipPath>
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill={badgeFill}
                      stroke={badgeStroke}
                      strokeWidth="2.5"
                      className="filter drop-shadow-xl"
                    />
                    <image
                      href={photo}
                      x="-20"
                      y="-20"
                      width="40"
                      height="40"
                      clipPath={`url(#clip-${token.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                    {/* Miniature Jersey Pill at bottom right */}
                    <g transform="translate(13, 13)">
                      <circle cx="0" cy="0" r="8" fill="#000000" stroke={badgeStroke} strokeWidth="1.5" />
                      <text x="0" y="3" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle">
                        {token.jerseyNumber ?? "•"}
                      </text>
                    </g>
                  </g>
                ) : (
                  <g>
                    {/* Base Token Shield / Circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r="21"
                      fill={badgeFill}
                      stroke={badgeStroke}
                      strokeWidth="2.5"
                      className="filter drop-shadow-xl"
                    />

                    {/* Jersey Number */}
                    <text
                      x="0"
                      y="4"
                      fill="#FFFFFF"
                      fontSize="13"
                      fontWeight="black"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      {token.jerseyNumber ?? token.position ?? "•"}
                    </text>
                  </g>
                )}

                {/* Captain Badge Ribbon */}
                {token.isCaptain && (
                  <g transform="translate(12, -15)">
                    <circle cx="0" cy="0" r="7" fill="#F59E0B" stroke="#000000" strokeWidth="1" />
                    <text
                      x="0"
                      y="3.5"
                      fill="#000000"
                      fontSize="9"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      C
                    </text>
                  </g>
                )}

                {/* Hall of Fame Wreath Star */}
                {isHoF && (
                  <g transform="translate(-13, -15)">
                    <circle cx="0" cy="0" r="7" fill="#B45309" stroke="#FDE047" strokeWidth="1" />
                    <text
                      x="0"
                      y="3.5"
                      fill="#FDE047"
                      fontSize="9"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      ★
                    </text>
                  </g>
                )}

                {/* Label text pill below badge */}
                <g transform="translate(0, 32)">
                  <rect
                    x="-40"
                    y="-10"
                    width="80"
                    height="18"
                    rx="4"
                    fill="#000000"
                    fillOpacity="0.8"
                    stroke={badgeStroke}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {token.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Token Tactical Duties & Instructions Card */}
      {selectedToken && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-black/80 via-black/60 to-black/80 border border-heritage-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-heritage-gold/20 border border-heritage-gold/40 flex items-center justify-center font-serif font-black text-heritage-gold text-lg shrink-0">
              {selectedToken.jerseyNumber || selectedToken.position || "•"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-white text-sm">{selectedToken.label}</h4>
                {selectedToken.isCaptain && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    队长 (Captain)
                  </span>
                )}
                {selectedToken.alumniTier === "HALL_OF_FAME" && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold flex items-center space-x-1">
                    <Award className="w-3 h-3" />
                    <span>校队名宿</span>
                  </span>
                )}
                {selectedToken.isRetired && selectedToken.alumniTier !== "HALL_OF_FAME" && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/40 font-bold flex items-center space-x-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>毕业校友</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mt-1">
                <strong className="text-heritage-gold">本阶段战术职责：</strong>{" "}
                {selectedToken.dutyZh || selectedToken.dutyEn || "保持战术位置，随时策应传球。"}
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-400 font-mono shrink-0">
            坐标: ({selectedToken.x}, {selectedToken.y})
          </div>
        </div>
      )}
    </div>
  );
}
