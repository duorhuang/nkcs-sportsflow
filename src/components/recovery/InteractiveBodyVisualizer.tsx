"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SportChannel } from "@/types";
import {
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Activity,
  HeartPulse,
  Eye,
  Crosshair,
  ShieldAlert,
} from "lucide-react";

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

const PART_NAMES: Record<BodyPartKey, { zh: string; en: string }> = {
  neck: { zh: "颈肩 / 斜方肌", en: "Neck & Trapezius" },
  shoulders: { zh: "三角肌 / 肩袖肌群", en: "Deltoids & Rotator Cuff" },
  chest: { zh: "胸大肌", en: "Pectoralis Major" },
  core: { zh: "腹直肌 / 核心肌群", en: "Core & Abdominals" },
  lower_back: { zh: "腰椎竖脊肌 / 背阔肌", en: "Lower Back & Erector Spinae" },
  groin: { zh: "腹股沟 / 髋内收肌", en: "Groin & Hip Adductors" },
  quads: { zh: "大腿前侧股四头肌", en: "Quadriceps" },
  hamstrings: { zh: "大腿后侧腘绳肌", en: "Hamstrings Complex" },
  knees: { zh: "膝关节 / 髌腱韧带", en: "Knee & Patellar Tendon" },
  calves: { zh: "小腿后侧腓肠肌 / 比目鱼肌", en: "Calves & Gastrocnemius" },
  ankles: { zh: "踝关节 / 跟腱复合体", en: "Ankles & Achilles Tendon" },
};

// 3D coordinate mapping on standard athletic human proportions
const ANATOMY_ANCHORS: Record<BodyPartKey, { x: number; y: number; z: number; isBack?: boolean }[]> = {
  neck: [{ x: 0, y: 0.62, z: 0 }],
  shoulders: [
    { x: -0.26, y: 0.52, z: 0 },
    { x: 0.26, y: 0.52, z: 0 },
  ],
  chest: [{ x: 0, y: 0.40, z: 0.09 }],
  core: [{ x: 0, y: 0.18, z: 0.08 }],
  lower_back: [{ x: 0, y: 0.18, z: -0.08, isBack: true }],
  groin: [{ x: 0, y: -0.02, z: 0.05 }],
  quads: [
    { x: -0.13, y: -0.28, z: 0.09 },
    { x: 0.13, y: -0.28, z: 0.09 },
  ],
  hamstrings: [
    { x: -0.13, y: -0.28, z: -0.09, isBack: true },
    { x: 0.13, y: -0.28, z: -0.09, isBack: true },
  ],
  knees: [
    { x: -0.13, y: -0.56, z: 0.06 },
    { x: 0.13, y: -0.56, z: 0.06 },
  ],
  calves: [
    { x: -0.13, y: -0.78, z: -0.06, isBack: true },
    { x: 0.13, y: -0.78, z: -0.06, isBack: true },
  ],
  ankles: [
    { x: -0.13, y: -0.98, z: 0.02 },
    { x: 0.13, y: -0.98, z: 0.02 },
  ],
};

