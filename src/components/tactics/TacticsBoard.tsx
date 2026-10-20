"use client";

import React, { useState, useRef, useEffect } from "react";
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
  LayoutGrid,
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
  editable = true,
  onUpdateTactic,
  onOpenBigScreen,
  onPrintA4,
}: TacticsBoardProps) {
  const { user, locale } = useApp();
  const isZh = locale === "zh";

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
    const duration = 2400;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      setAnimProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
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

    // 1. Check if clicked directly on an existing token
    const clickedToken = currentPhase.tokens.find(
      (t) => Math.hypot(t.x - coords.x, t.y - coords.y) <= 32
    );

    // ERASE mode: delete token
    if (activeTool === "ERASE") {
      if (clickedToken) {
        const remaining = currentPhase.tokens.filter((t) => t.id !== clickedToken.id);
        commitPhaseUpdate(remaining, currentPhase.trajectories || []);
        if (selectedTokenId === clickedToken.id) setSelectedTokenId(null);
      }
      return;
    }

    // CRITICAL: Any touch/click on an existing token ALWAYS starts dragging that token!
    if (clickedToken) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      setDraggingTokenId(clickedToken.id);
      setSelectedTokenId(clickedToken.id);
      return;
    }

    // 2. Clicked on EMPTY space:
    setSelectedTokenId(null);

    // Text tool: prompt for label
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
      }
      return;
    }

    // Arrow drawing tools ("PASS" | "RUN" | "DRIBBLE")
    if (activeTool === "PASS" || activeTool === "RUN" || activeTool === "DRIBBLE") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      setDrawingTrajectory({
        startX: coords.x,
        startY: coords.y,
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
      // Fluid 60fps dragging of selected token
      const updatedTokens = currentPhase.tokens.map((t) =>
        t.id === draggingTokenId ? { ...t, x: coords.x, y: coords.y } : t
      );
      const updatedPhases = phases.map((p, idx) =>
        idx === currentPhaseIdx ? { ...p, tokens: updatedTokens } : p
      );
      setPhases(updatedPhases);
    } else if (drawingTrajectory) {
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
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (draggingTokenId) {
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

  // Add Item to current phase
  const handleAddToken = (type: "PLAYER" | "OPPONENT" | "BALL" | "CONE") => {
    const id = `token_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    let label = "P";
    let jerseyNum: number | undefined = undefined;

    if (type === "PLAYER") {
      const count = currentPhase.tokens.filter((t) => t.type === "PLAYER").length;
      jerseyNum = count + 1;
      label = `#${jerseyNum}`;
    } else if (type === "OPPONENT") {
      const count = currentPhase.tokens.filter((t) => t.type === "OPPONENT").length;
      label = `X${count + 1}`;
    } else if (type === "BALL") {
      label = sport === "FOOTBALL" ? "⚽" : sport === "VOLLEYBALL" ? "🏐" : "🏀";
    } else if (type === "CONE") {
      label = "▲";
    }

    const newToken: TacticToken = {
      id,
      type,
      label,
      jerseyNumber: jerseyNum,
      x: 500 + Math.round((Math.random() - 0.5) * 160),
      y: 350 + Math.round((Math.random() - 0.5) * 120),
      dutyZh: type === "PLAYER" ? "协同策应与战术落位" : undefined,
    };

    commitPhaseUpdate([...currentPhase.tokens, newToken], currentPhase.trajectories || []);
    setSelectedTokenId(id);
    setActiveTool("SELECT");
  };

  // Preset Formation Deployer (Instantly deploys a full tactical unit!)
  const handleDeployFormation = (formationKey: string) => {
    if (formationKey === "CLEAR_ALL") {
      commitPhaseUpdate([], []);
      return;
    }

    let newTokens: TacticToken[] = [];

    if (formationKey === "4-3-3") {
      newTokens = [
        { id: "p1", type: "PLAYER", label: "门将", jerseyNumber: 1, position: "GK", x: 80, y: 350 },
        { id: "p2", type: "PLAYER", label: "左后卫", jerseyNumber: 3, position: "LB", x: 260, y: 140 },
        { id: "p3", type: "PLAYER", label: "中后卫", jerseyNumber: 4, position: "CB", x: 230, y: 270 },
        { id: "p4", type: "PLAYER", label: "中后卫", jerseyNumber: 5, position: "CB", x: 230, y: 430 },
        { id: "p5", type: "PLAYER", label: "右后卫", jerseyNumber: 2, position: "RB", x: 260, y: 560 },
        { id: "p6", type: "PLAYER", label: "后腰", jerseyNumber: 6, position: "CDM", x: 380, y: 350 },
        { id: "p7", type: "PLAYER", label: "中前卫", jerseyNumber: 8, position: "CM", x: 500, y: 230 },
        { id: "p8", type: "PLAYER", label: "中前卫", jerseyNumber: 10, position: "CM", x: 500, y: 470 },
        { id: "p9", type: "PLAYER", label: "左边锋", jerseyNumber: 11, position: "LW", x: 740, y: 150 },
        { id: "p10", type: "PLAYER", label: "前锋", jerseyNumber: 9, position: "ST", x: 780, y: 350 },
        { id: "p11", type: "PLAYER", label: "右边锋", jerseyNumber: 7, position: "RW", x: 740, y: 550 },
        { id: "ball", type: "BALL", label: "⚽", x: 530, y: 350 },
        { id: "opp1", type: "OPPONENT", label: "X1", x: 620, y: 350 },
        { id: "opp2", type: "OPPONENT", label: "X2", x: 340, y: 260 },
      ];
    } else if (formationKey === "4-4-2") {
      newTokens = [
        { id: "p1", type: "PLAYER", label: "门将", jerseyNumber: 1, position: "GK", x: 80, y: 350 },
        { id: "p2", type: "PLAYER", label: "左后卫", jerseyNumber: 3, position: "LB", x: 260, y: 140 },
        { id: "p3", type: "PLAYER", label: "中后卫", jerseyNumber: 4, position: "CB", x: 230, y: 270 },
        { id: "p4", type: "PLAYER", label: "中后卫", jerseyNumber: 5, position: "CB", x: 230, y: 430 },
        { id: "p5", type: "PLAYER", label: "右后卫", jerseyNumber: 2, position: "RB", x: 260, y: 560 },
        { id: "p6", type: "PLAYER", label: "左前卫", jerseyNumber: 11, position: "LM", x: 480, y: 140 },
        { id: "p7", type: "PLAYER", label: "中前卫", jerseyNumber: 8, position: "CM", x: 450, y: 280 },
        { id: "p8", type: "PLAYER", label: "中前卫", jerseyNumber: 6, position: "CM", x: 450, y: 420 },
        { id: "p9", type: "PLAYER", label: "右前卫", jerseyNumber: 7, position: "RM", x: 480, y: 560 },
        { id: "p10", type: "PLAYER", label: "前锋", jerseyNumber: 9, position: "ST", x: 750, y: 280 },
        { id: "p11", type: "PLAYER", label: "前锋", jerseyNumber: 10, position: "ST", x: 750, y: 420 },
        { id: "ball", type: "BALL", label: "⚽", x: 480, y: 350 },
      ];
    } else if (formationKey === "3-5-2") {
      newTokens = [
        { id: "p1", type: "PLAYER", label: "门将", jerseyNumber: 1, position: "GK", x: 80, y: 350 },
        { id: "p2", type: "PLAYER", label: "中卫", jerseyNumber: 3, position: "CB", x: 240, y: 200 },
        { id: "p3", type: "PLAYER", label: "中卫", jerseyNumber: 4, position: "CB", x: 220, y: 350 },
        { id: "p4", type: "PLAYER", label: "中卫", jerseyNumber: 5, position: "CB", x: 240, y: 500 },
        { id: "p5", type: "PLAYER", label: "左翼卫", jerseyNumber: 11, position: "LWB", x: 450, y: 120 },
        { id: "p6", type: "PLAYER", label: "后腰", jerseyNumber: 6, position: "CDM", x: 400, y: 350 },
        { id: "p7", type: "PLAYER", label: "中前卫", jerseyNumber: 8, position: "CM", x: 520, y: 260 },
        { id: "p8", type: "PLAYER", label: "前腰", jerseyNumber: 10, position: "CAM", x: 520, y: 440 },
        { id: "p9", type: "PLAYER", label: "右翼卫", jerseyNumber: 2, position: "RWB", x: 450, y: 580 },
        { id: "p10", type: "PLAYER", label: "前锋", jerseyNumber: 9, position: "ST", x: 750, y: 290 },
        { id: "p11", type: "PLAYER", label: "前锋", jerseyNumber: 7, position: "ST", x: 750, y: 410 },
        { id: "ball", type: "BALL", label: "⚽", x: 430, y: 350 },
      ];
    } else if (formationKey === "VOLLEYBALL_5_1") {
      newTokens = [
        { id: "v1", type: "PLAYER", label: "二传", jerseyNumber: 1, position: "SET", x: 620, y: 260 },
        { id: "v2", type: "PLAYER", label: "主攻", jerseyNumber: 4, position: "OH", x: 680, y: 160 },
        { id: "v3", type: "PLAYER", label: "副攻", jerseyNumber: 3, position: "MB", x: 680, y: 350 },
        { id: "v4", type: "PLAYER", label: "接应", jerseyNumber: 2, position: "OPP", x: 680, y: 540 },
        { id: "v5", type: "PLAYER", label: "自由人", jerseyNumber: 5, position: "LIB", x: 280, y: 200 },
        { id: "v6", type: "PLAYER", label: "后排", jerseyNumber: 6, position: "OH", x: 280, y: 500 },
        { id: "ball", type: "BALL", label: "🏐", x: 630, y: 280 },
      ];
    } else if (formationKey === "BASKETBALL_1_2_2") {
      newTokens = [
        { id: "b1", type: "PLAYER", label: "控卫", jerseyNumber: 1, position: "PG", x: 300, y: 350 },
        { id: "b2", type: "PLAYER", label: "分卫", jerseyNumber: 2, position: "SG", x: 460, y: 180 },
        { id: "b3", type: "PLAYER", label: "小前", jerseyNumber: 3, position: "SF", x: 460, y: 520 },
        { id: "b4", type: "PLAYER", label: "大前", jerseyNumber: 4, position: "PF", x: 700, y: 240 },
        { id: "b5", type: "PLAYER", label: "中锋", jerseyNumber: 5, position: "C", x: 760, y: 350 },
        { id: "ball", type: "BALL", label: "🏀", x: 330, y: 350 },
        { id: "opp1", type: "OPPONENT", label: "X1", x: 360, y: 350 },
        { id: "opp2", type: "OPPONENT", label: "X2", x: 720, y: 350 },
      ];
    }

    commitPhaseUpdate(newTokens, []);
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
    <div className="bg-[#10141D] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-3.5 select-none w-full">
      {/* ================= 1. TOP HEADER & PHASES BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
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
                  ? "bg-emerald-600 text-white font-black shadow-md scale-105"
                  : "bg-[#181E29] text-stone-300 hover:bg-[#202736] border border-white/[0.06]"
              }`}
            >
              <span>{phase.titleZh || `阶段 ${idx + 1}`}</span>
            </button>
          ))}

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
              if (onUpdateTactic) {
                onUpdateTactic({
                  ...tactic,
                  phases: nextPhases,
                });
              }
              setCurrentPhaseIdx(phases.length);
            }}
            className="p-1.5 rounded-lg bg-[#181E29] hover:bg-[#202736] border border-white/[0.06] text-stone-300 hover:text-emerald-400 transition-colors"
            title="添加阶段"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Playback & Utility Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              setAnimProgress(0);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              isPlaying
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-[#181E29] hover:bg-[#202736] text-stone-200 border border-white/[0.06]"
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
            className="p-1.5 rounded-lg bg-[#181E29] hover:bg-[#202736] border border-white/[0.06] text-stone-300 hover:text-white transition-colors"
            title="一键复位本阶段"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onOpenBigScreen && (
            <button
              onClick={onOpenBigScreen}
              className="px-2.5 py-1.5 rounded-lg bg-[#181E29] hover:bg-[#202736] border border-white/[0.06] text-emerald-400 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              title="大屏演播模式"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">大屏演播</span>
            </button>
          )}

          {onPrintA4 && (
            <button
              onClick={onPrintA4}
              className="p-1.5 rounded-lg bg-[#181E29] hover:bg-[#202736] border border-white/[0.06] text-stone-300 hover:text-white transition-colors"
              title="打印战术手册 A4"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. COMPLETE TACTICAL TOOLBOX (ALWAYS ACTIVE FOR SMOOTH OPERATION) ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#141923] border border-white/[0.08]">
        {/* Drawing & Mode Tools */}
        <div className="flex items-center space-x-1 flex-wrap gap-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1.5">
            模式:
          </span>

          <button
            onClick={() => setActiveTool("SELECT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "SELECT"
                ? "bg-emerald-600 text-white font-black shadow-sm"
                : "bg-[#1C2331] text-stone-300 hover:bg-[#252E40] hover:text-white"
            }`}
            title="点击场上任意人员或球直接拖拽挪动"
          >
            <Move className="w-3.5 h-3.5" />
            <span>✋ 自由挪人</span>
          </button>

          <button
            onClick={() => setActiveTool("PASS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "PASS"
                ? "bg-amber-500 text-stone-950 font-black shadow-sm"
                : "bg-[#1C2331] text-amber-300 hover:bg-[#252E40]"
            }`}
            title="在场上拖拽拉出传球黄色箭头"
          >
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            <span>➡️ 传球路线</span>
          </button>

          <button
            onClick={() => setActiveTool("RUN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "RUN"
                ? "bg-sky-500 text-stone-950 font-black shadow-sm"
                : "bg-[#1C2331] text-sky-300 hover:bg-[#252E40]"
            }`}
            title="在场上拖拽拉出无球跑位蓝色虚线箭头"
          >
            <Footprints className="w-3.5 h-3.5 text-sky-400" />
            <span>🏃 跑位路线</span>
          </button>

          <button
            onClick={() => setActiveTool("DRIBBLE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "DRIBBLE"
                ? "bg-orange-500 text-stone-950 font-black shadow-sm"
                : "bg-[#1C2331] text-orange-300 hover:bg-[#252E40]"
            }`}
            title="在场上拖拽拉出运球突破橙色波浪虚线"
          >
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>⚡ 运球突破</span>
          </button>

          <button
            onClick={() => setActiveTool("TEXT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "TEXT"
                ? "bg-purple-600 text-white font-black shadow-sm"
                : "bg-[#1C2331] text-purple-300 hover:bg-[#252E40]"
            }`}
            title="点击球场任意位置即可输入文字指示"
          >
            <Type className="w-3.5 h-3.5 text-purple-400" />
            <span>🔤 战术文字</span>
          </button>

          <button
            onClick={() => setActiveTool("ERASE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "ERASE"
                ? "bg-rose-700 text-white font-black shadow-sm"
                : "bg-[#1C2331] text-rose-300 hover:bg-[#252E40]"
            }`}
            title="点击任意球员、箭头或文字立即清除"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
            <span>🧹 橡皮擦</span>
          </button>
        </div>

        {/* Quick Stamp Tokens & Presets */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          <button
            onClick={() => handleAddToken("PLAYER")}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold flex items-center space-x-1 transition-colors"
            title="添加我方进攻队员"
          >
            <span>+ 👕 我方队员</span>
          </button>

          <button
            onClick={() => handleAddToken("OPPONENT")}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-300 text-xs font-bold flex items-center space-x-1 transition-colors"
            title="添加对方防守人"
          >
            <span>+ 🛡️ 防守人</span>
          </button>

          <button
            onClick={() => handleAddToken("BALL")}
            className="px-2 py-1.5 rounded-lg bg-[#1C2331] hover:bg-[#252E40] text-stone-200 text-xs font-semibold flex items-center space-x-1"
            title="添加比赛球"
          >
            <span>+ ⚽ 球</span>
          </button>

          <button
            onClick={() => handleAddToken("CONE")}
            className="px-2 py-1.5 rounded-lg bg-[#1C2331] hover:bg-[#252E40] text-amber-300 text-xs font-semibold flex items-center space-x-1"
            title="添加标志锥"
          >
            <span>+ 🚩 锥</span>
          </button>

          {/* Quick Formation Presets Dropdown */}
          <div className="relative inline-block">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleDeployFormation(e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="px-2.5 py-1.5 rounded-lg bg-[#1C2331] hover:bg-[#252E40] border border-white/[0.08] text-emerald-400 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="" disabled>
                📐 一键阵型部署...
              </option>
              {sport === "FOOTBALL" && (
                <>
                  <option value="4-3-3">⚽ 4-3-3 阵型 (11人部署)</option>
                  <option value="4-4-2">⚽ 4-4-2 平行阵型 (11人)</option>
                  <option value="3-5-2">⚽ 3-5-2 攻守兼备 (11人)</option>
                </>
              )}
              {sport === "VOLLEYBALL" && (
                <option value="VOLLEYBALL_5_1">🏐 5-1 室内排球轮转 (6人)</option>
              )}
              {sport === "BASKETBALL" && (
                <option value="BASKETBALL_1_2_2">🏀 1-2-2 篮球半场攻防 (5人)</option>
              )}
              <option value="CLEAR_ALL">🗑️ 清空全场人员</option>
            </select>
          </div>

          <button
            onClick={handleClearTrajectories}
            className="px-2 py-1.5 rounded-lg bg-[#1C2331]/80 hover:bg-[#252E40] text-stone-400 hover:text-stone-200 text-xs"
            title="清空当前阶段所有路线箭头"
          >
            清空箭头
          </button>
        </div>
      </div>

      {/* Phase Description Banner */}
      <div className="px-3.5 py-2 rounded-xl bg-[#141923] border border-white/[0.08] flex items-center justify-between text-xs text-stone-300">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-emerald-400">
            {currentPhase.titleZh || `阶段 ${currentPhaseIdx + 1}`}:
          </span>
          <span className="text-stone-300">
            {currentPhase.notesZh || currentPhase.notesEn || "点击并拖拽场上任意队员可实时排布站位"}
          </span>
        </div>
        <div className="text-[11px] text-stone-400 font-mono">
          {currentPhaseIdx + 1} / {phases.length} 阶段
        </div>
      </div>

      {/* ================= 3. BROADCAST-QUALITY INTERACTIVE PITCH (SVG 1000 x 700) ================= */}
      <div
        className="relative w-full aspect-[1000/700] rounded-xl overflow-hidden border border-white/[0.12] shadow-2xl select-none"
        style={{ touchAction: "none" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1000 700"
          className="w-full h-full cursor-grab active:cursor-grabbing"
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
              id="arrow-pass-v6"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
            </marker>
            <marker
              id="arrow-run-v6"
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
              id="arrow-dribble-v6"
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

          {/* ================= PITCH TEXTURES: CLEAN BROADCAST STADIUM ================= */}

          {sport === "FOOTBALL" && (
            <g id="footballPitchV6">
              {/* Stadium Emerald Grass Base */}
              <rect width="1000" height="700" fill="#113A27" />

              {/* Clean Mower Lawn Stripes */}
              {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((x, i) => (
                <rect
                  key={x}
                  x={x}
                  y="0"
                  width="100"
                  height="700"
                  fill={i % 2 === 0 ? "#14442E" : "#113A27"}
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
                strokeWidth="2.8"
                strokeOpacity="0.88"
              />

              {/* Half-way Line & Center Circle */}
              <line
                x1="500"
                y1="35"
                x2="500"
                y2="665"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeOpacity="0.88"
              />
              <circle
                cx="500"
                cy="350"
                r="80"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeOpacity="0.88"
              />
              <circle cx="500" cy="350" r="4.5" fill="#FFFFFF" fillOpacity="0.95" />

              {/* Left Penalty Area */}
              <rect
                x="40"
                y="175"
                width="155"
                height="350"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeOpacity="0.88"
              />
              <rect
                x="40"
                y="265"
                width="55"
                height="170"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeOpacity="0.88"
              />
              <circle cx="145" cy="350" r="4" fill="#FFFFFF" fillOpacity="0.95" />
              <path
                d="M 195 295 A 85 85 0 0 1 195 405"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeOpacity="0.88"
              />

              {/* Right Penalty Area */}
              <rect
                x="805"
                y="175"
                width="155"
                height="350"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeOpacity="0.88"
              />
              <rect
                x="905"
                y="265"
                width="55"
                height="170"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeOpacity="0.88"
              />
              <circle cx="855" cy="350" r="4" fill="#FFFFFF" fillOpacity="0.95" />
              <path
                d="M 805 295 A 85 85 0 0 0 805 405"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeOpacity="0.88"
              />

              {/* Corner Arcs */}
              <path d="M 40 55 A 20 20 0 0 0 60 35" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
              <path d="M 40 645 A 20 20 0 0 1 60 665" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
              <path d="M 960 55 A 20 20 0 0 1 940 35" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
              <path d="M 960 645 A 20 20 0 0 0 940 665" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
          )}

          {sport === "VOLLEYBALL" && (
            <g id="volleyballPitchV6">
              <rect width="1000" height="700" fill="#141D29" />
              <rect x="100" y="80" width="800" height="540" fill="#8C3F1B" stroke="#FFFFFF" strokeWidth="3" />
              <line x1="500" y1="80" x2="500" y2="620" stroke="#FFFFFF" strokeWidth="4.5" strokeDasharray="5 3" />
              <line x1="366" y1="80" x2="366" y2="620" stroke="#FFFFFF" strokeWidth="2.8" strokeDasharray="6 4" />
              <line x1="634" y1="80" x2="634" y2="620" stroke="#FFFFFF" strokeWidth="2.8" strokeDasharray="6 4" />
            </g>
          )}

          {sport === "BASKETBALL" && (
            <g id="basketballPitchV6">
              <rect width="1000" height="700" fill="#181310" />
              <rect x="40" y="40" width="920" height="620" fill="#7C2D12" stroke="#F59E0B" strokeWidth="3" />
              <line x1="500" y1="40" x2="500" y2="660" stroke="#F59E0B" strokeWidth="3" />
              <circle cx="500" cy="350" r="80" fill="none" stroke="#F59E0B" strokeWidth="3" />
              <rect x="40" y="240" width="180" height="220" fill="#9A3412" stroke="#F59E0B" strokeWidth="2.5" />
              <rect x="780" y="240" width="180" height="220" fill="#9A3412" stroke="#F59E0B" strokeWidth="2.5" />
            </g>
          )}

          {/* ================= 4. TACTICAL TRAJECTORIES (ARROWS) ================= */}
          {currentPhase.trajectories?.map((traj) => {
            const isCurve = traj.controlX && traj.controlY;
            const pathData = isCurve
              ? `M ${traj.startX} ${traj.startY} Q ${traj.controlX} ${traj.controlY} ${traj.endX} ${traj.endY}`
              : `M ${traj.startX} ${traj.startY} L ${traj.endX} ${traj.endY}`;

            let strokeColor = "#38BDF8";
            let markerEnd = "url(#arrow-run-v6)";
            let strokeDash = "7 5";

            if (traj.type === "PASS") {
              strokeColor = "#F59E0B";
              markerEnd = "url(#arrow-pass-v6)";
              strokeDash = "none";
            } else if (traj.type === "DRIBBLE") {
              strokeColor = "#FB923C";
              markerEnd = "url(#arrow-dribble-v6)";
              strokeDash = "4 3";
            }

            return (
              <g
                key={traj.id}
                onClick={(e) => handleEraseTrajectory(traj.id, e)}
                className={activeTool === "ERASE" ? "cursor-pointer group" : "pointer-events-none"}
              >
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                  className="pointer-events-auto"
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3.8"
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  markerEnd={markerEnd}
                  opacity="0.95"
                  className="transition-opacity group-hover:opacity-40"
                />
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
                    ? "#F59E0B"
                    : drawingTrajectory.type === "RUN"
                    ? "#38BDF8"
                    : "#FB923C"
                }
                strokeWidth="3.8"
                strokeDasharray={drawingTrajectory.type === "PASS" ? "none" : "6 4"}
                markerEnd={
                  drawingTrajectory.type === "PASS"
                    ? "url(#arrow-pass-v6)"
                    : drawingTrajectory.type === "RUN"
                    ? "url(#arrow-run-v6)"
                    : "url(#arrow-dribble-v6)"
                }
              />
              <circle
                cx={drawingTrajectory.startX}
                cy={drawingTrajectory.startY}
                r="4.5"
                fill="#FFFFFF"
              />
            </g>
          )}

          {/* ================= 5. TACTICAL TOKENS (PLAYERS, OPPONENTS, BALL, CONES, TEXT) ================= */}
          {displayedTokens.map((token) => {
            const isSelected = token.id === selectedTokenId;
            const isDragging = token.id === draggingTokenId;

            // 1. Text Annotation Token
            if (token.type === "TEXT" || token.id.startsWith("text_")) {
              const textWidth = Math.max(72, (token.label || "").length * 13 + 24);
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  className="cursor-grab active:cursor-grabbing"
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
                    y="-15"
                    width={textWidth}
                    height="30"
                    rx="8"
                    fill="#18202C"
                    stroke={isSelected ? "#38BDF8" : "#F59E0B"}
                    strokeWidth="1.8"
                    strokeDasharray={isSelected ? "none" : "3 2"}
                    fillOpacity="0.96"
                    className="filter drop-shadow-lg"
                  />
                  <text
                    x="0"
                    y="5"
                    fill="#FFFFFF"
                    fontSize="12"
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

            // 2. Ball Token
            if (token.type === "BALL") {
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <circle cx="0" cy="0" r="16" fill="#000000" fillOpacity="0.5" />
                  <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#000000" strokeWidth="1.8" />
                  {sport === "FOOTBALL" && (
                    <polygon
                      points="0,-6 5,-2 3,5 -3,5 -5,-2"
                      fill="#000000"
                      fillOpacity="0.85"
                    />
                  )}
                  {sport === "BASKETBALL" && (
                    <circle cx="0" cy="0" r="14" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
                  )}
                </g>
              );
            }

            // 3. Training Cone Token
            if (token.type === "CONE") {
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <polygon
                    points="0,-18 -13,12 13,12"
                    fill="#F97316"
                    stroke="#C2410C"
                    strokeWidth="1.8"
                  />
                  <line x1="-7" y1="2" x2="7" y2="2" stroke="#FFFFFF" strokeWidth="2.5" />
                </g>
              );
            }

            // 4. Opponent Token (Crimson Red with white X or label)
            if (token.type === "OPPONENT") {
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <circle cx="0" cy="0" r="20" fill="#000000" fillOpacity="0.4" />
                  <circle cx="0" cy="0" r="18" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2.5" />
                  <text
                    x="0"
                    y="5.5"
                    fill="#FFFFFF"
                    fontSize="12"
                    fontWeight="900"
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {token.label || "X"}
                  </text>
                </g>
              );
            }

            // 5. Home Team Player Token (High-contrast Broadcast Emblem)
            const isMe = myToken && token.id === myToken.id;

            return (
              <g
                key={token.id}
                transform={`translate(${token.x}, ${token.y})`}
                className={`cursor-grab active:cursor-grabbing transition-transform duration-100 ${
                  isSelected ? "scale-110" : ""
                }`}
              >
                {/* Shadow */}
                <circle cx="0" cy="2" r="21" fill="#000000" fillOpacity="0.45" />

                {/* Main Player Badge */}
                <circle
                  cx="0"
                  cy="0"
                  r="19"
                  fill="#0369A1"
                  stroke={isSelected ? "#F59E0B" : "#FFFFFF"}
                  strokeWidth={isSelected ? "3.5" : "2.5"}
                />

                {/* Jersey Number */}
                <text
                  x="0"
                  y="5.5"
                  fill="#FFFFFF"
                  fontSize="12.5"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                  className="pointer-events-none select-none"
                >
                  {token.jerseyNumber || token.position || "P"}
                </text>

                {/* Name Pill Underneath */}
                <g transform="translate(0, 27)" className="pointer-events-none select-none">
                  <rect
                    x="-34"
                    y="-9"
                    width="68"
                    height="18"
                    rx="4"
                    fill="#0F172A"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="3.5"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {token.label}
                  </text>
                </g>

                {/* Spotlight indicator for logged-in user */}
                {isMe && (
                  <circle
                    cx="0"
                    cy="0"
                    r="28"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="animate-spin"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ================= 6. SELECTED TOKEN DUTIES & ATTRIBUTES CARD ================= */}
      {selectedToken && (
        <div className="p-3.5 rounded-xl bg-[#141923] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center font-serif font-black text-emerald-300 text-base shrink-0">
              {selectedToken.jerseyNumber || selectedToken.position || "•"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-white text-sm">{selectedToken.label}</h4>
                {selectedToken.position && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C2331] text-emerald-400 font-mono font-bold">
                    {selectedToken.position}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                <strong className="text-emerald-400">跑位职责：</strong>{" "}
                {selectedToken.dutyZh || selectedToken.dutyEn || "保持战术位置，随时前插策应。"}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 font-mono shrink-0">
            球场坐标: ({selectedToken.x}, {selectedToken.y})
          </div>
        </div>
      )}
    </div>
  );
}
