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
  Move,
  ArrowRight,
  CornerUpRight,
  Footprints,
  Zap,
  Eraser,
  Type,
  X,
  Check,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export type BoardTool =
  | "SELECT"
  | "PASS"
  | "PASS_CURVE"
  | "RUN"
  | "RUN_CURVE"
  | "DRIBBLE"
  | "TEXT"
  | "ERASE";

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
  const phasesRef = useRef<TacticPhaseData[]>(phases);

  // Ghost motion trail toggle (displays Phase N-1 position ghost and movement vector to Phase N)
  const [showGhostTrails, setShowGhostTrails] = useState<boolean>(true);
  const [athletePovId, setAthletePovId] = useState<string | null>(null);

  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);

  useEffect(() => {
    if (tactic.phases) {
      setPhases(tactic.phases);
      phasesRef.current = tactic.phases;
    }
  }, [tactic]);

  // Tactical Text Annotation State
  const [showTextModal, setShowTextModal] = useState(false);
  const [textPlacementCoords, setTextPlacementCoords] = useState<{ x: number; y: number } | null>(null);
  const [customText, setCustomText] = useState("");
  const [textColor, setTextColor] = useState("#F59E0B");

  // Curve control point dragging
  const [draggingCurveId, setDraggingCurveId] = useState<string | null>(null);

  // Dragging token tracking
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);

  // Drawing trajectory tracking
  const [drawingTrajectory, setDrawingTrajectory] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    type: BoardTool;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

  // Compute ghost movement pairs from previous phase (Phase N-1 to Phase N transition)
  const prevPhase = currentPhaseIdx > 0 ? phases[currentPhaseIdx - 1] : null;
  const ghostMovementPairs = React.useMemo(() => {
    if (!prevPhase || !showGhostTrails) return [];
    const pairs: {
      tokenId: string;
      label: string;
      jerseyNumber?: number;
      prevX: number;
      prevY: number;
      currX: number;
      currY: number;
      distance: number;
      type: string;
    }[] = [];

    currentPhase.tokens.forEach((currToken) => {
      if (currToken.type === "TEXT" || currToken.type === "CONE") return;
      const prevToken = prevPhase.tokens.find(
        (p) =>
          p.id === currToken.id ||
          (currToken.jerseyNumber && p.jerseyNumber === currToken.jerseyNumber && p.type === currToken.type)
      );
      if (prevToken) {
        const dist = Math.hypot(currToken.x - prevToken.x, currToken.y - prevToken.y);
        if (dist >= 12) {
          pairs.push({
            tokenId: currToken.id,
            label: currToken.label,
            jerseyNumber: currToken.jerseyNumber,
            prevX: prevToken.x,
            prevY: prevToken.y,
            currX: currToken.x,
            currY: currToken.y,
            distance: Math.round(dist / 10), // approximate meters on field
            type: currToken.type,
          });
        }
      }
    });

    return pairs;
  }, [currentPhase, prevPhase, showGhostTrails]);

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

  // SVG Normalized Coordinate Transformer (1000 x 700 viewBox)
  const getSvgCoordinates = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 500, y: 350 };

    const rect = svg.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { x: 500, y: 350 };
    }

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const x = (relX / rect.width) * 1000;
    const y = (relY / rect.height) * 700;

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { x: 500, y: 350 };
    }

    return {
      x: Math.round(Math.max(25, Math.min(975, x))),
      y: Math.round(Math.max(25, Math.min(675, y))),
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
    phasesRef.current = updatedPhases;
    if (onUpdateTactic) {
      onUpdateTactic({
        ...tactic,
        phases: updatedPhases,
      });
    }
  };

  // Helper for natural arc perpendicular offset
  const calculateCurvedControlPoint = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    arcRatio = 0.28
  ) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.hypot(dx, dy) || 1;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    // Perpendicular normal vector (counter-clockwise)
    const nx = -dy / len;
    const ny = dx / len;
    const offset = Math.max(26, Math.min(85, len * arcRatio));
    return {
      controlX: Math.round(midX + nx * offset),
      controlY: Math.round(midY + ny * offset),
    };
  };

  // ================= POINTER / TOUCH GESTURE HANDLERS =================

  // 1. Direct grab on a tactical token with window listeners (zero snapping to 0,0, zero dropped drag)
  const handleTokenPointerDown = (token: TacticToken, e: React.PointerEvent) => {
    if (isPlaying) return;
    e.stopPropagation();

    // In ERASE mode: immediately remove clicked token
    if (activeTool === "ERASE") {
      const remaining = currentPhase.tokens.filter((t) => t.id !== token.id);
      commitPhaseUpdate(remaining, currentPhase.trajectories || []);
      if (selectedTokenId === token.id) setSelectedTokenId(null);
      return;
    }

    const startCoords = getSvgCoordinates(e.clientX, e.clientY);
    const offsetX = startCoords.x - token.x;
    const offsetY = startCoords.y - token.y;

    setSelectedTokenId(token.id);
    setDraggingTokenId(token.id);

    let hasMoved = false;

    const onWindowPointerMove = (moveEvt: PointerEvent) => {
      const coords = getSvgCoordinates(moveEvt.clientX, moveEvt.clientY);
      const targetX = Math.round(Math.max(25, Math.min(975, coords.x - offsetX)));
      const targetY = Math.round(Math.max(25, Math.min(675, coords.y - offsetY)));

      if (!hasMoved && Math.hypot(targetX - token.x, targetY - token.y) < 2) {
        return;
      }
      hasMoved = true;

      setPhases((prevPhases) => {
        const next = prevPhases.map((p, idx) =>
          idx === currentPhaseIdx
            ? {
                ...p,
                tokens: p.tokens.map((t) => (t.id === token.id ? { ...t, x: targetX, y: targetY } : t)),
              }
            : p
        );
        phasesRef.current = next;
        return next;
      });
    };

    const onWindowPointerUp = () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      setDraggingTokenId(null);

      if (hasMoved && onUpdateTactic) {
        onUpdateTactic({
          ...tactic,
          phases: phasesRef.current,
        });
      }
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
  };

  // 2. Drag trajectory curve control handle (allows bending any arrow interactively)
  const handleCurveControlPointerDown = (traj: TacticTrajectory, e: React.PointerEvent) => {
    if (isPlaying) return;
    e.stopPropagation();

    if (activeTool === "ERASE") {
      handleEraseTrajectory(traj.id);
      return;
    }

    setDraggingCurveId(traj.id);
    let hasMoved = false;

    const onWindowPointerMove = (moveEvt: PointerEvent) => {
      const coords = getSvgCoordinates(moveEvt.clientX, moveEvt.clientY);
      hasMoved = true;

      setPhases((prevPhases) => {
        const next = prevPhases.map((p, idx) =>
          idx === currentPhaseIdx
            ? {
                ...p,
                trajectories: (p.trajectories || []).map((tr) =>
                  tr.id === traj.id ? { ...tr, controlX: coords.x, controlY: coords.y } : tr
                ),
              }
            : p
        );
        phasesRef.current = next;
        return next;
      });
    };

    const onWindowPointerUp = () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      setDraggingCurveId(null);

      if (hasMoved && onUpdateTactic) {
        onUpdateTactic({
          ...tactic,
          phases: phasesRef.current,
        });
      }
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
  };

  // 3. Pitch canvas click and drawing handler
  const handlePitchPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPlaying) return;
    const coords = getSvgCoordinates(e.clientX, e.clientY);

    // Text tool: open tactical text modal positioned at clicked coordinates
    if (activeTool === "TEXT") {
      setTextPlacementCoords(coords);
      setShowTextModal(true);
      return;
    }

    // Trajectory arrow drawing tools
    if (
      activeTool === "PASS" ||
      activeTool === "PASS_CURVE" ||
      activeTool === "RUN" ||
      activeTool === "RUN_CURVE" ||
      activeTool === "DRIBBLE"
    ) {
      const isCurved = activeTool === "PASS_CURVE" || activeTool === "RUN_CURVE";
      const startX = coords.x;
      const startY = coords.y;

      let currentX = coords.x;
      let currentY = coords.y;

      setDrawingTrajectory({
        startX,
        startY,
        currentX,
        currentY,
        type: activeTool,
      });

      const onWindowPointerMove = (moveEvt: PointerEvent) => {
        const moveCoords = getSvgCoordinates(moveEvt.clientX, moveEvt.clientY);
        currentX = moveCoords.x;
        currentY = moveCoords.y;
        setDrawingTrajectory({
          startX,
          startY,
          currentX,
          currentY,
          type: activeTool,
        });
      };

      const onWindowPointerUp = () => {
        window.removeEventListener("pointermove", onWindowPointerMove);
        window.removeEventListener("pointerup", onWindowPointerUp);
        setDrawingTrajectory(null);

        const dist = Math.hypot(currentX - startX, currentY - startY);
        if (dist >= 16) {
          let controlX = Math.round((startX + currentX) / 2);
          let controlY = Math.round((startY + currentY) / 2);

          if (isCurved) {
            const curve = calculateCurvedControlPoint(startX, startY, currentX, currentY, 0.28);
            controlX = curve.controlX;
            controlY = curve.controlY;
          }

          const baseType: TrajectoryType =
            activeTool.startsWith("PASS") ? "PASS" : activeTool.startsWith("RUN") ? "RUN" : "DRIBBLE";

          const newTraj: TacticTrajectory = {
            id: `traj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: baseType,
            startX,
            startY,
            controlX,
            controlY,
            endX: currentX,
            endY: currentY,
          };

          const updatedTrajectories = [...(currentPhase.trajectories || []), newTraj];
          commitPhaseUpdate(currentPhase.tokens, updatedTrajectories);
        }
      };

      window.addEventListener("pointermove", onWindowPointerMove);
      window.addEventListener("pointerup", onWindowPointerUp);
      return;
    }

    // Default SELECT: deselect
    setSelectedTokenId(null);
  };

  // Erase Trajectory
  const handleEraseTrajectory = (trajId: string) => {
    const remaining = (currentPhase.trajectories || []).filter((t) => t.id !== trajId);
    commitPhaseUpdate(currentPhase.tokens, remaining);
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
      label = `防守 ${count + 1}`;
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
      dutyZh: type === "PLAYER" ? "协同策应与战术落位" : type === "OPPONENT" ? "贴身防守盯防" : undefined,
    };

    commitPhaseUpdate([...currentPhase.tokens, newToken], currentPhase.trajectories || []);
    setSelectedTokenId(id);
    setActiveTool("SELECT");
  };

  // Add text token helper
  const handleAddTextToken = (text: string, color: string) => {
    const placement = textPlacementCoords || { x: 500, y: 350 };
    const textToken: TacticToken = {
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: "TEXT",
      label: text,
      x: placement.x,
      y: placement.y,
      dutyZh: text,
      dutyEn: text,
    };
    commitPhaseUpdate([...currentPhase.tokens, textToken], currentPhase.trajectories || []);
    setSelectedTokenId(textToken.id);
    setActiveTool("SELECT");
    setTextPlacementCoords(null);
  };

  // Preset Formation Deployer (Instantly deploys a full tactical unit, 100% free of X1/X2 notation!)
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
        { id: "opp1", type: "OPPONENT", label: "防守 1", x: 620, y: 350 },
        { id: "opp2", type: "OPPONENT", label: "防守 2", x: 340, y: 260 },
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
        { id: "opp1", type: "OPPONENT", label: "防守 1", x: 620, y: 320 },
        { id: "opp2", type: "OPPONENT", label: "防守 2", x: 620, y: 380 },
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
        { id: "opp1", type: "OPPONENT", label: "防守 1", x: 620, y: 350 },
      ];
    } else if (formationKey === "VOLLEYBALL_5_1") {
      newTokens = [
        { id: "v1", type: "PLAYER", label: "二传", jerseyNumber: 1, position: "SET", x: 440, y: 500 },
        { id: "v2", type: "PLAYER", label: "主攻", jerseyNumber: 4, position: "OH", x: 420, y: 180 },
        { id: "v3", type: "PLAYER", label: "副攻", jerseyNumber: 3, position: "MB", x: 420, y: 350 },
        { id: "v4", type: "PLAYER", label: "接应", jerseyNumber: 2, position: "OPP", x: 220, y: 500 },
        { id: "v5", type: "PLAYER", label: "自由人", jerseyNumber: 5, position: "LIB", x: 220, y: 180 },
        { id: "v6", type: "PLAYER", label: "后排主攻", jerseyNumber: 6, position: "OH", x: 220, y: 350 },
        { id: "ball", type: "BALL", label: "🏐", x: 440, y: 460 },
        { id: "opp1", type: "OPPONENT", label: "防守 1", x: 560, y: 260 },
        { id: "opp2", type: "OPPONENT", label: "防守 2", x: 560, y: 440 },
      ];
    } else if (formationKey === "BASKETBALL_1_2_2") {
      newTokens = [
        { id: "b1", type: "PLAYER", label: "控卫", jerseyNumber: 1, position: "PG", x: 540, y: 350 },
        { id: "b2", type: "PLAYER", label: "分卫", jerseyNumber: 2, position: "SG", x: 660, y: 180 },
        { id: "b3", type: "PLAYER", label: "小前", jerseyNumber: 3, position: "SF", x: 660, y: 520 },
        { id: "b4", type: "PLAYER", label: "大前", jerseyNumber: 4, position: "PF", x: 780, y: 230 },
        { id: "b5", type: "PLAYER", label: "中锋", jerseyNumber: 5, position: "C", x: 820, y: 350 },
        { id: "ball", type: "BALL", label: "🏀", x: 560, y: 350 },
        { id: "opp1", type: "OPPONENT", label: "防守 1", x: 600, y: 350 },
        { id: "opp2", type: "OPPONENT", label: "防守 2", x: 700, y: 200 },
        { id: "opp3", type: "OPPONENT", label: "防守 3", x: 700, y: 500 },
        { id: "opp4", type: "OPPONENT", label: "防守 4", x: 800, y: 270 },
        { id: "opp5", type: "OPPONENT", label: "防守 5", x: 840, y: 370 },
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
      phasesRef.current = updatedPhases;
      if (onUpdateTactic) {
        onUpdateTactic({
          ...tactic,
          phases: updatedPhases,
        });
      }
    }
  };

  const selectedToken = currentPhase.tokens.find((t) => t.id === selectedTokenId);

  // Sport-specific vocabulary presets for tactical text tool
  const tacticalVocabulary =
    sport === "FOOTBALL"
      ? [
          "高位逼抢",
          "边路套边",
          "倒三角传中",
          "肋部直塞",
          "防守反击",
          "区域联防",
          "内切射门",
          "弱侧转移",
          "撞墙配合",
          "造越位",
        ]
      : sport === "VOLLEYBALL"
      ? [
          "梯次进攻",
          "快球掩护",
          "后排强攻",
          "双人拦网",
          "交叉跑动",
          "垫球组织",
          "发球破坏",
          "反击防守",
        ]
      : [
          "高位挡拆",
          "挡拆顺下",
          "突分底角",
          "空切上篮",
          "2-3联防",
          "转换快攻",
          "上线包夹",
          "低位策应",
        ];

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
              phasesRef.current = nextPhases;
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

      {/* ================= 2. COMPLETE TACTICAL TOOLBOX (STRICTLY BILINGUAL) ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#141923] border border-white/[0.08]">
        {/* Drawing & Mode Tools */}
        <div className="flex items-center space-x-1 flex-wrap gap-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1.5">
            {isZh ? "战术绘制:" : "Tools:"}
          </span>

          <button
            onClick={() => setActiveTool("SELECT")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "SELECT"
                ? "bg-emerald-600 text-white font-black shadow-sm"
                : "bg-[#1C2331] text-stone-300 hover:bg-[#252E40] hover:text-white"
            }`}
            title={isZh ? "点击场上任意人员或球直接拖拽挪动 (Move Token)" : "Click and drag any player or ball"}
          >
            <Move className="w-3.5 h-3.5" />
            <span>✋ 挪人 Move</span>
          </button>

          <button
            onClick={() => setActiveTool("PASS")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "PASS"
                ? "bg-amber-500 text-stone-950 font-black shadow-sm"
                : "bg-[#1C2331] text-amber-300 hover:bg-[#252E40]"
            }`}
            title={isZh ? "拖拽拉出直线传球黄色箭头 (Straight Pass)" : "Draw straight pass vector"}
          >
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            <span>➡️ 直传 Pass</span>
          </button>

          <button
            onClick={() => setActiveTool("PASS_CURVE")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "PASS_CURVE"
                ? "bg-amber-400 text-stone-950 font-black shadow-sm"
                : "bg-[#1C2331] text-amber-200 hover:bg-[#252E40]"
            }`}
            title={isZh ? "拖拽拉出大弧线传球（长传、过顶、倒三角弧线）" : "Draw curved lob or cutback pass"}
          >
            <CornerUpRight className="w-3.5 h-3.5 text-amber-300" />
            <span>⤴️ 弧传 Lob</span>
          </button>

          <button
            onClick={() => setActiveTool("RUN")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "RUN"
                ? "bg-sky-500 text-stone-950 font-black shadow-sm"
                : "bg-[#1C2331] text-sky-300 hover:bg-[#252E40]"
            }`}
            title={isZh ? "拖拽拉出无球跑位直线虚线箭头 (Straight Run)" : "Draw straight off-ball run"}
          >
            <Footprints className="w-3.5 h-3.5 text-sky-400" />
            <span>🏃 直跑 Run</span>
          </button>

          <button
            onClick={() => setActiveTool("RUN_CURVE")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "RUN_CURVE"
                ? "bg-sky-400 text-stone-950 font-black shadow-sm"
                : "bg-[#1C2331] text-sky-200 hover:bg-[#252E40]"
            }`}
            title={isZh ? "拖拽拉出弧线绕桩/边路套边跑位箭头 (Curved Overlap Run)" : "Draw curved overlap sprint"}
          >
            <CornerUpRight className="w-3.5 h-3.5 text-sky-300" />
            <span>⤴️ 套边 Overlap</span>
          </button>

          <button
            onClick={() => setActiveTool("DRIBBLE")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "DRIBBLE"
                ? "bg-orange-500 text-stone-950 font-black shadow-sm"
                : "bg-[#1C2331] text-orange-300 hover:bg-[#252E40]"
            }`}
            title={isZh ? "拖拽拉出运球突破橙色虚线 (Dribble Drive)" : "Draw dribble penetration"}
          >
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>⚡ 突破 Dribble</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("TEXT");
              setShowTextModal(true);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "TEXT"
                ? "bg-purple-600 text-white font-black shadow-sm"
                : "bg-[#1C2331] text-purple-300 hover:bg-[#252E40]"
            }`}
            title={isZh ? "选择或输入战术文字标注 (Tactical Text)" : "Annotate tactical cue"}
          >
            <Type className="w-3.5 h-3.5 text-purple-400" />
            <span>🔤 文字 Text</span>
          </button>

          <button
            onClick={() => setActiveTool("ERASE")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === "ERASE"
                ? "bg-rose-700 text-white font-black shadow-sm"
                : "bg-[#1C2331] text-rose-300 hover:bg-[#252E40]"
            }`}
            title={isZh ? "点击任意球员、箭头或文字立即清除 (Erase)" : "Erase any element"}
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
            <span>🧹 橡皮 Erase</span>
          </button>

          {/* Ghost Trail Toggle Button */}
          <button
            onClick={() => setShowGhostTrails(!showGhostTrails)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              showGhostTrails
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm"
                : "bg-[#1C2331] text-stone-400 hover:text-stone-200"
            }`}
            title={isZh ? "显示或隐藏上一阶段位置残影与跑位动向矢量" : "Toggle ghost motion trail from previous phase"}
          >
            <span>👻 跑位残影 {showGhostTrails ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Quick Stamp Tokens & Presets */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          <button
            onClick={() => handleAddToken("PLAYER")}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold flex items-center space-x-1 transition-colors"
            title="添加我方队员 (Add Home Player)"
          >
            <span>+ 👕 我方 Home</span>
          </button>

          <button
            onClick={() => handleAddToken("OPPONENT")}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-300 text-xs font-bold flex items-center space-x-1 transition-colors"
            title="添加对方防守人 (Add Opponent)"
          >
            <span>+ 🛡️ 防守 Opp</span>
          </button>

          <button
            onClick={() => handleAddToken("BALL")}
            className="px-2 py-1.5 rounded-lg bg-[#1C2331] hover:bg-[#252E40] text-stone-200 text-xs font-semibold flex items-center space-x-1"
            title="添加比赛球 (Add Ball)"
          >
            <span>+ ⚽ 球 Ball</span>
          </button>

          <button
            onClick={() => handleAddToken("CONE")}
            className="px-2 py-1.5 rounded-lg bg-[#1C2331] hover:bg-[#252E40] text-amber-300 text-xs font-semibold flex items-center space-x-1"
            title="添加训练标志锥 (Add Cone)"
          >
            <span>+ 🚩 锥 Cone</span>
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
                📐 一键阵型 Formations...
              </option>
              {sport === "FOOTBALL" && (
                <>
                  <option value="4-3-3">⚽ 4-3-3 阵型 (11 Players)</option>
                  <option value="4-4-2">⚽ 4-4-2 平行阵型 (11 Players)</option>
                  <option value="3-5-2">⚽ 3-5-2 攻守兼备 (11 Players)</option>
                </>
              )}
              {sport === "VOLLEYBALL" && (
                <option value="VOLLEYBALL_5_1">🏐 5-1 室内排球轮转 (6 Players)</option>
              )}
              {sport === "BASKETBALL" && (
                <option value="BASKETBALL_1_2_2">🏀 1-2-2 篮球半场攻防 (5 Players)</option>
              )}
              <option value="CLEAR_ALL">🗑️ 清空全场人员 (Clear All)</option>
            </select>
          </div>

          <button
            onClick={handleClearTrajectories}
            className="px-2 py-1.5 rounded-lg bg-[#1C2331]/80 hover:bg-[#252E40] text-stone-400 hover:text-stone-200 text-xs"
            title="清空当前阶段所有路线箭头 (Clear Arrows)"
          >
            {isZh ? "清空箭头" : "Clear Arrows"}
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
            {currentPhase.notesZh || currentPhase.notesEn || "点击并拖拽场上任意队员可实时排布站位，点击曲线上控制点可自由弯曲箭头"}
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
          onPointerDown={handlePitchPointerDown}
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
            <marker
              id="arrow-ghost-trail"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#60A5FA" fillOpacity="0.85" />
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
              {/* Outer Arena Surround Flooring */}
              <rect width="1000" height="700" fill="#0F172A" />

              {/* Taraflex Competition Orange Court (Standard 18m x 9m = 2:1 ratio) */}
              <rect
                x="120"
                y="140"
                width="760"
                height="420"
                rx="6"
                fill="#C2410C"
                stroke="#FFFFFF"
                strokeWidth="3.5"
              />

              {/* Center Net Line & Net Mesh */}
              <line
                x1="500"
                y1="125"
                x2="500"
                y2="575"
                stroke="#FFFFFF"
                strokeWidth="4"
              />
              {/* Center Net Top Band with mesh shadow */}
              <line
                x1="500"
                y1="130"
                x2="500"
                y2="570"
                stroke="#F8FAFC"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />

              {/* Antenna Poles at top and bottom */}
              <rect x="498" y="120" width="4" height="24" fill="#EF4444" stroke="#FFFFFF" strokeWidth="0.8" />
              <rect x="498" y="556" width="4" height="24" fill="#EF4444" stroke="#FFFFFF" strokeWidth="0.8" />

              {/* 3-Meter Attack Lines */}
              {/* Left Side (Our Court) 3m Line */}
              <line
                x1="373"
                y1="140"
                x2="373"
                y2="560"
                stroke="#FFFFFF"
                strokeWidth="3"
              />
              {/* Left Attack Line Dashed Extensions Beyond Touchline */}
              <line x1="373" y1="115" x2="373" y2="140" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="5 3" />
              <line x1="373" y1="560" x2="373" y2="585" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="5 3" />

              {/* Right Side (Opponent Court) 3m Line */}
              <line
                x1="627"
                y1="140"
                x2="627"
                y2="560"
                stroke="#FFFFFF"
                strokeWidth="3"
              />
              <line x1="627" y1="115" x2="627" y2="140" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="5 3" />
              <line x1="627" y1="560" x2="627" y2="585" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="5 3" />

              {/* Service Zone Guide Ticks */}
              <line x1="120" y1="115" x2="120" y2="135" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="120" y1="565" x2="120" y2="585" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="880" y1="115" x2="880" y2="135" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="880" y1="565" x2="880" y2="585" stroke="#FFFFFF" strokeWidth="2" />

              {/* Watermark 6-Zone Indicators (Left / Home Side) */}
              <g opacity="0.3" className="pointer-events-none select-none">
                <text x="250" y="490" fill="#FFFFFF" fontSize="16" fontWeight="900" textAnchor="middle">1 (后右)</text>
                <text x="435" y="490" fill="#FFFFFF" fontSize="16" fontWeight="900" textAnchor="middle">2 (前右)</text>
                <text x="435" y="355" fill="#FFFFFF" fontSize="16" fontWeight="900" textAnchor="middle">3 (前中)</text>
                <text x="435" y="220" fill="#FFFFFF" fontSize="16" fontWeight="900" textAnchor="middle">4 (前左)</text>
                <text x="250" y="220" fill="#FFFFFF" fontSize="16" fontWeight="900" textAnchor="middle">5 (后左)</text>
                <text x="250" y="355" fill="#FFFFFF" fontSize="16" fontWeight="900" textAnchor="middle">6 (后中Pipe)</text>
              </g>

              {/* Center Watermark Crest */}
              <text
                x="500"
                y="675"
                fill="#64748B"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="2"
              >
                FIVB OFFICIAL VOLLEYBALL 18m x 9m COURT
              </text>
            </g>
          )}

          {sport === "BASKETBALL" && (
            <g id="basketballPitchV6">
              {/* Outer Arena Surround */}
              <rect width="1000" height="700" fill="#181310" />

              {/* Polished Hardwood Planks Base */}
              <rect
                x="50"
                y="50"
                width="900"
                height="600"
                rx="6"
                fill="#92400E"
                stroke="#F59E0B"
                strokeWidth="3.5"
              />

              {/* Hardwood Plank Texture Stripes */}
              {[70, 110, 150, 190, 230, 270, 310, 350, 390, 430, 470, 510, 550, 590, 630].map((y) => (
                <line
                  key={y}
                  x1="50"
                  y1={y}
                  x2="950"
                  y2={y}
                  stroke="#78350F"
                  strokeWidth="1.2"
                  opacity="0.4"
                />
              ))}

              {/* Half-Court Division Line */}
              <line
                x1="500"
                y1="50"
                x2="500"
                y2="650"
                stroke="#F59E0B"
                strokeWidth="3"
              />

              {/* Center Circle & Outer Jump Ball Circle */}
              <circle
                cx="500"
                cy="350"
                r="70"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
              />
              <circle
                cx="500"
                cy="350"
                r="24"
                fill="#78350F"
                stroke="#F59E0B"
                strokeWidth="2"
              />

              {/* === LEFT HOOP & PAINT (HOME COURT) === */}
              {/* The Key / Paint Lane */}
              <rect
                x="50"
                y="240"
                width="190"
                height="220"
                fill="#7C2D12"
                stroke="#F59E0B"
                strokeWidth="3"
              />
              {/* Free-Throw Circle (Right Half Solid, Left Half Dashed) */}
              <path
                d="M 240 280 A 70 70 0 0 1 240 420"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
              />
              <path
                d="M 240 420 A 70 70 0 0 1 240 280"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              {/* 3-Point Arc */}
              <path
                d="M 50 110 L 140 110 A 260 260 0 0 1 140 590 L 50 590"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.2"
              />
              {/* Restricted Area Arc Under Rim */}
              <path
                d="M 105 305 A 45 45 0 0 1 105 395"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.2"
              />
              {/* Backboard & Rim */}
              <line x1="80" y1="310" x2="80" y2="390" stroke="#FFFFFF" strokeWidth="4.5" />
              <line x1="80" y1="350" x2="90" y2="350" stroke="#EA580C" strokeWidth="3" />
              <circle cx="102" cy="350" r="12" fill="none" stroke="#EA580C" strokeWidth="3.5" />

              {/* === RIGHT HOOP & PAINT (AWAY COURT) === */}
              {/* The Key / Paint Lane */}
              <rect
                x="760"
                y="240"
                width="190"
                height="220"
                fill="#7C2D12"
                stroke="#F59E0B"
                strokeWidth="3"
              />
              {/* Free-Throw Circle */}
              <path
                d="M 760 280 A 70 70 0 0 0 760 420"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
              />
              <path
                d="M 760 420 A 70 70 0 0 0 760 280"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              {/* 3-Point Arc */}
              <path
                d="M 950 110 L 860 110 A 260 260 0 0 0 860 590 L 950 590"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.2"
              />
              {/* Restricted Area Arc Under Rim */}
              <path
                d="M 895 305 A 45 45 0 0 0 895 395"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.2"
              />
              {/* Backboard & Rim */}
              <line x1="920" y1="310" x2="920" y2="390" stroke="#FFFFFF" strokeWidth="4.5" />
              <line x1="920" y1="350" x2="910" y2="350" stroke="#EA580C" strokeWidth="3" />
              <circle cx="898" cy="350" r="12" fill="none" stroke="#EA580C" strokeWidth="3.5" />

              {/* Center Watermark */}
              <text
                x="500"
                y="675"
                fill="#78350F"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="2"
              >
                FIBA / NCAA HARDWOOD 28m x 15m BASKETBALL COURT
              </text>
            </g>
          )}

          {/* ================= GHOST TRAILS & PREVIOUS PHASE MOTION VECTORS ================= */}
          {showGhostTrails && prevPhase && ghostMovementPairs.map((pair) => {
            const isOpponent = pair.type === "OPPONENT";
            const isBall = pair.type === "BALL";
            const strokeColor = isBall ? "#FBBF24" : isOpponent ? "#F87171" : "#60A5FA";
            const ghostBg = isBall ? "#FEF3C7" : isOpponent ? "#7F1D1D" : "#1E3A8A";

            // Quadratic bezier curve control point offset
            const midX = (pair.prevX + pair.currX) / 2;
            const midY = (pair.prevY + pair.currY) / 2;
            const dx = pair.currX - pair.prevX;
            const dy = pair.currY - pair.prevY;
            const perpX = -dy * 0.16;
            const perpY = dx * 0.16;
            const ctrlX = Math.round(midX + perpX);
            const ctrlY = Math.round(midY + perpY);

            const pathD = `M ${pair.prevX} ${pair.prevY} Q ${ctrlX} ${ctrlY} ${pair.currX} ${pair.currY}`;

            return (
              <g key={`ghost_${pair.tokenId}`} className="pointer-events-none select-none">
                {/* 1. Ghost origin position marker */}
                <circle
                  cx={pair.prevX}
                  cy={pair.prevY}
                  r={isBall ? 10 : 16}
                  fill={ghostBg}
                  fillOpacity="0.35"
                  stroke={strokeColor}
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />
                {!isBall && (
                  <text
                    x={pair.prevX}
                    y={pair.prevY + 3.5}
                    fill={strokeColor}
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    opacity="0.9"
                  >
                    {pair.jerseyNumber || "•"}
                  </text>
                )}

                {/* 2. Motion vector connecting Phase N-1 to Phase N */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  strokeLinecap="round"
                  opacity="0.85"
                  markerEnd="url(#arrow-ghost-trail)"
                />

                {/* 3. Distance & Phase Transition Tag */}
                <g transform={`translate(${ctrlX}, ${ctrlY})`}>
                  <rect
                    x="-26"
                    y="-9"
                    width="52"
                    height="18"
                    rx="5"
                    fill="#0F172A"
                    fillOpacity="0.9"
                    stroke={strokeColor}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    fill={strokeColor}
                    fontSize="8.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    跑动 +{pair.distance}m
                  </text>
                </g>
              </g>
            );
          })}

          {/* ================= 4. TACTICAL TRAJECTORIES (ARROWS WITH BENDABLE CURVES) ================= */}
          {currentPhase.trajectories?.map((traj) => {
            const ctrlX = traj.controlX ?? Math.round((traj.startX + traj.endX) / 2);
            const ctrlY = traj.controlY ?? Math.round((traj.startY + traj.endY) / 2);
            const pathData = `M ${traj.startX} ${traj.startY} Q ${ctrlX} ${ctrlY} ${traj.endX} ${traj.endY}`;

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

            const isDraggingThisCurve = draggingCurveId === traj.id;

            return (
              <g key={traj.id} className="group">
                {/* Thick invisible hit path for easy erasing */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="26"
                  className="cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === "ERASE") {
                      handleEraseTrajectory(traj.id);
                    }
                  }}
                />
                {/* Main Visible Trajectory Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3.8"
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  markerEnd={markerEnd}
                  opacity={activeTool === "ERASE" ? 0.6 : 0.95}
                  className="pointer-events-none"
                />
                {/* Draggable Curve Control Point Handle */}
                {activeTool !== "ERASE" && (
                  <g className="cursor-move pointer-events-auto">
                    {/* Dashed Guideline to control point */}
                    <line
                      x1={(traj.startX + traj.endX) / 2}
                      y1={(traj.startY + traj.endY) / 2}
                      x2={ctrlX}
                      y2={ctrlY}
                      stroke={strokeColor}
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                      opacity="0.5"
                    />
                    {/* Grab handle dot */}
                    <circle
                      cx={ctrlX}
                      cy={ctrlY}
                      r={isDraggingThisCurve ? "8" : "6"}
                      fill={isDraggingThisCurve ? "#FFFFFF" : strokeColor}
                      stroke="#0A0E17"
                      strokeWidth="2"
                      onPointerDown={(e) => handleCurveControlPointerDown(traj, e)}
                      className="hover:scale-125 transition-transform"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Live Drawing Preview */}
          {drawingTrajectory && (() => {
            const isCurved =
              drawingTrajectory.type === "PASS_CURVE" || drawingTrajectory.type === "RUN_CURVE";
            const { startX, startY, currentX, currentY, type } = drawingTrajectory;

            let ctrlX = Math.round((startX + currentX) / 2);
            let ctrlY = Math.round((startY + currentY) / 2);

            if (isCurved) {
              const curve = calculateCurvedControlPoint(startX, startY, currentX, currentY, 0.28);
              ctrlX = curve.controlX;
              ctrlY = curve.controlY;
            }

            const pathData = isCurved
              ? `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${currentX} ${currentY}`
              : `M ${startX} ${startY} L ${currentX} ${currentY}`;

            const strokeColor = type.startsWith("PASS")
              ? "#F59E0B"
              : type.startsWith("RUN")
              ? "#38BDF8"
              : "#FB923C";

            const marker = type.startsWith("PASS")
              ? "url(#arrow-pass-v6)"
              : type.startsWith("RUN")
              ? "url(#arrow-run-v6)"
              : "url(#arrow-dribble-v6)";

            return (
              <g className="pointer-events-none">
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3.8"
                  strokeDasharray={type.startsWith("PASS") ? "none" : "6 4"}
                  markerEnd={marker}
                />
                <circle cx={startX} cy={startY} r="4.5" fill="#FFFFFF" />
                {isCurved && (
                  <circle
                    cx={ctrlX}
                    cy={ctrlY}
                    r="5"
                    fill="#FFFFFF"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })()}

          {/* ================= 5. TACTICAL TOKENS (PLAYERS, OPPONENTS, BALL, CONES, TEXT) ================= */}
          {displayedTokens.map((token) => {
            const isSelected = token.id === selectedTokenId;

            // 1. Text Annotation Token
            if (token.type === "TEXT" || token.id.startsWith("text_")) {
              const textWidth = Math.max(72, (token.label || "").length * 13 + 24);
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  onPointerDown={(e) => handleTokenPointerDown(token, e)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {isSelected && (
                    <rect
                      x={-textWidth / 2 - 4}
                      y="-19"
                      width={textWidth + 8}
                      height="38"
                      rx="10"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                  )}
                  <rect
                    x={-textWidth / 2}
                    y="-15"
                    width={textWidth}
                    height="30"
                    rx="8"
                    fill="#18202C"
                    stroke={isSelected ? "#F59E0B" : "#A855F7"}
                    strokeWidth="1.8"
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
                  onPointerDown={(e) => handleTokenPointerDown(token, e)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                    />
                  )}
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
                  onPointerDown={(e) => handleTokenPointerDown(token, e)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="24"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                    />
                  )}
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

            // 4. Opponent Token (Crimson Red with clear "防守 1", "防守 2" label, NO "X1/X2"!)
            if (token.type === "OPPONENT") {
              return (
                <g
                  key={token.id}
                  transform={`translate(${token.x}, ${token.y})`}
                  onPointerDown={(e) => handleTokenPointerDown(token, e)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="26"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                  )}
                  <circle cx="0" cy="0" r="21" fill="#000000" fillOpacity="0.4" />
                  <circle
                    cx="0"
                    cy="0"
                    r="19"
                    fill="#B91C1C"
                    stroke={isSelected ? "#F59E0B" : "#FFFFFF"}
                    strokeWidth={isSelected ? "3" : "2"}
                  />
                  <text
                    x="0"
                    y="4.5"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {token.label || "防守"}
                  </text>
                </g>
              );
            }

            // 5. Home Team Player Token (High-contrast Broadcast Emblem)
            const isMe = (myToken && token.id === myToken.id) || (athletePovId && token.id === athletePovId);

            return (
              <g
                key={token.id}
                transform={`translate(${token.x}, ${token.y})`}
                onPointerDown={(e) => handleTokenPointerDown(token, e)}
                className="cursor-grab active:cursor-grabbing"
              >
                {/* Selection Halo Ring (SVG native styling, 0 CSS transform overwrite) */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="26"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.8"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Shadow */}
                <circle cx="0" cy="2" r="21" fill="#000000" fillOpacity="0.45" />

                {/* Main Player Badge */}
                <circle
                  cx="0"
                  cy="0"
                  r="19"
                  fill="#0369A1"
                  stroke={isSelected ? "#F59E0B" : "#FFFFFF"}
                  strokeWidth={isSelected ? "3" : "2"}
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
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 2"
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
                <strong className="text-emerald-400">{isZh ? "跑位职责：" : "Duty: "}</strong>{" "}
                {isZh
                  ? selectedToken.dutyZh || selectedToken.dutyEn || "保持战术位置，随时前插策应。"
                  : selectedToken.dutyEn || selectedToken.dutyZh || "Hold tactical position and support play."}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 font-mono shrink-0">
            {isZh ? "球场坐标" : "Coords"}: ({selectedToken.x}, {selectedToken.y})
          </div>
        </div>
      )}

      {/* ================= 7. STEP STORYBOARD TIMELINE STRIP (连环推演画卷，清晰衔接从阶段1到阶段2) ================= */}
      <div className="p-3.5 rounded-xl bg-[#141923] border border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>🎬</span>
              <span>{isZh ? "战术演进连环画卷" : "Tactical Step Storyboard"}</span>
              <span className="text-xs font-normal text-stone-400 font-sans">/ Step Storyboard</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-600/40">
              {isZh ? "阶段衔接一目了然" : "Phase Clarity"}
            </span>
          </div>

          {/* Perspective Dropdown (Coach bird-eye vs Athlete POV) */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-stone-400">{isZh ? "战术视角:" : "POV:"}</span>
            <select
              value={athletePovId || ""}
              onChange={(e) => setAthletePovId(e.target.value || null)}
              className="px-2.5 py-1 rounded-lg bg-[#1C2331] border border-white/[0.08] text-stone-200 text-xs outline-none cursor-pointer"
            >
              <option value="">{isZh ? "👀 全景全局鸟瞰 (Coach Bird-Eye)" : "👀 Coach Bird-Eye View"}</option>
              {currentPhase.tokens
                .filter((t) => t.type === "PLAYER" && t.jerseyNumber)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    👕 #{t.jerseyNumber} {t.label} ({t.position || "Athlete"})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Storyboard Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {phases.map((ph, idx) => {
            const isCurrent = currentPhaseIdx === idx;
            return (
              <div
                key={idx}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentPhaseIdx(idx);
                  setAnimProgress(0);
                }}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between group ${
                  isCurrent
                    ? "bg-emerald-950/40 border-emerald-500 shadow-lg ring-1 ring-emerald-500/50"
                    : "bg-[#181F2B] border-white/[0.06] hover:bg-[#1E2736] hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                        isCurrent
                          ? "bg-emerald-500 text-white"
                          : "bg-stone-800 text-stone-300 group-hover:bg-stone-700"
                      }`}
                    >
                      {ph.titleZh || `阶段 ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {ph.tokens?.length || 0} {isZh ? "人" : "tokens"} · {ph.trajectories?.length || 0} {isZh ? "线" : "arrows"}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white mb-1">
                    {ph.titleZh}
                    <span className="text-[10px] text-stone-400 font-normal block">{ph.titleEn}</span>
                  </h5>

                  <p className="text-xs text-stone-300 leading-relaxed line-clamp-3 mt-1.5">
                    {ph.notesZh || ph.notesEn}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-stone-400 font-mono text-[10px]">
                    {idx === 0
                      ? isZh ? "起手布阵" : "Kick-off"
                      : isZh ? `从阶段${idx}跑位演进` : `Transition from P${idx}`}
                  </span>
                  <span
                    className={`font-bold flex items-center space-x-1 ${
                      isCurrent ? "text-emerald-400" : "text-stone-400 group-hover:text-stone-200"
                    }`}
                  >
                    <span>{isCurrent ? (isZh ? "当前演练中 ✓" : "Active ✓") : isZh ? "切至该阶段 ➔" : "View Phase ➔"}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 7. TACTICAL TEXT ANNOTATION MODAL ================= */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#141B24] border border-white/10 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Type className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isZh ? "添加战术文字标注" : "Add Tactical Pitch Label"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowTextModal(false);
                  setActiveTool("SELECT");
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Chips */}
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-2">
                {isZh ? "常用专业战术词汇（一键点击添加）：" : "Quick Tactical Terms:"}
              </label>
              <div className="flex flex-wrap gap-2">
                {tacticalVocabulary.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      handleAddTextToken(term, textColor);
                      setShowTextModal(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1C2534] hover:bg-purple-600/80 text-stone-200 hover:text-white border border-white/10 hover:border-purple-500 transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 block">
                {isZh ? "或输入自定义战术指令：" : "Or Custom Instruction:"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={
                    isZh
                      ? "例如: 假动作佯攻、弱侧套边、弧线远射"
                      : "e.g. Overlap, Switch play..."
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#0D1219] border border-white/10 text-white text-xs outline-none focus:border-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customText.trim()) {
                      handleAddTextToken(customText.trim(), textColor);
                      setCustomText("");
                      setShowTextModal(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (customText.trim()) {
                      handleAddTextToken(customText.trim(), textColor);
                      setCustomText("");
                      setShowTextModal(false);
                    }
                  }}
                  disabled={!customText.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs transition-colors shrink-0"
                >
                  {isZh ? "放置到球场" : "Place"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
