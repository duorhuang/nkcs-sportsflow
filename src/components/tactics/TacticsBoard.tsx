"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import {
  TacticData,
  TacticPhaseData,
  TacticToken,
  TacticTrajectory,
  SportChannel,
  PlayerProfileData,
  TrajectoryType,
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
  Move,
  ArrowRight,
  Footprints,
  Zap,
  Eraser,
  CircleDot,
  Shield,
  Flag,
  Undo2,
  Type,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export type BoardTool = "SELECT" | "PASS" | "RUN" | "DRIBBLE" | "TEXT" | "ERASE";

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
  editable = true, // Default interactive board
  onUpdateTactic,
  onOpenBigScreen,
  onPrintA4,
}: TacticsBoardProps) {
  const { user, locale } = useApp();
  const isZh = locale === "zh";
  const isPlayer = user?.role === "PLAYER";
  const canEdit = editable && !isPlayer;

  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);

  // Active Tool State
  const [activeTool, setActiveTool] = useState<BoardTool>("SELECT");

  // Local phase data copy to guarantee instant 60fps dragging and tactile responsiveness
  const [phases, setPhases] = useState<TacticPhaseData[]>(tactic.phases || []);

  useEffect(() => {
    if (tactic.phases) {
      setPhases(tactic.phases);
    }
  }, [tactic]);

  const currentPhase: TacticPhaseData = phases[currentPhaseIdx] || {
    phaseIndex: 1,
    titleZh: "阶段一",
    titleEn: "Phase 1",
    tokens: [],
    trajectories: [],
  };

  // Athlete matching
  const myPlayerProfile = players?.find(
    (p) =>
      p.userId === user?.id ||
      p.user?.username === user?.username ||
      p.user?.nameZh === user?.nameZh ||
      p.user?.nameEn === user?.nameEn
  );

  const myToken = currentPhase?.tokens?.find(
    (t) =>
      (myPlayerProfile && t.jerseyNumber && t.jerseyNumber === myPlayerProfile.jerseyNumber) ||
      t.label === user?.nameZh ||
      t.label === user?.nameEn ||
      (user?.nameZh && t.label?.includes(user?.nameZh))
  );

  const handlePrevPhase = () => {
    if (currentPhaseIdx > 0) setCurrentPhaseIdx(currentPhaseIdx - 1);
  };

  const handleNextPhase = () => {
    if (currentPhaseIdx < phases.length - 1) setCurrentPhaseIdx(currentPhaseIdx + 1);
  };

  // Dragging & Drawing State
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [drawingTrajectory, setDrawingTrajectory] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    type: TrajectoryType;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

  // SVG Normalized Coordinate Transformer (1000 x 700)
  const getSvgCoordinates = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 500, y: 350 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 500, y: 350 };
    const local = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.round(Math.max(15, Math.min(985, local.x))),
      y: Math.round(Math.max(15, Math.min(685, local.y))),
    };
  };

  // Sync update helper
  const commitPhaseUpdate = (newTokens: TacticToken[], newTrajectories: TacticTrajectory[]) => {
    const updatedPhases = phases.map((p, idx) =>
      idx === currentPhaseIdx
        ? { ...p, tokens: newTokens, trajectories: newTrajectories }
        : p
    );
    setPhases(updatedPhases);
    if (onUpdateTactic) {
      onUpdateTactic({
        ...tactic,
        phases: updatedPhases,
      });
    }
  };

  // ================= POINTER / TOUCH GESTURE HANDLERS =================

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPlaying) return;
    const coords = getSvgCoordinates(e.clientX, e.clientY);

    // Check if clicked directly on an existing token
    const clickedToken = currentPhase.tokens.find(
      (t) => Math.hypot(t.x - coords.x, t.y - coords.y) <= 28
    );

    if (!canEdit) {
      if (clickedToken) {
        setSelectedTokenId(clickedToken.id);
      } else {
        setSelectedTokenId(null);
      }
      return;
    }

    if (activeTool === "ERASE") {
      if (clickedToken) {
        // Delete token
        const remaining = currentPhase.tokens.filter((t) => t.id !== clickedToken.id);
        commitPhaseUpdate(remaining, currentPhase.trajectories || []);
        if (selectedTokenId === clickedToken.id) setSelectedTokenId(null);
      }
      return;
    }

    if (activeTool === "SELECT") {
      if (clickedToken) {
        setDraggingTokenId(clickedToken.id);
        setSelectedTokenId(clickedToken.id);
      } else {
        setSelectedTokenId(null);
      }
      return;
    }

    // Text Annotation Placement Tool
    if (activeTool === "TEXT") {
      const defaultText = isZh ? "高位压迫" : "High Press";
      const userText = window.prompt(
        isZh ? "请输入战术文字标注 (如: 肋部穿插、后排梯次攻、挡拆顺下):" : "Enter tactical pitch label:",
        defaultText
      );
      if (userText && userText.trim()) {
        const textToken: TacticToken = {
          id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          type: "TEXT",
          label: userText.trim(),
          x: coords.x,
          y: coords.y,
          dutyZh: userText.trim(),
          dutyEn: userText.trim(),
        };
        commitPhaseUpdate([...currentPhase.tokens, textToken], currentPhase.trajectories || []);
        setSelectedTokenId(textToken.id);
        setActiveTool("SELECT");
      }
      return;
    }

    // Trajectory Drawing Mode ("PASS" | "RUN" | "DRIBBLE")
    if (activeTool === "PASS" || activeTool === "RUN" || activeTool === "DRIBBLE") {
      const startX = clickedToken ? clickedToken.x : coords.x;
      const startY = clickedToken ? clickedToken.y : coords.y;

      setDrawingTrajectory({
        startX,
        startY,
        currentX: coords.x,
        currentY: coords.y,
        type: activeTool,
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPlaying) return;
    const coords = getSvgCoordinates(e.clientX, e.clientY);

    if (draggingTokenId) {
      // Fluid real-time dragging of selected token
      const updatedTokens = currentPhase.tokens.map((t) =>
        t.id === draggingTokenId ? { ...t, x: coords.x, y: coords.y } : t
      );
      const updatedPhases = phases.map((p, idx) =>
        idx === currentPhaseIdx ? { ...p, tokens: updatedTokens } : p
      );
      setPhases(updatedPhases);
    } else if (drawingTrajectory) {
      // Live arrow line preview
      setDrawingTrajectory((prev) =>
        prev
          ? {
              ...prev,
              currentX: coords.x,
              currentY: coords.y,
            }
          : null
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingTokenId) {
      // Finished dragging: notify parent
      setDraggingTokenId(null);
      if (onUpdateTactic) {
        onUpdateTactic({
          ...tactic,
          phases,
        });
      }
    }

    if (drawingTrajectory) {
      const dist = Math.hypot(
        drawingTrajectory.currentX - drawingTrajectory.startX,
        drawingTrajectory.currentY - drawingTrajectory.startY
      );

      // If user dragged more than 16px, finalize trajectory arrow
      if (dist >= 16) {
        const newTraj: TacticTrajectory = {
          id: `traj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: drawingTrajectory.type,
          startX: drawingTrajectory.startX,
          startY: drawingTrajectory.startY,
          controlX: Math.round((drawingTrajectory.startX + drawingTrajectory.currentX) / 2),
          controlY: Math.round((drawingTrajectory.startY + drawingTrajectory.currentY) / 2),
          endX: drawingTrajectory.currentX,
          endY: drawingTrajectory.currentY,
        };

        const updatedTrajectories = [...(currentPhase.trajectories || []), newTraj];
        commitPhaseUpdate(currentPhase.tokens, updatedTrajectories);
      }

      setDrawingTrajectory(null);
    }
  };

  // Erase Trajectory
  const handleEraseTrajectory = (trajId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === "ERASE") {
      const remaining = (currentPhase.trajectories || []).filter((t) => t.id !== trajId);
      commitPhaseUpdate(currentPhase.tokens, remaining);
    }
  };

  // Quick Add Item
  const handleAddToken = (type: "PLAYER" | "OPPONENT" | "BALL" | "CONE") => {
    const id = `token_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    let label = "P";
    if (type === "OPPONENT") label = "X";
    if (type === "BALL") label = "⚽";
    if (type === "CONE") label = "▲";

    const newToken: TacticToken = {
      id,
      type,
      label,
      jerseyNumber: type === "PLAYER" ? currentPhase.tokens.length + 1 : undefined,
      x: 500 + Math.round((Math.random() - 0.5) * 160),
      y: 350 + Math.round((Math.random() - 0.5) * 120),
      dutyZh: type === "PLAYER" ? "协同策应与落位" : undefined,
    };

    commitPhaseUpdate([...currentPhase.tokens, newToken], currentPhase.trajectories || []);
    setSelectedTokenId(id);
    setActiveTool("SELECT");
  };

  // Clear all trajectories in current phase
  const handleClearTrajectories = () => {
    commitPhaseUpdate(currentPhase.tokens, []);
  };

  // Reset phase to seed
  const handleResetPhase = () => {
    if (tactic.phases && tactic.phases[currentPhaseIdx]) {
      const seedPhase = JSON.parse(JSON.stringify(tactic.phases[currentPhaseIdx]));
      const updatedPhases = phases.map((p, idx) => (idx === currentPhaseIdx ? seedPhase : p));
      setPhases(updatedPhases);
      if (onUpdateTactic) {
        onUpdateTactic({
          ...tactic,
          phases: updatedPhases,
        });
      }
    }
  };

  const selectedToken = currentPhase.tokens.find((t) => t.id === selectedTokenId);

  return (
    <div className="bg-[#121815] border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-3.5 select-none w-full">
      {/* ================= 1. TOP HEADER & PHASES BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
        {/* Phase Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          {phases.map((phase, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsPlaying(false);
                setCurrentPhaseIdx(idx);
                setAnimProgress(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                currentPhaseIdx === idx
                  ? "bg-amber-600 text-stone-950 font-black shadow-md scale-105"
                  : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
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
                const nextPhases = [...phases, newPhase];
                setPhases(nextPhases);
                onUpdateTactic({
                  ...tactic,
                  phases: nextPhases,
                });
                setCurrentPhaseIdx(phases.length);
              }}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-400 transition-colors"
              title="添加阶段"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Playback & Utility Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              setAnimProgress(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              isPlaying
                ? "bg-amber-600 text-stone-950 shadow-md"
                : "bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
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
            onClick={handleResetPhase}
            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-stone-100 transition-colors"
            title="一键复位本阶段"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onOpenBigScreen && (
            <button
              onClick={onOpenBigScreen}
              className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-amber-400 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              title="大屏演播模式"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">大屏演播</span>
            </button>
          )}

          {onPrintA4 && (
            <button
              onClick={onPrintA4}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-colors"
              title="打印战术白皮书 A4"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. TACTICAL TOOLBOX (MODE PALETTE) vs ATHLETE SPOTLIGHT ================= */}
      {canEdit ? (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-stone-900/90 border border-stone-800">
          {/* Drawing & Interaction Modes */}
          <div className="flex items-center space-x-1 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2">
              工具:
            </span>

            <button
              onClick={() => setActiveTool("SELECT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTool === "SELECT"
                  ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                  : "bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white"
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>✋ 选人移动</span>
            </button>

            <button
              onClick={() => setActiveTool("PASS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTool === "PASS"
                  ? "bg-amber-500 text-stone-950 font-black shadow-sm"
                  : "bg-stone-800/80 text-amber-300/90 hover:bg-stone-700"
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span>➡️ 传球路线</span>
            </button>

            <button
              onClick={() => setActiveTool("RUN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTool === "RUN"
                  ? "bg-sky-500 text-stone-950 font-black shadow-sm"
                  : "bg-stone-800/80 text-sky-300/90 hover:bg-stone-700"
              }`}
            >
              <Footprints className="w-3.5 h-3.5 text-sky-400" />
              <span>🏃 跑位路线</span>
            </button>

            <button
              onClick={() => setActiveTool("DRIBBLE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTool === "DRIBBLE"
                  ? "bg-orange-500 text-stone-950 font-black shadow-sm"
                  : "bg-stone-800/80 text-orange-300/90 hover:bg-stone-700"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>⚡ 运球突破</span>
            </button>

            <button
              onClick={() => setActiveTool("TEXT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTool === "TEXT"
                  ? "bg-purple-600 text-white font-black shadow-sm"
                  : "bg-stone-800/80 text-purple-300/90 hover:bg-stone-700"
              }`}
              title={isZh ? "在球场上任意位置添加文字战术标注" : "Click pitch to add text annotation"}
            >
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span>🔤 文字标注</span>
            </button>

            <button
              onClick={() => setActiveTool("ERASE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTool === "ERASE"
                  ? "bg-rose-700 text-white font-black shadow-sm"
                  : "bg-stone-800/80 text-rose-300/90 hover:bg-stone-700"
              }`}
            >
              <Eraser className="w-3.5 h-3.5 text-rose-400" />
              <span>🧹 橡皮擦</span>
            </button>
          </div>

          {/* Quick Stamp Tokens & Clear Trajectories */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleAddToken("BALL")}
              className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center space-x-1"
              title="添加比赛球"
            >
              <span>+ ⚽ 球</span>
            </button>

            <button
              onClick={() => handleAddToken("OPPONENT")}
              className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-red-300 text-xs font-semibold flex items-center space-x-1"
              title="添加防守人"
            >
              <span>+ 🛡️ 防守人</span>
            </button>

            <button
              onClick={() => handleAddToken("CONE")}
              className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold flex items-center space-x-1"
              title="添加标志锥"
            >
              <span>+ 🚩 标志锥</span>
            </button>

            <button
              onClick={handleClearTrajectories}
              className="px-2 py-1 rounded-md bg-stone-800/60 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs"
              title="清空当前阶段所有箭头"
            >
              清空箭头
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/50 via-stone-900 to-stone-900 border border-amber-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isZh ? "我的战术跑位任务" : "My Tactical Duty"}
                </span>
                {myToken && (
                  <span className="text-xs font-bold text-stone-200">
                    #{myToken.jerseyNumber || (myPlayerProfile?.jerseyNumber ?? "")} {myToken.label || user?.nameZh} ({myToken.position || (myPlayerProfile?.primaryPosition ?? "")})
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300 mt-1 font-medium leading-relaxed">
                {myToken?.dutyZh || myToken?.dutyEn || (isZh ? `本阶段请密切注意纵深跑位，与队友形成交叉换位掩护！` : `Hold positioning and execute coordinated movement.`)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrevPhase}
              disabled={currentPhaseIdx === 0}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-bold flex items-center space-x-1 border border-stone-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isZh ? "拆解上一步" : "Prev Step"}</span>
            </button>
            <button
              onClick={handleNextPhase}
              disabled={currentPhaseIdx === phases.length - 1}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-bold flex items-center space-x-1 border border-stone-700 transition-all"
            >
              <span>{isZh ? "拆解下一步" : "Next Step"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                setAnimProgress(0);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPlaying ? (isZh ? "暂停演练" : "Pause") : (isZh ? "连贯推演" : "Play Run")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Phase Description Banner */}
      <div className="px-3.5 py-2 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between text-xs text-stone-300">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-amber-400">
            {currentPhase.titleZh || `阶段 ${currentPhaseIdx + 1}`}:
          </span>
          <span className="text-stone-300">
            {currentPhase.notesZh || currentPhase.notesEn || "观察跑位路线与战术职责"}
          </span>
        </div>
        <div className="text-[11px] text-stone-400 font-mono">
          {currentPhaseIdx + 1} / {phases.length} 阶段
        </div>
      </div>

      {/* ================= 3. INTERACTIVE PITCH CANVAS (SVG Normalized 1000 x 700) ================= */}
      <div
        className="relative w-full aspect-[1000/700] rounded-xl overflow-hidden border border-stone-800 shadow-2xl select-none"
        style={{ touchAction: "none" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1000 700"
          className={`w-full h-full ${
            activeTool === "SELECT"
              ? "cursor-default"
              : activeTool === "ERASE"
              ? "cursor-not-allowed"
              : "cursor-crosshair"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (draggingTokenId) setDraggingTokenId(null);
            if (drawingTrajectory) setDrawingTrajectory(null);
          }}
        >
          <defs>
            {/* Markers for Trajectory Arrows */}
            <marker
              id="arrow-pass-v3"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#D4AF37" />
            </marker>
            <marker
              id="arrow-run-v3"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
            </marker>
            <marker
              id="arrow-dribble-v3"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FB923C" />
            </marker>
          </defs>

          {/* ================= COURT TEXTURES (SPORTS HERITAGE) ================= */}

          {sport === "FOOTBALL" && (
            <g id="footballPitchV3">
              {/* Natural Grass Base */}
              <rect width="1000" height="700" fill="#0E2419" />

              {/* Mowing Lawn Bands */}
              {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((x, i) => (
                <rect
                  key={x}
                  x={x}
                  y="0"
                  width="100"
                  height="700"
                  fill={i % 2 === 0 ? "#122E20" : "#0E2419"}
                />
              ))}

              {/* Outer Chalk Perimeter */}
              <rect
                x="40"
                y="35"
                width="920"
                height="630"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />

              {/* Half-way Line & Center Circle */}
              <line
                x1="500"
                y1="35"
                x2="500"
                y2="665"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              <circle
                cx="500"
                cy="350"
                r="80"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              <circle cx="500" cy="350" r="4.5" fill="#FFFFFF" fillOpacity="0.9" />

              {/* Left Penalty Area */}
              <rect
                x="40"
                y="175"
                width="155"
                height="350"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
              <rect
                x="40"
                y="265"
                width="55"
                height="170"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeOpacity="0.8"
              />
              <circle cx="145" cy="350" r="4" fill="#FFFFFF" fillOpacity="0.9" />
              <path
                d="M 195 295 A 85 85 0 0 1 195 405"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.8"
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
                strokeOpacity="0.8"
              />
              <rect
                x="905"
                y="265"
                width="55"
                height="170"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeOpacity="0.8"
              />
              <circle cx="855" cy="350" r="4" fill="#FFFFFF" fillOpacity="0.9" />
              <path
                d="M 805 295 A 85 85 0 0 0 805 405"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
            </g>
          )}

          {sport === "VOLLEYBALL" && (
            <g id="volleyballPitchV3">
              {/* Outer Surround Flooring */}
              <rect width="1000" height="700" fill="#141E28" />

              {/* Main Court (Teraflex / Maple) */}
              <rect
                x="120"
                y="110"
                width="760"
                height="480"
                fill="#8C3F1B"
                stroke="#FFFFFF"
                strokeWidth="3.5"
              />

              {/* Center Net Line */}
              <line
                x1="500"
                y1="110"
                x2="500"
                y2="590"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeDasharray="4 2"
              />
              <circle cx="500" cy="90" r="6" fill="#DC2626" />
              <circle cx="500" cy="610" r="6" fill="#DC2626" />

              {/* Left & Right Attack Lines (3m) */}
              <line
                x1="373"
                y1="110"
                x2="373"
                y2="590"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
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
              <g fill="#FFFFFF" fillOpacity="0.3" fontSize="13" fontWeight="bold">
                <text x="430" y="210">Zone 4</text>
                <text x="430" y="355">Zone 3</text>
                <text x="430" y="500">Zone 2</text>
                <text x="230" y="210">Zone 5</text>
                <text x="230" y="355">Zone 6</text>
                <text x="230" y="500">Zone 1</text>
              </g>
            </g>
          )}

          {sport === "BASKETBALL" && (
            <g id="basketballPitchV3">
              {/* Natural Hardwood */}
              <rect width="1000" height="700" fill="#20140E" />

              {/* Parquet Grain Lines */}
              {[70, 140, 210, 280, 350, 420, 490, 560, 630].map((y) => (
                <line
                  key={y}
                  x1="40"
                  y1={y}
                  x2="960"
                  y2={y}
                  stroke="#FFFFFF"
                  strokeWidth="0.5"
                  strokeOpacity="0.06"
                />
              ))}

              {/* Boundary */}
              <rect
                x="50"
                y="50"
                width="900"
                height="600"
                fill="none"
                stroke="#C5A059"
                strokeWidth="3"
                strokeOpacity="0.85"
              />

              {/* Half Court & Center Circle */}
              <line
                x1="500"
                y1="50"
                x2="500"
                y2="650"
                stroke="#C5A059"
                strokeWidth="3"
                strokeOpacity="0.85"
              />
              <circle
                cx="500"
                cy="350"
                r="70"
                fill="none"
                stroke="#C5A059"
                strokeWidth="3"
                strokeOpacity="0.85"
              />

              {/* Left Key / Paint */}
              <rect
                x="50"
                y="240"
                width="170"
                height="220"
                fill="#5E2A12"
                fillOpacity="0.3"
                stroke="#C5A059"
                strokeWidth="2.5"
              />
              <circle cx="220" cy="350" r="65" fill="none" stroke="#C5A059" strokeWidth="2.5" />
              {/* Left 3-Point Arc */}
              <path
                d="M 50 110 L 140 110 A 240 240 0 0 1 140 590 L 50 590"
                fill="none"
                stroke="#C5A059"
                strokeWidth="2.5"
              />
              <line x1="85" y1="315" x2="85" y2="385" stroke="#FFFFFF" strokeWidth="4" />
              <circle cx="105" cy="350" r="14" fill="none" stroke="#EA580C" strokeWidth="3" />

              {/* Right Key / Paint */}
              <rect
                x="780"
                y="240"
                width="170"
                height="220"
                fill="#5E2A12"
                fillOpacity="0.3"
                stroke="#C5A059"
                strokeWidth="2.5"
              />
              <circle cx="780" cy="350" r="65" fill="none" stroke="#C5A059" strokeWidth="2.5" />
              {/* Right 3-Point Arc */}
              <path
                d="M 950 110 L 860 110 A 240 240 0 0 0 860 590 L 950 590"
                fill="none"
                stroke="#C5A059"
                strokeWidth="2.5"
              />
              <line x1="915" y1="315" x2="915" y2="385" stroke="#FFFFFF" strokeWidth="4" />
              <circle cx="895" cy="350" r="14" fill="none" stroke="#EA580C" strokeWidth="3" />
            </g>
          )}

          {/* ================= 4. TACTICAL TRAJECTORIES (ARROWS) ================= */}
          {currentPhase.trajectories?.map((traj) => {
            const isCurve = traj.controlX && traj.controlY;
            const pathData = isCurve
              ? `M ${traj.startX} ${traj.startY} Q ${traj.controlX} ${traj.controlY} ${traj.endX} ${traj.endY}`
              : `M ${traj.startX} ${traj.startY} L ${traj.endX} ${traj.endY}`;

            let strokeColor = "#38BDF8"; // RUN = Sky Blue
            let markerEnd = "url(#arrow-run-v3)";
            let strokeDash = "7 5";

            if (traj.type === "PASS") {
              strokeColor = "#D4AF37"; // PASS = Classic Gold
              markerEnd = "url(#arrow-pass-v3)";
              strokeDash = "none";
            } else if (traj.type === "DRIBBLE") {
              strokeColor = "#FB923C"; // DRIBBLE = Amber/Orange
              markerEnd = "url(#arrow-dribble-v3)";
              strokeDash = "4 3";
            }

            return (
              <g
                key={traj.id}
                onClick={(e) => handleEraseTrajectory(traj.id, e)}
                className={activeTool === "ERASE" ? "cursor-pointer group" : "pointer-events-none"}
              >
                {/* Invisible wide click buffer for easy clicking */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                  className="pointer-events-auto"
                />

                {/* Visible Arrow */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3.5"
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  markerEnd={markerEnd}
                  opacity="0.9"
                  className="transition-opacity group-hover:opacity-40"
                />

                {/* Hover indicator when in ERASE mode */}
                {activeTool === "ERASE" && (
                  <circle
                    cx={(traj.startX + traj.endX) / 2}
                    cy={(traj.startY + traj.endY) / 2}
                    r="8"
                    fill="#EF4444"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}

          {/* Live Drawing Preview Line */}
          {drawingTrajectory && (
            <g className="pointer-events-none">
              <line
                x1={drawingTrajectory.startX}
                y1={drawingTrajectory.startY}
                x2={drawingTrajectory.currentX}
                y2={drawingTrajectory.currentY}
                stroke={
                  drawingTrajectory.type === "PASS"
                    ? "#D4AF37"
                    : drawingTrajectory.type === "RUN"
                    ? "#38BDF8"
                    : "#FB923C"
                }
                strokeWidth="3.5"
                strokeDasharray={drawingTrajectory.type === "PASS" ? "none" : "6 4"}
                markerEnd={
                  drawingTrajectory.type === "PASS"
                    ? "url(#arrow-pass-v3)"
                    : drawingTrajectory.type === "RUN"
                    ? "url(#arrow-run-v3)"
                    : "url(#arrow-dribble-v3)"
                }
              />
              <circle
                cx={drawingTrajectory.startX}
                cy={drawingTrajectory.startY}
                r="4"
                fill="#FFFFFF"
              />
            </g>
          )}

          {/* ================= 5. TACTICAL TOKENS (ATHLETES, BALL, CONES, TEXT) ================= */}
          {displayedTokens.map((token) => {
            const isSelected = token.id === selectedTokenId;
            const isDragging = token.id === draggingTokenId;

            // Tactical Text Annotation Token
            if (token.type === "TEXT" || token.id.startsWith("text_")) {
              const textWidth = Math.max(68, (token.label || "").length * 12 + 22);
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  className={`${
                    canEdit && activeTool === "SELECT" ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                  } ${isSelected ? "scale-105" : ""} transition-transform duration-150`}
                  onClick={(e) => {
                    if (activeTool === "ERASE") {
                      e.stopPropagation();
                      const remaining = currentPhase.tokens.filter((t) => t.id !== token.id);
                      commitPhaseUpdate(remaining, currentPhase.trajectories || []);
                    }
                  }}
                >
                  <rect
                    x={-textWidth / 2}
                    y="-14"
                    width={textWidth}
                    height="28"
                    rx="6"
                    fill="#1C1F1D"
                    stroke={isSelected ? "#F59E0B" : "#C5A059"}
                    strokeWidth="1.5"
                    strokeDasharray={isSelected ? "none" : "3 2"}
                    fillOpacity="0.95"
                    className="filter drop-shadow-md"
                  />
                  <text
                    x="0"
                    y="4.5"
                    fill="#F8FAFC"
                    fontSize="11.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {token.label}
                  </text>
                </g>
              );
            }

            // Ball Token
            if (token.type === "BALL") {
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  className={activeTool === "SELECT" ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <circle cx="0" cy="0" r="14" fill="#000000" fillOpacity="0.5" />
                  <circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill="#F8FAFC"
                    stroke="#000000"
                    strokeWidth="1.5"
                  />
                  {sport === "FOOTBALL" && (
                    <polygon
                      points="0,-5 4,-2 2,4 -2,4 -4,-2"
                      fill="#000000"
                      fillOpacity="0.8"
                    />
                  )}
                  {sport === "BASKETBALL" && (
                    <path
                      d="M -10 0 L 10 0 M 0 -10 L 0 10"
                      stroke="#EA580C"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            }

            // Cone Token (Training Cone)
            if (token.type === "CONE") {
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  className={activeTool === "SELECT" ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <polygon
                    points="0,-16 -12,12 12,12"
                    fill="#F97316"
                    stroke="#C2410C"
                    strokeWidth="1.5"
                  />
                  <line x1="-7" y1="2" x2="7" y2="2" stroke="#FFFFFF" strokeWidth="2" />
                </g>
              );
            }

            // Opponent Token
            if (token.type === "OPPONENT") {
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  className={activeTool === "SELECT" ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="17"
                    fill="#881337"
                    stroke="#F43F5E"
                    strokeWidth="2"
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

            // Athlete Token
            const isHoF = token.alumniTier === "HALL_OF_FAME";
            const isAlumni = token.isRetired && !isHoF;

            let badgeStroke = "#34D399";
            let badgeFill = "#064E3B";
            if (isHoF) {
              badgeStroke = "#F59E0B";
              badgeFill = "#78350F";
            } else if (isAlumni) {
              badgeStroke = "#94A3B8";
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

            const isMe = myToken && token.id === myToken.id;
            const isDimmed = !canEdit && myToken && !isMe;

            return (
              <g
                key={token.id}
                transform={`translate(${token.x}, ${token.y})`}
                opacity={isDimmed ? 0.6 : 1}
                className={`${
                  canEdit && activeTool === "SELECT" ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                } ${isSelected ? "scale-105" : ""} ${isDragging ? "opacity-90" : ""} transition-opacity duration-300`}
              >
                {/* Athlete Spotlight (Golden Halo & Pulsing Rings) */}
                {isMe && (
                  <g>
                    <circle
                      cx="0"
                      cy="0"
                      r="29"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="36"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                  </g>
                )}

                {/* Selection Ring (Matte Gold) */}
                {isSelected && !isMe && (
                  <circle
                    cx="0"
                    cy="0"
                    r="27"
                    fill="none"
                    stroke="#C5A059"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
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
                      strokeWidth="2"
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
                    {/* Jersey number pill at bottom right */}
                    <g transform="translate(13, 13)">
                      <circle cx="0" cy="0" r="8" fill="#1C1917" stroke={badgeStroke} strokeWidth="1" />
                      <text x="0" y="3" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle">
                        {token.jerseyNumber ?? "•"}
                      </text>
                    </g>
                  </g>
                ) : (
                  <g>
                    <circle
                      cx="0"
                      cy="0"
                      r="20"
                      fill={badgeFill}
                      stroke={badgeStroke}
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="4"
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      {token.jerseyNumber ?? token.position ?? "•"}
                    </text>
                  </g>
                )}

                {/* Captain Badge */}
                {token.isCaptain && (
                  <g transform="translate(13, -15)">
                    <circle cx="0" cy="0" r="7" fill="#D97706" stroke="#1C1917" strokeWidth="1" />
                    <text x="0" y="3.5" fill="#1C1917" fontSize="9" fontWeight="black" textAnchor="middle">
                      C
                    </text>
                  </g>
                )}

                {/* Hall of Fame Star */}
                {isHoF && (
                  <g transform="translate(-13, -15)">
                    <circle cx="0" cy="0" r="7" fill="#92400E" stroke="#FDE047" strokeWidth="1" />
                    <text x="0" y="3.5" fill="#FDE047" fontSize="9" fontWeight="black" textAnchor="middle">
                      ★
                    </text>
                  </g>
                )}

                {/* Label Tag below Token */}
                <g transform="translate(0, 30)">
                  <rect
                    x="-35"
                    y="-9"
                    width="70"
                    height="18"
                    rx="4"
                    fill="#1C1917"
                    stroke={badgeStroke}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    fill="#F8FAFC"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {token.label}
                  </text>
                </g>

                {/* Spotlight label for the logged-in athlete */}
                {isMe && (
                  <g transform="translate(0, 48)">
                    <rect
                      x="-38"
                      y="-7"
                      width="76"
                      height="14"
                      rx="3"
                      fill="#D97706"
                      stroke="#FDE68A"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill="#1C1917"
                      fontSize="8.5"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      ★ 我的点位 (YOU)
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ================= 6. SELECTED TOKEN DUTIES & ATTRIBUTES CARD ================= */}
      {selectedToken && (
        <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center font-serif font-black text-amber-400 text-base shrink-0">
              {selectedToken.jerseyNumber || selectedToken.position || "•"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-stone-100 text-sm">{selectedToken.label}</h4>
                {selectedToken.isCaptain && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50 font-bold">
                    队长
                  </span>
                )}
                {selectedToken.alumniTier === "HALL_OF_FAME" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/60 font-bold flex items-center space-x-0.5">
                    <Award className="w-2.5 h-2.5" />
                    <span>校队名宿</span>
                  </span>
                )}
                {selectedToken.isRetired && selectedToken.alumniTier !== "HALL_OF_FAME" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 font-bold flex items-center space-x-0.5">
                    <GraduationCap className="w-2.5 h-2.5" />
                    <span>毕业校友</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                <strong className="text-amber-400">本阶段战术职责：</strong>{" "}
                {selectedToken.dutyZh || selectedToken.dutyEn || "保持战术位置，随时策应传球。"}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 font-mono shrink-0">
            坐标: ({selectedToken.x}, {selectedToken.y})
          </div>
        </div>
      )}
    </div>
  );
}
