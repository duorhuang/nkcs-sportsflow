"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { SportChannel } from "@/types";
import {
  BodyPartKey,
  SpecificMuscle,
  ANATOMY_DATABASE,
} from "@/lib/anatomyData";
import {
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Activity,
  Eye,
  Crosshair,
  ShieldAlert,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface InteractiveBodyVisualizerProps {
  sport: SportChannel;
  selectedPart: BodyPartKey;
  selectedSpecificMuscle?: string;
  onSelectPart: (part: BodyPartKey, specificKey?: string) => void;
  onSelectSpecificMuscle?: (specificKey: string, parentZone: BodyPartKey) => void;
}

export default function InteractiveBodyVisualizer({
  sport,
  selectedPart,
  selectedSpecificMuscle,
  onSelectPart,
  onSelectSpecificMuscle,
}: InteractiveBodyVisualizerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");
  const [hoveredMuscle, setHoveredMuscle] = useState<{
    key: string;
    parentZone: BodyPartKey;
    nameZh: string;
    nameEn: string;
  } | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentAngleView, setCurrentAngleView] = useState<"FRONT" | "BACK" | "SIDE">("FRONT");
  const [modelLoaded, setModelLoaded] = useState(false);

  // Flatten all muscles with their bilaterally mirrored 3D coordinates
  const allMusclesList = useMemo(() => {
    const list: SpecificMuscle[] = [];
    (Object.keys(ANATOMY_DATABASE) as BodyPartKey[]).forEach((zoneKey) => {
      ANATOMY_DATABASE[zoneKey].muscles.forEach((m) => list.push(m));
    });
    return list;
  }, []);

  // Find currently active specific muscle object
  const activeMuscleObj = useMemo(() => {
    if (selectedSpecificMuscle) {
      const found = allMusclesList.find((m) => m.key === selectedSpecificMuscle);
      if (found) return found;
    }
    // Fallback to first muscle of selected zone
    return ANATOMY_DATABASE[selectedPart]?.muscles[0];
  }, [selectedPart, selectedSpecificMuscle, allMusclesList]);

  // High-risk parts based on sport
  const isHighRiskForSport = (part: BodyPartKey): boolean => {
    if (sport === "FOOTBALL") return ["hamstrings", "groin", "knees", "ankles", "calves", "quads"].includes(part);
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
  const beaconMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
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
    const height = container.clientHeight || 540;

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf8fafc, 2.2);
    keyLight.position.set(2.5, 3.5, 3.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
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

    // 7. Load Real 3D Human Muscle Anatomy Mesh (Z-Anatomy GLTF with DRACO Compression)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      "/assets/models/body_anatomy.glb",
      (gltf) => {
        const humanModel = gltf.scene;

        // Compute exact bounding box and scale to standard athletic height (1.95m)
        const box = new THREE.Box3().setFromObject(humanModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const targetHeight = 1.95;
        const scale = targetHeight / (size.y || 1);
        humanModel.scale.set(scale, scale, scale);
        humanModel.position.set(-center.x * scale, -center.y * scale - 0.08, -center.z * scale);

        // Professional Musculoskeletal Athletic PBR Materials
        const muscleMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b2535, // Deep anatomical athletic muscle crimson
          roughness: 0.38,
          metalness: 0.15,
          flatShading: false,
        });

        const boneMaterial = new THREE.MeshStandardMaterial({
          color: 0xd6d1c4, // Polished bone ivory
          roughness: 0.32,
          metalness: 0.08,
          flatShading: false,
        });

        humanModel.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const isMuscle = /muscle|oblique|rectus|glute|biceps|deltoid|pectoral|quad|hamstring|gastro|soleus|trapezius|latissimus|adductor|flexor|extensor/i.test(
              child.name
            );
            child.material = isMuscle ? muscleMaterial : boneMaterial;
          }
        });

        modelGroup.add(humanModel);
        setModelLoaded(true);
      },
      undefined,
      (err) => {
        console.warn("body_anatomy.glb error, falling back to xbot.glb:", err);
        const fallbackLoader = new GLTFLoader();
        fallbackLoader.load("/assets/models/xbot.glb", (fallbackGltf) => {
          const model = fallbackGltf.scene;
          model.scale.set(1.18, 1.18, 1.18);
          model.position.set(0, -1.12, 0);
          modelGroup.add(model);
          setModelLoaded(true);
        });
      }
    );

    // 8. Build Interactive Raycast Targets & Precision Holographic Beacons for EACH Specific Muscle
    const hitList: THREE.Mesh[] = [];
    const beaconMap = new Map<string, THREE.Mesh[]>();

    allMusclesList.forEach((muscle) => {
      const anc = muscle.anchor3D;
      const beacons: THREE.Mesh[] = [];

      // Support bilateral coordinate creation if x is non-zero
      const coordinates = anc.x !== 0 ? [anc, { ...anc, x: -anc.x }] : [anc];

      coordinates.forEach((pos) => {
        // Invisible Click Target Sphere (for easy pointer raycasting)
        const hitGeo = new THREE.SphereGeometry(0.09, 12, 12);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.set(pos.x, pos.y, pos.z);
        hitMesh.userData = {
          specificKey: muscle.key,
          parentZone: muscle.parentZone,
          nameZh: muscle.nameZh,
          nameEn: muscle.nameEn,
        };
        modelGroup.add(hitMesh);
        hitList.push(hitMesh);

        // Visible Holographic Target Ring
        const ringGeo = new THREE.RingGeometry(0.032, 0.048, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x94a3b8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(pos.x, pos.y, pos.z + (pos.isBack ? -0.015 : 0.015));
        if (pos.isBack) ringMesh.rotation.y = Math.PI;
        modelGroup.add(ringMesh);
        beacons.push(ringMesh);
      });

      beaconMap.set(muscle.key, beacons);
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
      const h = container.clientHeight || 540;
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
  }, [allMusclesList]);

  // Update Holographic Beacons based on selected specific muscle & hovered muscle
  useEffect(() => {
    const beaconMap = beaconMeshesRef.current;
    if (!beaconMap) return;

    beaconMap.forEach((beacons, key) => {
      const isSelected = selectedSpecificMuscle === key;
      const isHovered = hoveredMuscle?.key === key;
      const muscle = allMusclesList.find((m) => m.key === key);
      const isSameZone = muscle?.parentZone === selectedPart;
      const isHighRisk = muscle ? isHighRiskForSport(muscle.parentZone) : false;

      beacons.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (!mat) return;

        if (isSelected) {
          mat.color.setHex(0xf59e0b); // Active focus: Rich Amber
          mat.opacity = 0.98;
          mesh.scale.set(1.4, 1.4, 1.4);
        } else if (isHovered) {
          mat.color.setHex(0x38bdf8); // Hover focus: Tactical Sky Blue
          mat.opacity = 0.88;
          mesh.scale.set(1.25, 1.25, 1.25);
        } else if (isSameZone) {
          mat.color.setHex(0x10b981); // Same body group: Emerald Green
          mat.opacity = 0.75;
          mesh.scale.set(1.1, 1.1, 1.1);
        } else if (isHighRisk) {
          mat.color.setHex(0xef4444); // High sport injury risk: Crimson Red
          mat.opacity = 0.55;
          mesh.scale.set(0.95, 0.95, 0.95);
        } else {
          mat.color.setHex(0x64748b); // Idle: Sleek Slate
          mat.opacity = 0.40;
          mesh.scale.set(0.85, 0.85, 0.85);
        }
      });
    });
  }, [selectedPart, selectedSpecificMuscle, hoveredMuscle, sport, allMusclesList]);

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
      targetRotationXRef.current = Math.max(
        -0.45,
        Math.min(0.45, targetRotationXRef.current + deltaY * 0.008)
      );
      prevMouseXRef.current = e.clientX;
      prevMouseYRef.current = e.clientY;
    } else {
      const hits = getIntersections(e.clientX, e.clientY);
      if (hits.length > 0) {
        const u = hits[0].object.userData;
        if (u?.specificKey) {
          setHoveredMuscle({
            key: u.specificKey,
            parentZone: u.parentZone,
            nameZh: u.nameZh,
            nameEn: u.nameEn,
          });
          return;
        }
      }
      setHoveredMuscle(null);
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
      if (hits.length > 0) {
        const u = hits[0].object.userData;
        if (u?.specificKey && u?.parentZone) {
          if (onSelectSpecificMuscle) {
            onSelectSpecificMuscle(u.specificKey, u.parentZone);
          } else {
            onSelectPart(u.parentZone, u.specificKey);
          }
        }
      }
    }

    isDraggingRef.current = false;
  };

  const setPresetAngle = (view: "FRONT" | "BACK" | "SIDE") => {
    setAutoRotate(false);
    setCurrentAngleView(view);
    if (view === "FRONT") targetRotationYRef.current = 0;
    if (view === "BACK") targetRotationYRef.current = Math.PI;
    if (view === "SIDE") targetRotationYRef.current = Math.PI / 2;
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
              { id: "FRONT", label: "正面 FRONT" },
              { id: "BACK", label: "背面 BACK" },
              { id: "SIDE", label: "侧面 PROFILE" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPresetAngle(item.id)}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
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
          <span>360° 拖拽自由旋转 · 点击具体肌肉光标</span>
        </div>

        {/* Live Hover Tag */}
        {hoveredMuscle && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none px-3.5 py-1.5 rounded-full bg-[#181E29]/95 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow-xl flex items-center space-x-1.5 backdrop-blur-sm whitespace-nowrap">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>{hoveredMuscle.nameZh}</span>
          </div>
        )}
      </div>

      {/* 2D Anatomical Contoured Vector Map */}
      {viewMode === "2D" && (
        <div className="relative w-full max-w-[360px] aspect-[360/540] rounded-xl overflow-hidden bg-radial from-[#18212D]/80 to-[#0A0D14] border border-white/[0.08] p-3 my-2 flex flex-col justify-between select-none">
          <div className="flex items-center justify-around text-[10px] font-mono text-stone-400 font-bold border-b border-white/[0.08] pb-1.5">
            <span>[ 正面肌肉群 · ANTERIOR ]</span>
            <span>[ 背面肌肉群 · POSTERIOR ]</span>
          </div>

          <svg viewBox="0 0 360 480" className="w-full h-full">
            {/* FRONT (Anterior) Group */}
            <g transform="translate(10, 10)">
              {/* Head Outline */}
              <circle cx="80" cy="40" r="22" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />

              {/* Upper Trapezius / Neck */}
              <path
                d="M 64 62 L 72 60 L 88 60 L 96 62 L 102 74 L 58 74 Z"
                fill={selectedPart === "neck" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("neck", "trapezius_upper")}
              >
                <title>颈椎与上斜方肌</title>
              </path>

              {/* Deltoids (Shoulders Anterior) */}
              <path
                d="M 52 74 Q 38 85 36 104 Q 46 102 52 90 Z"
                fill={selectedPart === "shoulders" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("shoulders", "deltoid_anterior")}
              >
                <title>三角肌前束 (左)</title>
              </path>
              <path
                d="M 108 74 Q 122 85 124 104 Q 114 102 108 90 Z"
                fill={selectedPart === "shoulders" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("shoulders", "deltoid_anterior")}
              >
                <title>三角肌前束 (右)</title>
              </path>

              {/* Chest (Pectoralis Major) */}
              <path
                d="M 54 76 Q 80 80 106 76 Q 106 106 80 114 Q 54 106 54 76 Z"
                fill={selectedPart === "chest" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("chest", "pectoralis_major")}
              >
                <title>胸大肌 (Pectoralis Major)</title>
              </path>

              {/* Core / Rectus Abdominis */}
              <path
                d="M 60 116 Q 80 115 100 116 L 96 172 Q 80 174 64 172 Z"
                fill={selectedPart === "core" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("core", "rectus_abdominis")}
              >
                <title>腹直肌与核心肌群</title>
              </path>

              {/* Groin / Adductors (Anterior) */}
              <polygon
                points="66,174 94,174 80,208"
                fill={selectedPart === "groin" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("groin", "adductor_longus")}
              >
                <title>长收肌与腹股沟 (Adductors)</title>
              </polygon>

              {/* Quads: Rectus Femoris, Vastus Lateralis & Medialis */}
              {/* Left Quad Outer / Mid */}
              <path
                d="M 50 210 Q 42 245 48 290 Q 64 290 68 280 Q 72 235 66 210 Z"
                fill={selectedPart === "quads" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("quads", "rectus_femoris")}
              >
                <title>大腿前侧股四头肌 (股直肌/外侧肌)</title>
              </path>
              {/* Right Quad Outer / Mid */}
              <path
                d="M 110 210 Q 118 245 112 290 Q 96 290 92 280 Q 88 235 94 210 Z"
                fill={selectedPart === "quads" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("quads", "rectus_femoris")}
              >
                <title>大腿前侧股四头肌 (股直肌/外侧肌)</title>
              </path>

              {/* Knees & Patellar Tendon */}
              <circle
                cx="58"
                cy="302"
                r="9"
                fill={selectedPart === "knees" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("knees", "patellar_tendon")}
              >
                <title>膝关节髌腱 (Patellar Tendon)</title>
              </circle>
              <circle
                cx="102"
                cy="302"
                r="9"
                fill={selectedPart === "knees" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("knees", "patellar_tendon")}
              >
                <title>膝关节髌腱 (Patellar Tendon)</title>
              </circle>

              {/* Shins (Tibialis Anterior) */}
              <path
                d="M 52 316 Q 48 355 52 395 L 62 395 Q 64 355 64 316 Z"
                fill={
                  selectedPart === "calves" && selectedSpecificMuscle === "tibialis_anterior"
                    ? "#F59E0B"
                    : selectedPart === "calves"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("calves", "tibialis_anterior")}
              >
                <title>胫骨前肌 (Tibialis Anterior)</title>
              </path>
              <path
                d="M 108 316 Q 112 355 108 395 L 98 395 Q 96 355 96 316 Z"
                fill={
                  selectedPart === "calves" && selectedSpecificMuscle === "tibialis_anterior"
                    ? "#F59E0B"
                    : selectedPart === "calves"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("calves", "tibialis_anterior")}
              >
                <title>胫骨前肌 (Tibialis Anterior)</title>
              </path>

              {/* Ankles / ATFL (Anterior) */}
              <circle
                cx="56"
                cy="410"
                r="7"
                fill={selectedPart === "ankles" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("ankles", "atfl")}
              >
                <title>距腓前韧带 (ATFL / 踝关节)</title>
              </circle>
              <circle
                cx="104"
                cy="410"
                r="7"
                fill={selectedPart === "ankles" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("ankles", "atfl")}
              >
                <title>距腓前韧带 (ATFL / 踝关节)</title>
              </circle>
            </g>

            {/* BACK (Posterior) Group */}
            <g transform="translate(190, 10)">
              {/* Head Outline */}
              <circle cx="80" cy="40" r="22" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />

              {/* Upper Back / Trapezius / Shoulders Infraspinatus */}
              <path
                d="M 52 74 Q 80 82 108 74 L 118 106 Q 80 114 42 106 Z"
                fill={selectedPart === "shoulders" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("shoulders", "infraspinatus")}
              >
                <title>肩袖冈下肌与小圆肌 (Infraspinatus)</title>
              </path>

              {/* Lower Back (Erector Spinae & QL) */}
              <path
                d="M 54 116 Q 80 114 106 116 L 102 168 Q 80 170 58 168 Z"
                fill={selectedPart === "lower_back" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("lower_back", "erector_spinae")}
              >
                <title>竖脊肌与腰方肌 (Lower Back)</title>
              </path>

              {/* Glutes (Gluteus Maximus & Medius) */}
              <path
                d="M 48 170 Q 80 166 112 170 Q 116 208 80 216 Q 44 208 48 170 Z"
                fill={selectedPart === "glutes" ? "#F59E0B" : "#334155"}
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("glutes", "glute_maximus")}
              >
                <title>臀大肌与臀中肌 (Gluteus)</title>
              </path>

              {/* Hamstrings: Biceps Femoris (Outer) & Semitendinosus (Inner) */}
              {/* Left Hamstring (Outer: Biceps Femoris) */}
              <path
                d="M 48 218 Q 40 255 48 290 L 64 290 Q 68 255 64 218 Z"
                fill={
                  selectedPart === "hamstrings" && selectedSpecificMuscle === "biceps_femoris"
                    ? "#F59E0B"
                    : selectedPart === "hamstrings"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("hamstrings", "biceps_femoris")}
              >
                <title>股二头肌长头 (外侧腘绳肌)</title>
              </path>
              {/* Left Hamstring (Inner: Semitendinosus) */}
              <path
                d="M 64 218 Q 68 255 64 290 L 76 290 Q 74 255 72 218 Z"
                fill={
                  selectedPart === "hamstrings" && selectedSpecificMuscle === "semitendinosus"
                    ? "#F59E0B"
                    : selectedPart === "hamstrings"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("hamstrings", "semitendinosus")}
              >
                <title>半腱肌/半膜肌 (内侧腘绳肌)</title>
              </path>

              {/* Right Hamstring (Inner: Semitendinosus) */}
              <path
                d="M 88 218 Q 86 255 88 290 L 96 290 Q 94 255 96 218 Z"
                fill={
                  selectedPart === "hamstrings" && selectedSpecificMuscle === "semitendinosus"
                    ? "#F59E0B"
                    : selectedPart === "hamstrings"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("hamstrings", "semitendinosus")}
              >
                <title>半腱肌/半膜肌 (内侧腘绳肌)</title>
              </path>
              {/* Right Hamstring (Outer: Biceps Femoris) */}
              <path
                d="M 96 218 Q 94 255 96 290 L 112 290 Q 120 255 112 218 Z"
                fill={
                  selectedPart === "hamstrings" && selectedSpecificMuscle === "biceps_femoris"
                    ? "#F59E0B"
                    : selectedPart === "hamstrings"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("hamstrings", "biceps_femoris")}
              >
                <title>股二头肌长头 (外侧腘绳肌)</title>
              </path>

              {/* Calves: Gastrocnemius Medial/Lateral & Soleus */}
              <path
                d="M 48 306 Q 40 345 50 380 L 72 380 Q 74 345 68 306 Z"
                fill={
                  selectedPart === "calves" && selectedSpecificMuscle === "gastrocnemius_medial"
                    ? "#F59E0B"
                    : selectedPart === "calves"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("calves", "gastrocnemius_medial")}
              >
                <title>腓肠肌与比目鱼肌 (左)</title>
              </path>
              <path
                d="M 112 306 Q 120 345 110 380 L 88 380 Q 86 345 92 306 Z"
                fill={
                  selectedPart === "calves" && selectedSpecificMuscle === "gastrocnemius_medial"
                    ? "#F59E0B"
                    : selectedPart === "calves"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("calves", "gastrocnemius_medial")}
              >
                <title>腓肠肌与比目鱼肌 (右)</title>
              </path>

              {/* Achilles Tendon */}
              <rect
                x="56"
                y="386"
                width="8"
                height="22"
                rx="2"
                fill={
                  selectedPart === "calves" && selectedSpecificMuscle === "achilles_tendon"
                    ? "#F59E0B"
                    : selectedPart === "calves"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("calves", "achilles_tendon")}
              >
                <title>跟腱复合体 (Achilles Tendon)</title>
              </rect>
              <rect
                x="96"
                y="386"
                width="8"
                height="22"
                rx="2"
                fill={
                  selectedPart === "calves" && selectedSpecificMuscle === "achilles_tendon"
                    ? "#F59E0B"
                    : selectedPart === "calves"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("calves", "achilles_tendon")}
              >
                <title>跟腱复合体 (Achilles Tendon)</title>
              </rect>

              {/* Plantar Fascia */}
              <ellipse
                cx="60"
                cy="420"
                rx="9"
                ry="5"
                fill={
                  selectedPart === "ankles" && selectedSpecificMuscle === "plantar_fascia"
                    ? "#F59E0B"
                    : selectedPart === "ankles"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("ankles", "plantar_fascia")}
              >
                <title>足底筋膜 (Plantar Fascia)</title>
              </ellipse>
              <ellipse
                cx="100"
                cy="420"
                rx="9"
                ry="5"
                fill={
                  selectedPart === "ankles" && selectedSpecificMuscle === "plantar_fascia"
                    ? "#F59E0B"
                    : selectedPart === "ankles"
                    ? "#10B981"
                    : "#334155"
                }
                className="cursor-pointer hover:opacity-80 transition-colors"
                onClick={() => onSelectPart("ankles", "plantar_fascia")}
              >
                <title>足底筋膜 (Plantar Fascia)</title>
              </ellipse>
            </g>
          </svg>
        </div>
      )}

      {/* Active Specific Muscle Summary Footer Badge */}
      <div className="w-full mt-3 p-2.5 rounded-xl bg-[#181E29] border border-white/[0.08] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-stone-300 font-bold">
              {activeMuscleObj?.nameZh || ANATOMY_DATABASE[selectedPart]?.nameZh}
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              {activeMuscleObj?.nameEn || ANATOMY_DATABASE[selectedPart]?.nameEn}
            </span>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-bold">
          {activeMuscleObj ? "SPECIFIC PART" : "BODY ZONE"}
        </span>
      </div>
    </div>
  );
}