export default function InteractiveBodyVisualizer({
  sport,
  selectedPart,
  onSelectPart,
}: InteractiveBodyVisualizerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");
  const [hoveredPart, setHoveredPart] = useState<BodyPartKey | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentAngleView, setCurrentAngleView] = useState<"FRONT" | "BACK" | "LEFT" | "RIGHT">("FRONT");
  const [modelLoaded, setModelLoaded] = useState(false);

  // High-risk parts based on sport
  const isHighRiskForSport = (part: BodyPartKey): boolean => {
    if (sport === "FOOTBALL") return ["hamstrings", "groin", "knees", "ankles", "calves"].includes(part);
    if (sport === "VOLLEYBALL") return ["shoulders", "knees", "ankles", "lower_back", "calves"].includes(part);
    if (sport === "BASKETBALL") return ["ankles", "knees", "groin", "lower_back", "calves"].includes(part);
    return false;
  };

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const hitObjectsRef = useRef<THREE.Mesh[]>([]);
  const beaconMeshesRef = useRef<Map<BodyPartKey, THREE.Mesh[]>>(new Map());
  const reqAnimRef = useRef<number | null>(null);
  const targetRotationYRef = useRef<number>(0);
  const targetRotationXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseXRef = useRef<number>(0);
  const prevMouseYRef = useRef<number>(0);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);
    cameraRef.current = camera;

    // 3. Renderer with high-contrast PBR lighting
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lighting: Clean Athletic Studio Setup (Key, Fill, Rim)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf8fafc, 2.2);
    keyLight.position.set(2.5, 3.5, 3.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-2.5, 1.0, -3.0);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.9);
    fillLight.position.set(0, -2.5, 2.5);
    scene.add(fillLight);

    // 5. Model Container Group
    const modelGroup = new THREE.Group();
    modelGroup.position.y = -0.05;
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 6. Ground Shadow Disc
    const groundGeo = new THREE.CircleGeometry(0.85, 36);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x05080c,
      transparent: true,
      opacity: 0.65,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -1.15;
    modelGroup.add(groundMesh);

    // 7. Load Real 3D Human Athletic Mesh (GLTF)
    const loader = new GLTFLoader();
    loader.load(
      "/assets/models/xbot.glb",
      (gltf) => {
        const humanModel = gltf.scene;
        // Position and scale real athletic human model
        humanModel.scale.set(1.18, 1.18, 1.18);
        humanModel.position.set(0, -1.12, 0);

        // Sleek athletic titanium PBR surface
        const athleticSkinMaterial = new THREE.MeshStandardMaterial({
          color: 0x242d38, // Sleek titanium athletic slate
          roughness: 0.32,
          metalness: 0.22,
          flatShading: false,
        });

        humanModel.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = athleticSkinMaterial;
          }
        });

        modelGroup.add(humanModel);
        setModelLoaded(true);
      },
      undefined,
      (err) => {
        console.error("Failed to load human glb model, fallback active:", err);
      }
    );

    // 8. Build Interactive Anatomical Raycast Targets & Holographic Beacons
    const hitList: THREE.Mesh[] = [];
    const beaconMap = new Map<BodyPartKey, THREE.Mesh[]>();

    (Object.keys(ANATOMY_ANCHORS) as BodyPartKey[]).forEach((partKey) => {
      const anchors = ANATOMY_ANCHORS[partKey];
      const beacons: THREE.Mesh[] = [];

      anchors.forEach((anc) => {
        // Invisible Click Target Sphere (for easy pointer raycasting)
        const hitGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.set(anc.x, anc.y, anc.z);
        hitMesh.userData = { partKey };
        modelGroup.add(hitMesh);
        hitList.push(hitMesh);

        // Visible Holographic Target Ring
        const ringGeo = new THREE.RingGeometry(0.035, 0.055, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x94a3b8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(anc.x, anc.y, anc.z + (anc.isBack ? -0.015 : 0.015));
        if (anc.isBack) ringMesh.rotation.y = Math.PI;
        modelGroup.add(ringMesh);
        beacons.push(ringMesh);
      });

      beaconMap.set(partKey, beacons);
    });

    hitObjectsRef.current = hitList;
    beaconMeshesRef.current = beaconMap;

    // 9. Animation Frame Loop
    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (modelGroupRef.current) {
        if (autoRotate && !isDraggingRef.current) {
          modelGroupRef.current.rotation.y += 0.007;
          targetRotationYRef.current = modelGroupRef.current.rotation.y;
        } else {
          modelGroupRef.current.rotation.y +=
            (targetRotationYRef.current - modelGroupRef.current.rotation.y) * 0.1;
        }
        modelGroupRef.current.rotation.x +=
          (targetRotationXRef.current - modelGroupRef.current.rotation.x) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();
    reqAnimRef.current = animationFrameId;

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.innerHTML = "";
      }
    };
  }, []);

  // Update Holographic Beacons based on selected/hovered muscle
  useEffect(() => {
    const beaconMap = beaconMeshesRef.current;
    if (!beaconMap) return;

    beaconMap.forEach((beacons, key) => {
      const isSelected = selectedPart === key;
      const isHovered = hoveredPart === key;
      const isHighRisk = isHighRiskForSport(key);

      beacons.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (!mat) return;

        if (isSelected) {
          mat.color.setHex(0xf59e0b); // Active focus: Rich Amber
          mat.opacity = 0.95;
          mesh.scale.set(1.4, 1.4, 1.4);
        } else if (isHovered) {
          mat.color.setHex(0x38bdf8); // Hover focus: Tactical Sky Blue
          mat.opacity = 0.85;
          mesh.scale.set(1.2, 1.2, 1.2);
        } else if (isHighRisk) {
          mat.color.setHex(0xef4444); // High sport injury risk: Crimson Red
          mat.opacity = 0.65;
          mesh.scale.set(1.0, 1.0, 1.0);
        } else {
          mat.color.setHex(0x64748b); // Idle: Sleek Slate
          mat.opacity = 0.45;
          mesh.scale.set(0.9, 0.9, 0.9);
        }
      });
    });
  }, [selectedPart, hoveredPart, sport]);

  // Raycasting Handlers
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseCoordRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const getIntersections = (clientX: number, clientY: number): THREE.Intersection[] => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const hitList = hitObjectsRef.current;
    if (!container || !camera || hitList.length === 0) return [];

    const rect = container.getBoundingClientRect();
    mouseCoordRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseCoordRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseCoordRef.current, camera);
    return raycasterRef.current.intersectObjects(hitList, false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    prevMouseXRef.current = e.clientX;
    prevMouseYRef.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevMouseXRef.current;
      const deltaY = e.clientY - prevMouseYRef.current;
      targetRotationYRef.current += deltaX * 0.012;
      targetRotationXRef.current = Math.max(-0.45, Math.min(0.45, targetRotationXRef.current + deltaY * 0.008));
      prevMouseXRef.current = e.clientX;
      prevMouseYRef.current = e.clientY;
    } else {
      const hits = getIntersections(e.clientX, e.clientY);
      let foundPart: BodyPartKey | null = null;
      for (const hit of hits) {
        const key = hit.object.userData?.partKey as BodyPartKey;
        if (key) {
          foundPart = key;
          break;
        }
      }
      setHoveredPart(foundPart);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!cameraRef.current) return;
    const newZ = cameraRef.current.position.z + e.deltaY * 0.003;
    cameraRef.current.position.z = Math.max(2.4, Math.min(5.5, newZ));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dragDist = Math.hypot(
      e.clientX - prevMouseXRef.current,
      e.clientY - prevMouseYRef.current
    );

    if (dragDist < 6) {
      const hits = getIntersections(e.clientX, e.clientY);
      for (const hit of hits) {
        const key = hit.object.userData?.partKey as BodyPartKey;
        if (key) {
          onSelectPart(key);
          break;
        }
      }
    }

    isDraggingRef.current = false;
  };

  const setPresetAngle = (view: "FRONT" | "BACK" | "LEFT" | "RIGHT") => {
    setAutoRotate(false);
    setCurrentAngleView(view);
    if (view === "FRONT") targetRotationYRef.current = 0;
    if (view === "BACK") targetRotationYRef.current = Math.PI;
    if (view === "LEFT") targetRotationYRef.current = Math.PI / 2;
    if (view === "RIGHT") targetRotationYRef.current = -Math.PI / 2;
    targetRotationXRef.current = 0;
  };

  return (
    <div className="flex flex-col items-center bg-[#11151D] border border-white/[0.08] rounded-2xl p-4 shadow-xl select-none w-full">
      {/* Top Header & View Mode Switcher */}
      <div className="flex items-center justify-between w-full pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            3D 空间立体人体解剖模型
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center p-1 rounded-lg bg-[#181E29] border border-white/[0.08] text-xs font-bold">
            <button
              onClick={() => setViewMode("3D")}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                viewMode === "3D"
                  ? "bg-emerald-600 text-white font-black shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              🧊 真实3D
            </button>
            <button
              onClick={() => setViewMode("2D")}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                viewMode === "2D"
                  ? "bg-emerald-600 text-white font-black shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              📐 2D图谱
            </button>
          </div>

          {viewMode === "3D" && (
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                autoRotate
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-600/60"
                  : "bg-[#181E29] text-stone-300 hover:bg-[#202736]"
              }`}
              title="360° 自动环绕"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
              <span>自转</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset View Angles (3D Only) */}
      {viewMode === "3D" && (
        <div className="flex items-center justify-center gap-1.5 w-full my-3 px-1">
          {(
            [
              { id: "FRONT", label: "正面" },
              { id: "BACK", label: "背面" },
              { id: "LEFT", label: "左侧" },
              { id: "RIGHT", label: "右侧" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPresetAngle(item.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                currentAngleView === item.id && !autoRotate
                  ? "bg-white text-stone-950 font-bold shadow-sm"
                  : "bg-[#181E29] text-stone-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{ display: viewMode === "3D" ? "flex" : "none" }}
        className="relative w-full max-w-[360px] aspect-[360/540] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-radial from-[#18212D]/80 to-[#0A0D14] border border-white/[0.08] shadow-inner items-center justify-center"
      >
        {/* Subtle Canvas Instruction */}
        <div className="absolute top-3 left-3 pointer-events-none text-[10px] text-stone-400 font-mono flex items-center space-x-1.5 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm border border-white/[0.06]">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>360° 拖拽自由旋转 · 点击肌群光标</span>
        </div>

        {/* Live Hover Tag */}
        {hoveredPart && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none px-3.5 py-1 rounded-full bg-[#181E29]/95 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow-xl flex items-center space-x-1.5 backdrop-blur-sm">
            <Crosshair className="w-3.5 h-3.5" />
            <span>{PART_NAMES[hoveredPart].zh}</span>
          </div>
        )}
      </div>

      {/* 2D Anatomical SVG Map Container */}
      {viewMode === "2D" && (
        <div className="relative w-full max-w-[360px] aspect-[360/540] rounded-xl overflow-hidden bg-radial from-[#18212D]/80 to-[#0A0D14] border border-white/[0.08] p-3 my-2 flex flex-col justify-between select-none">
          <div className="flex items-center justify-around text-[10px] font-mono text-stone-400 font-bold border-b border-white/[0.08] pb-1.5">
            <span>[正面视图 · FRONT]</span>
            <span>[背面视图 · BACK]</span>
          </div>

          <svg viewBox="0 0 360 480" className="w-full h-full">
            {/* Front View */}
            <g transform="translate(10, 10)">
              {/* Head */}
              <circle cx="80" cy="40" r="24" fill="#242D38" stroke="#475569" strokeWidth="1.5" />
              {/* Neck */}
              <rect
                x="70"
                y="64"
                width="20"
                height="18"
                rx="4"
                fill={selectedPart === "neck" ? "#F59E0B" : "#334155"}
                className="cursor-pointer transition-colors"
                onClick={() => onSelectPart("neck")}
              />
              {/* Chest */}
              <rect
                x="48"
                y="85"
                width="64"
                height="40"
                rx="6"
                fill={selectedPart === "chest" ? "#F59E0B" : "#334155"}
                className="cursor-pointer transition-colors"
                onClick={() => onSelectPart("chest")}
              />
              {/* Core */}
              <rect
                x="52"
                y="128"
                width="56"
                height="46"
                rx="6"
                fill={selectedPart === "core" ? "#F59E0B" : "#334155"}
                className="cursor-pointer transition-colors"
                onClick={() => onSelectPart("core")}
              />
              {/* Groin */}
              <polygon
                points="52,176 108,176 80,210"
                fill={selectedPart === "groin" ? "#F59E0B" : "#334155"}
                className="cursor-pointer transition-colors"
                onClick={() => onSelectPart("groin")}
              />
              {/* Shoulders */}
              <circle
                cx="38"
                cy="92"
                r="14"
                fill={selectedPart === "shoulders" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("shoulders")}
              />
              <circle
                cx="122"
                cy="92"
                r="14"
                fill={selectedPart === "shoulders" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("shoulders")}
              />
              {/* Quads */}
              <rect
                x="50"
                y="214"
                width="26"
                height="80"
                rx="8"
                fill={selectedPart === "quads" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("quads")}
              />
              <rect
                x="84"
                y="214"
                width="26"
                height="80"
                rx="8"
                fill={selectedPart === "quads" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("quads")}
              />
              {/* Knees */}
              <circle
                cx="63"
                cy="306"
                r="10"
                fill={selectedPart === "knees" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("knees")}
              />
              <circle
                cx="97"
                cy="306"
                r="10"
                fill={selectedPart === "knees" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("knees")}
              />
              {/* Ankles */}
              <rect
                x="55"
                y="400"
                width="16"
                height="24"
                rx="4"
                fill={selectedPart === "ankles" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("ankles")}
              />
              <rect
                x="89"
                y="400"
                width="16"
                height="24"
                rx="4"
                fill={selectedPart === "ankles" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("ankles")}
              />
            </g>

            {/* Back View */}
            <g transform="translate(190, 10)">
              {/* Head */}
              <circle cx="80" cy="40" r="24" fill="#242D38" stroke="#475569" strokeWidth="1.5" />
              {/* Lower back */}
              <rect
                x="50"
                y="110"
                width="60"
                height="62"
                rx="6"
                fill={selectedPart === "lower_back" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("lower_back")}
              />
              {/* Hamstrings */}
              <rect
                x="50"
                y="214"
                width="26"
                height="80"
                rx="8"
                fill={selectedPart === "hamstrings" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("hamstrings")}
              />
              <rect
                x="84"
                y="214"
                width="26"
                height="80"
                rx="8"
                fill={selectedPart === "hamstrings" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("hamstrings")}
              />
              {/* Calves */}
              <rect
                x="52"
                y="320"
                width="22"
                height="75"
                rx="8"
                fill={selectedPart === "calves" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("calves")}
              />
              <rect
                x="86"
                y="320"
                width="22"
                height="75"
                rx="8"
                fill={selectedPart === "calves" ? "#F59E0B" : "#334155"}
                className="cursor-pointer"
                onClick={() => onSelectPart("calves")}
              />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
