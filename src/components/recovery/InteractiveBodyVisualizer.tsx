"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
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

export default function InteractiveBodyVisualizer({
  sport,
  selectedPart,
  onSelectPart,
}: InteractiveBodyVisualizerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");
  const [hoveredPart, setHoveredPart] = useState<BodyPartKey | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [currentAngleView, setCurrentAngleView] = useState<"FRONT" | "BACK" | "LEFT" | "RIGHT">("FRONT");

  // Sport high-risk parts
  const isHighRiskForSport = (part: BodyPartKey): boolean => {
    if (sport === "FOOTBALL") return ["hamstrings", "groin", "knees", "ankles", "calves"].includes(part);
    if (sport === "VOLLEYBALL") return ["shoulders", "knees", "ankles", "lower_back", "calves"].includes(part);
    if (sport === "BASKETBALL") return ["ankles", "knees", "groin", "lower_back", "calves"].includes(part);
    return false;
  };

  // Internal Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const interactiveMeshesRef = useRef<Map<BodyPartKey, THREE.Mesh[]>>(new Map());
  const reqAnimRef = useRef<number | null>(null);
  const targetRotationYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseXRef = useRef<number>(0);
  const prevMouseYRef = useRef<number>(0);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 560;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 4.3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting (Warm, Natural Athletic Studio)
    const ambientLight = new THREE.AmbientLight(0xf1ede4, 1.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    mainLight.position.set(3, 4, 4);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xc5a059, 1.2);
    rimLight.position.set(-3, -2, -3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.8);
    fillLight.position.set(0, -3, 2);
    scene.add(fillLight);

    // Group to hold full athletic mannequin
    const modelGroup = new THREE.Group();
    modelGroup.position.y = -0.05;
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Map of interactive meshes
    const partMeshes = new Map<BodyPartKey, THREE.Mesh[]>();
    interactiveMeshesRef.current = partMeshes;

    // Helper: Register a mesh to a BodyPartKey
    const registerPartMesh = (mesh: THREE.Mesh, key: BodyPartKey) => {
      mesh.userData = { partKey: key };
      if (!partMeshes.has(key)) {
        partMeshes.set(key, []);
      }
      partMeshes.get(key)!.push(mesh);
      modelGroup.add(mesh);
    };

    // Materials
    // Default athletic mannequin: refined dark slate/charcoal matte finish
    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.5,
      metalness: 0.15,
    });

    const neutralNonInteractiveMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b222d,
      roughness: 0.6,
      metalness: 0.1,
    });

    // ================= 3D ATHLETIC HUMAN ANATOMY GEOMETRIES =================

    // 1. Head (Neutral Non-clickable)
    const headGeo = new THREE.SphereGeometry(0.2, 32, 24);
    headGeo.scale(0.85, 1.1, 0.95);
    const headMesh = new THREE.Mesh(headGeo, neutralNonInteractiveMaterial);
    headMesh.position.set(0, 1.35, 0);
    modelGroup.add(headMesh);

    // 2. Neck & Trapezius (Key: "neck")
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.22, 24);
    const neckMesh = new THREE.Mesh(neckGeo, defaultMaterial.clone());
    neckMesh.position.set(0, 1.12, 0);
    registerPartMesh(neckMesh, "neck");

    // 3. Shoulders (Deltoids - Left & Right, Key: "shoulders")
    const shoulderGeoL = new THREE.SphereGeometry(0.15, 24, 20);
    shoulderGeoL.scale(1.1, 1.3, 1.0);
    const shoulderMeshL = new THREE.Mesh(shoulderGeoL, defaultMaterial.clone());
    shoulderMeshL.position.set(-0.46, 0.92, 0);
    shoulderMeshL.rotation.z = 0.2;
    registerPartMesh(shoulderMeshL, "shoulders");

    const shoulderGeoR = shoulderGeoL.clone();
    const shoulderMeshR = new THREE.Mesh(shoulderGeoR, defaultMaterial.clone());
    shoulderMeshR.position.set(0.46, 0.92, 0);
    shoulderMeshR.rotation.z = -0.2;
    registerPartMesh(shoulderMeshR, "shoulders");

    // 4. Chest (Pectoralis Major, Key: "chest")
    const chestGeo = new THREE.BoxGeometry(0.58, 0.32, 0.24, 4, 4, 4);
    // Bevel front curve
    const chestMesh = new THREE.Mesh(chestGeo, defaultMaterial.clone());
    chestMesh.position.set(0, 0.86, 0.05);
    registerPartMesh(chestMesh, "chest");

    // 5. Core & Abdominals (Key: "core")
    const coreGeo = new THREE.CylinderGeometry(0.26, 0.23, 0.38, 24);
    coreGeo.scale(1.0, 1.0, 0.75);
    const coreMesh = new THREE.Mesh(coreGeo, defaultMaterial.clone());
    coreMesh.position.set(0, 0.54, 0.03);
    registerPartMesh(coreMesh, "core");

    // 6. Lower Back & Lats (Key: "lower_back")
    const backGeo = new THREE.BoxGeometry(0.52, 0.5, 0.22);
    const backMesh = new THREE.Mesh(backGeo, defaultMaterial.clone());
    backMesh.position.set(0, 0.7, -0.06);
    registerPartMesh(backMesh, "lower_back");

    // 7. Groin & Hip Adductors (Key: "groin")
    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.22, 24);
    pelvisGeo.scale(1.1, 1.0, 0.8);
    const groinMesh = new THREE.Mesh(pelvisGeo, defaultMaterial.clone());
    groinMesh.position.set(0, 0.26, 0.0);
    registerPartMesh(groinMesh, "groin");

    // 8. Arms (Biceps, Forearms, Hands - Neutral)
    const bicepGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.32, 16);
    const bicepL = new THREE.Mesh(bicepGeo, neutralNonInteractiveMaterial);
    bicepL.position.set(-0.52, 0.65, 0);
    bicepL.rotation.z = 0.08;
    modelGroup.add(bicepL);

    const bicepR = new THREE.Mesh(bicepGeo, neutralNonInteractiveMaterial);
    bicepR.position.set(0.52, 0.65, 0);
    bicepR.rotation.z = -0.08;
    modelGroup.add(bicepR);

    const forearmGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.34, 16);
    const forearmL = new THREE.Mesh(forearmGeo, neutralNonInteractiveMaterial);
    forearmL.position.set(-0.56, 0.34, 0);
    modelGroup.add(forearmL);

    const forearmR = new THREE.Mesh(forearmGeo, neutralNonInteractiveMaterial);
    forearmR.position.set(0.56, 0.34, 0);
    modelGroup.add(forearmR);

    // 9. Thighs: Front Quads (Key: "quads") & Back Hamstrings (Key: "hamstrings")
    // Left Quads
    const quadGeoL = new THREE.CylinderGeometry(0.14, 0.11, 0.46, 20);
    quadGeoL.scale(0.95, 1.0, 0.85);
    const quadMeshL = new THREE.Mesh(quadGeoL, defaultMaterial.clone());
    quadMeshL.position.set(-0.19, -0.08, 0.04);
    quadMeshL.rotation.z = -0.04;
    registerPartMesh(quadMeshL, "quads");

    // Right Quads
    const quadMeshR = new THREE.Mesh(quadGeoL.clone(), defaultMaterial.clone());
    quadMeshR.position.set(0.19, -0.08, 0.04);
    quadMeshR.rotation.z = 0.04;
    registerPartMesh(quadMeshR, "quads");

    // Left Hamstrings (Back of Thigh)
    const hamGeoL = new THREE.CylinderGeometry(0.13, 0.1, 0.44, 20);
    hamGeoL.scale(0.9, 1.0, 0.8);
    const hamMeshL = new THREE.Mesh(hamGeoL, defaultMaterial.clone());
    hamMeshL.position.set(-0.19, -0.08, -0.04);
    hamMeshL.rotation.z = -0.04;
    registerPartMesh(hamMeshL, "hamstrings");

    // Right Hamstrings (Back of Thigh)
    const hamMeshR = new THREE.Mesh(hamGeoL.clone(), defaultMaterial.clone());
    hamMeshR.position.set(0.19, -0.08, -0.04);
    hamMeshR.rotation.z = 0.04;
    registerPartMesh(hamMeshR, "hamstrings");

    // 10. Knees (Patellar Tendon / Ligaments, Key: "knees")
    const kneeGeoL = new THREE.SphereGeometry(0.105, 20, 16);
    kneeGeoL.scale(1.0, 1.1, 1.05);
    const kneeMeshL = new THREE.Mesh(kneeGeoL, defaultMaterial.clone());
    kneeMeshL.position.set(-0.19, -0.36, 0.02);
    registerPartMesh(kneeMeshL, "knees");

    const kneeMeshR = new THREE.Mesh(kneeGeoL.clone(), defaultMaterial.clone());
    kneeMeshR.position.set(0.19, -0.36, 0.02);
    registerPartMesh(kneeMeshR, "knees");

    // 11. Calves / Gastrocnemius (Key: "calves")
    const calfGeoL = new THREE.CylinderGeometry(0.11, 0.075, 0.44, 20);
    calfGeoL.scale(0.95, 1.0, 1.05);
    const calfMeshL = new THREE.Mesh(calfGeoL, defaultMaterial.clone());
    calfMeshL.position.set(-0.19, -0.64, -0.01);
    registerPartMesh(calfMeshL, "calves");

    const calfMeshR = new THREE.Mesh(calfGeoL.clone(), defaultMaterial.clone());
    calfMeshR.position.set(0.19, -0.64, -0.01);
    registerPartMesh(calfMeshR, "calves");

    // 12. Ankles & Achilles Tendon (Key: "ankles")
    const ankleGeoL = new THREE.CylinderGeometry(0.075, 0.07, 0.18, 16);
    const ankleMeshL = new THREE.Mesh(ankleGeoL, defaultMaterial.clone());
    ankleMeshL.position.set(-0.19, -0.92, 0.0);
    registerPartMesh(ankleMeshL, "ankles");

    const ankleMeshR = new THREE.Mesh(ankleGeoL.clone(), defaultMaterial.clone());
    ankleMeshR.position.set(0.19, -0.92, 0.0);
    registerPartMesh(ankleMeshR, "ankles");

    // Feet (Neutral)
    const footGeo = new THREE.BoxGeometry(0.11, 0.08, 0.24);
    const footL = new THREE.Mesh(footGeo, neutralNonInteractiveMaterial);
    footL.position.set(-0.19, -1.04, 0.06);
    modelGroup.add(footL);

    const footR = new THREE.Mesh(footGeo, neutralNonInteractiveMaterial);
    footR.position.set(0.19, -1.04, 0.06);
    modelGroup.add(footR);

    // Subtle Ground Pedestal
    const baseGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.04, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141a22,
      roughness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -1.08, 0);
    modelGroup.add(baseMesh);

    // ================= RENDER & ANIMATION LOOP =================
    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (modelGroupRef.current) {
        if (autoRotate && !isDraggingRef.current) {
          modelGroupRef.current.rotation.y += 0.008;
          targetRotationYRef.current = modelGroupRef.current.rotation.y;
        } else {
          // Smoothly interpolate towards target rotation
          modelGroupRef.current.rotation.y +=
            (targetRotationYRef.current - modelGroupRef.current.rotation.y) * 0.1;
        }
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

  // Sync Selected & Hovered Muscle Materials
  useEffect(() => {
    const partMeshes = interactiveMeshesRef.current;
    if (!partMeshes) return;

    partMeshes.forEach((meshes, key) => {
      const isSelected = selectedPart === key;
      const isHovered = hoveredPart === key;
      const isHighRisk = isHighRiskForSport(key);

      meshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat) return;

        if (isSelected) {
          // Highlighted recovery focus color: rich athletic amber-crimson with warm glow
          mat.color.setHex(0xd97706);
          mat.emissive.setHex(0xb45309);
          mat.emissiveIntensity = 0.55;
          mat.roughness = 0.3;
        } else if (isHovered) {
          // Gentle hover highlight
          mat.color.setHex(0xc5a059);
          mat.emissive.setHex(0x92400e);
          mat.emissiveIntensity = 0.35;
          mat.roughness = 0.4;
        } else if (isHighRisk) {
          // Subtle high-risk accent tone
          mat.color.setHex(0x334155);
          mat.emissive.setHex(0x78350f);
          mat.emissiveIntensity = 0.2;
          mat.roughness = 0.5;
        } else {
          // Neutral matte slate
          mat.color.setHex(0x222a36);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.5;
        }
      });
    });
  }, [selectedPart, hoveredPart, sport]);

  // ================= RAYCASTING & MOUSE/TOUCH INTERACTION =================
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseCoordRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const getIntersections = (clientX: number, clientY: number): THREE.Intersection[] => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const modelGroup = modelGroupRef.current;
    if (!container || !camera || !modelGroup) return [];

    const rect = container.getBoundingClientRect();
    mouseCoordRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseCoordRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseCoordRef.current, camera);
    return raycasterRef.current.intersectObjects(modelGroup.children, true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    prevMouseXRef.current = e.clientX;
    prevMouseYRef.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevMouseXRef.current;
      targetRotationYRef.current += deltaX * 0.012;
      prevMouseXRef.current = e.clientX;
      prevMouseYRef.current = e.clientY;
    } else {
      // Raycasting for hover feedback
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

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // If not a significant drag, treat as click to select muscle zone
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

  // Quick Preset View Angle Setters
  const setPresetAngle = (view: "FRONT" | "BACK" | "LEFT" | "RIGHT") => {
    setAutoRotate(false);
    setCurrentAngleView(view);
    if (view === "FRONT") targetRotationYRef.current = 0;
    if (view === "BACK") targetRotationYRef.current = Math.PI;
    if (view === "LEFT") targetRotationYRef.current = Math.PI / 2;
    if (view === "RIGHT") targetRotationYRef.current = -Math.PI / 2;
  };

  return (
    <div className="bg-[#141b18] border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col items-center select-none w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between w-full pb-3 border-b border-stone-800/80">
        <div className="flex items-center space-x-2">
          <HeartPulse className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-serif font-black tracking-wide text-stone-200 uppercase">
            {viewMode === "3D" ? "3D 竞技解剖定位仪 (WebGL)" : "2D 人体肌群解剖图谱 (SVG)"}
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* 3D vs 2D Mode Switcher */}
          <div className="flex items-center rounded-lg bg-stone-900 border border-stone-800 p-0.5 text-[11px] font-bold">
            <button
              onClick={() => setViewMode("3D")}
              className={`px-2 py-0.5 rounded-md transition-all ${
                viewMode === "3D"
                  ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              🧊 3D模型
            </button>
            <button
              onClick={() => setViewMode("2D")}
              className={`px-2 py-0.5 rounded-md transition-all ${
                viewMode === "2D"
                  ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              📐 2D图谱
            </button>
          </div>

          {viewMode === "3D" && (
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center space-x-1 ${
                autoRotate
                  ? "bg-amber-700/40 text-amber-300 border border-amber-600/50"
                  : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
              title="360° 自动环绕"
            >
              <RotateCcw className={`w-3 h-3 ${autoRotate ? "animate-spin" : ""}`} />
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
              { id: "FRONT", label: "正面 (Front)" },
              { id: "BACK", label: "背面 (Back)" },
              { id: "LEFT", label: "左侧 (Left)" },
              { id: "RIGHT", label: "右侧 (Right)" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPresetAngle(item.id)}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                currentAngleView === item.id && !autoRotate
                  ? "bg-stone-200 text-stone-900 font-bold shadow-sm"
                  : "bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800/60"
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
        style={{ display: viewMode === "3D" ? "flex" : "none" }}
        className="relative w-full max-w-[360px] aspect-[360/540] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-radial from-[#1e2722]/60 to-[#0e1411] border border-stone-800/70 shadow-inner items-center justify-center"
      >
        {/* Subtle Canvas Watermark & Instruction */}
        <div className="absolute top-3 left-3 pointer-events-none text-[10px] text-stone-400 font-mono flex items-center space-x-1 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
          <Eye className="w-3 h-3 text-amber-500" />
          <span>拖拽自由旋转 · 点击肌群定位</span>
        </div>

        {/* Live Hover Tag */}
        {hoveredPart && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none px-3 py-1 rounded-full bg-stone-900/90 border border-amber-600/50 text-amber-300 text-xs font-bold shadow-lg flex items-center space-x-1.5 backdrop-blur-sm">
            <Crosshair className="w-3.5 h-3.5" />
            <span>{PART_NAMES[hoveredPart].zh}</span>
          </div>
        )}
      </div>

      {/* 2D Anatomical SVG Map Container */}
      {viewMode === "2D" && (
        <div className="relative w-full max-w-[360px] aspect-[360/540] rounded-xl overflow-hidden bg-radial from-[#1a231f]/70 to-[#0a0f0d] border border-stone-800/80 p-3 my-2 flex flex-col justify-between select-none">
          {/* Header labels */}
          <div className="flex items-center justify-around text-[10px] font-mono text-stone-400 font-bold border-b border-stone-800/60 pb-1.5">
            <span>[人体前侧视图 · FRONT]</span>
            <span>[人体后侧视图 · BACK]</span>
          </div>

          <svg viewBox="0 0 360 480" className="w-full h-full">
            {/* FRONT VIEW (x: 0..180) */}
            <g transform="translate(10, 10)">
              {/* Head Silhouette */}
              <circle cx="80" cy="40" r="22" fill="#15201A" stroke="#2D3B32" strokeWidth="1.5" />

              {/* Neck */}
              <rect
                x="68"
                y="64"
                width="24"
                height="18"
                rx="4"
                onClick={() => onSelectPart("neck")}
                onMouseEnter={() => setHoveredPart("neck")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "neck" ? "#C5A059" : hoveredPart === "neck" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "neck" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />

              {/* Shoulders Left & Right */}
              <rect
                x="34"
                y="84"
                width="26"
                height="28"
                rx="6"
                onClick={() => onSelectPart("shoulders")}
                onMouseEnter={() => setHoveredPart("shoulders")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "shoulders" ? "#C5A059" : hoveredPart === "shoulders" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "shoulders" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <rect
                x="100"
                y="84"
                width="26"
                height="28"
                rx="6"
                onClick={() => onSelectPart("shoulders")}
                onMouseEnter={() => setHoveredPart("shoulders")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "shoulders" ? "#C5A059" : hoveredPart === "shoulders" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "shoulders" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />

              {/* Chest */}
              <rect
                x="56"
                y="88"
                width="48"
                height="38"
                rx="6"
                onClick={() => onSelectPart("chest")}
                onMouseEnter={() => setHoveredPart("chest")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "chest" ? "#C5A059" : hoveredPart === "chest" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "chest" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="112" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                胸大肌
              </text>

              {/* Core / Abs */}
              <rect
                x="58"
                y="130"
                width="44"
                height="48"
                rx="6"
                onClick={() => onSelectPart("core")}
                onMouseEnter={() => setHoveredPart("core")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "core" ? "#C5A059" : hoveredPart === "core" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "core" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="158" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                核心腹肌
              </text>

              {/* Groin */}
              <rect
                x="65"
                y="182"
                width="30"
                height="22"
                rx="4"
                onClick={() => onSelectPart("groin")}
                onMouseEnter={() => setHoveredPart("groin")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "groin" ? "#C5A059" : hoveredPart === "groin" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "groin" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="196" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                腹股沟
              </text>

              {/* Quads Left & Right */}
              <rect
                x="48"
                y="210"
                width="28"
                height="92"
                rx="8"
                onClick={() => onSelectPart("quads")}
                onMouseEnter={() => setHoveredPart("quads")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "quads" ? "#C5A059" : hoveredPart === "quads" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "quads" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <rect
                x="84"
                y="210"
                width="28"
                height="92"
                rx="8"
                onClick={() => onSelectPart("quads")}
                onMouseEnter={() => setHoveredPart("quads")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "quads" ? "#C5A059" : hoveredPart === "quads" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "quads" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="258" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                股四头肌
              </text>

              {/* Knees */}
              <circle
                cx="62"
                cy="316"
                r="11"
                onClick={() => onSelectPart("knees")}
                onMouseEnter={() => setHoveredPart("knees")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "knees" ? "#C5A059" : hoveredPart === "knees" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "knees" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <circle
                cx="98"
                cy="316"
                r="11"
                onClick={() => onSelectPart("knees")}
                onMouseEnter={() => setHoveredPart("knees")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "knees" ? "#C5A059" : hoveredPart === "knees" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "knees" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="320" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                膝
              </text>

              {/* Ankles */}
              <rect
                x="52"
                y="410"
                width="20"
                height="18"
                rx="4"
                onClick={() => onSelectPart("ankles")}
                onMouseEnter={() => setHoveredPart("ankles")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "ankles" ? "#C5A059" : hoveredPart === "ankles" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "ankles" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <rect
                x="88"
                y="410"
                width="20"
                height="18"
                rx="4"
                onClick={() => onSelectPart("ankles")}
                onMouseEnter={() => setHoveredPart("ankles")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "ankles" ? "#C5A059" : hoveredPart === "ankles" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "ankles" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
            </g>

            {/* BACK VIEW (x: 180..360) */}
            <g transform="translate(190, 10)">
              {/* Head Silhouette */}
              <circle cx="80" cy="40" r="22" fill="#15201A" stroke="#2D3B32" strokeWidth="1.5" />

              {/* Upper Trapezius / Neck */}
              <rect
                x="66"
                y="64"
                width="28"
                height="22"
                rx="4"
                onClick={() => onSelectPart("neck")}
                onMouseEnter={() => setHoveredPart("neck")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "neck" ? "#C5A059" : hoveredPart === "neck" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "neck" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="78" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                斜方肌
              </text>

              {/* Rear Deltoids */}
              <rect
                x="34"
                y="86"
                width="26"
                height="28"
                rx="6"
                onClick={() => onSelectPart("shoulders")}
                onMouseEnter={() => setHoveredPart("shoulders")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "shoulders" ? "#C5A059" : hoveredPart === "shoulders" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "shoulders" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <rect
                x="100"
                y="86"
                width="26"
                height="28"
                rx="6"
                onClick={() => onSelectPart("shoulders")}
                onMouseEnter={() => setHoveredPart("shoulders")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "shoulders" ? "#C5A059" : hoveredPart === "shoulders" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "shoulders" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />

              {/* Lower Back / Lats */}
              <rect
                x="56"
                y="94"
                width="48"
                height="80"
                rx="8"
                onClick={() => onSelectPart("lower_back")}
                onMouseEnter={() => setHoveredPart("lower_back")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "lower_back" ? "#C5A059" : hoveredPart === "lower_back" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "lower_back" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="136" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                背阔/竖脊肌
              </text>

              {/* Hamstrings Left & Right */}
              <rect
                x="48"
                y="190"
                width="28"
                height="110"
                rx="8"
                onClick={() => onSelectPart("hamstrings")}
                onMouseEnter={() => setHoveredPart("hamstrings")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "hamstrings" ? "#C5A059" : hoveredPart === "hamstrings" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "hamstrings" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <rect
                x="84"
                y="190"
                width="28"
                height="110"
                rx="8"
                onClick={() => onSelectPart("hamstrings")}
                onMouseEnter={() => setHoveredPart("hamstrings")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "hamstrings" ? "#C5A059" : hoveredPart === "hamstrings" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "hamstrings" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="248" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                大腿腘绳肌
              </text>

              {/* Calves Left & Right */}
              <rect
                x="48"
                y="312"
                width="26"
                height="86"
                rx="8"
                onClick={() => onSelectPart("calves")}
                onMouseEnter={() => setHoveredPart("calves")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "calves" ? "#C5A059" : hoveredPart === "calves" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "calves" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <rect
                x="86"
                y="312"
                width="26"
                height="86"
                rx="8"
                onClick={() => onSelectPart("calves")}
                onMouseEnter={() => setHoveredPart("calves")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "calves" ? "#C5A059" : hoveredPart === "calves" ? "#D97706" : "#1E2F26"}
                stroke={selectedPart === "calves" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="358" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                小腿腓肠肌
              </text>

              {/* Ankles / Achilles */}
              <rect
                x="52"
                y="410"
                width="20"
                height="18"
                rx="4"
                onClick={() => onSelectPart("ankles")}
                onMouseEnter={() => setHoveredPart("ankles")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "ankles" ? "#C5A059" : hoveredPart === "ankles" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "ankles" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <rect
                x="88"
                y="410"
                width="20"
                height="18"
                rx="4"
                onClick={() => onSelectPart("ankles")}
                onMouseEnter={() => setHoveredPart("ankles")}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer transition-colors"
                fill={selectedPart === "ankles" ? "#C5A059" : hoveredPart === "ankles" ? "#D97706" : "#1B2A22"}
                stroke={selectedPart === "ankles" ? "#FDE68A" : "#394D40"}
                strokeWidth="1.5"
              />
              <text x="80" y="423" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                跟腱
              </text>
            </g>
          </svg>
        </div>
      )}

      {/* Currently Selected Anatomical Zone Card */}
      <div className="w-full mt-3 p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-400 font-bold text-xs">
            {selectedPart.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-stone-100">
                {PART_NAMES[selectedPart].zh}
              </span>
              {isHighRiskForSport(selectedPart) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-800/50 font-semibold flex items-center space-x-0.5">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  <span>高发痛点</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 font-mono">
              {PART_NAMES[selectedPart].en}
            </p>
          </div>
        </div>

        <span className="text-[11px] text-amber-400 font-medium">已锁定痛点</span>
      </div>

      {/* Quick Muscle Selector Pills */}
      <div className="w-full mt-2.5 pt-2 border-t border-stone-800/80">
        <span className="text-[10px] text-stone-400 font-semibold tracking-wider uppercase block mb-1.5">
          快速部位直达 (QUICK SELECT)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PART_NAMES) as BodyPartKey[]).map((key) => {
            const isSelected = selectedPart === key;
            const isHigh = isHighRiskForSport(key);
            return (
              <button
                key={key}
                onClick={() => onSelectPart(key)}
                className={`text-[11px] px-2 py-0.5 rounded transition-all ${
                  isSelected
                    ? "bg-amber-600 text-stone-950 font-bold shadow-sm"
                    : isHigh
                    ? "bg-stone-800/80 text-amber-200/90 hover:bg-stone-700 border border-amber-900/40"
                    : "bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800"
                }`}
              >
                {PART_NAMES[key].zh.split(" / ")[0]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
