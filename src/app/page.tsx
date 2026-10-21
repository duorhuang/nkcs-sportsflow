"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Shield,
  BookOpen,
  CalendarDays,
  Activity,
  Trophy,
  Users,
  ArrowRight,
  LogOut,
  User,
  Globe,
  Award,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import * as THREE from "three";

export default function SportsPortalPage() {
  const router = useRouter();
  const { user, logout, locale, setLocale, setSport } = useApp();
  const isZh = locale === "zh";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTabSport, setActiveTabSport] = useState<"FOOTBALL" | "VOLLEYBALL" | "BASKETBALL">("FOOTBALL");

  // 3D Interactive Sports Equipment Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.6);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfef08a, 2.5);
    keyLight.position.set(3, 3, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-3, 1, -3);
    scene.add(rimLight);

    // Dynamic Ball Group
    const ballGroup = new THREE.Group();
    scene.add(ballGroup);

    // 1. Procedural 3D Football Mesh
    const footballGeo = new THREE.IcosahedronGeometry(0.9, 3);
    const footballMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.28,
      metalness: 0.1,
    });
    const footballMesh = new THREE.Mesh(footballGeo, footballMat);

    // 2. Procedural 3D Basketball Mesh
    const basketballGeo = new THREE.SphereGeometry(0.92, 32, 32);
    const basketballMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      roughness: 0.45,
      metalness: 0.05,
    });
    const basketballMesh = new THREE.Mesh(basketballGeo, basketballMat);

    // 3. Procedural 3D Volleyball Mesh
    const volleyballGeo = new THREE.SphereGeometry(0.91, 32, 32);
    const volleyballMat = new THREE.MeshStandardMaterial({
      color: 0xe0e7ff,
      roughness: 0.35,
      metalness: 0.08,
    });
    const volleyballMesh = new THREE.Mesh(volleyballGeo, volleyballMat);

    ballGroup.add(footballMesh);

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      ballGroup.rotation.y += 0.008;
      ballGroup.rotation.x += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvas || !renderer || !camera) return;
      const w = canvas.clientWidth || 320;
      const h = canvas.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, [activeTabSport]);

  const sportsChannels = [
    {
      key: "FOOTBALL",
      path: "/football",
      icon: "⚽",
      nameZh: "足球校队专区",
      nameEn: "Varsity Football Channel",
      coachZh: "Marcus Evans (主教练)",
      coachEn: "Head Coach: Marcus Evans",
      formationZh: "4-3-3 压迫防反 · 肋部直塞与弧线套边",
      formationEn: "4-3-3 High Press · Half-space Overlap",
      accentBg: "from-[#081F15] via-[#0C2B1D] to-[#06140E]",
      borderColor: "border-emerald-600/40 hover:border-emerald-500",
      badgeColor: "bg-emerald-950/90 text-emerald-300 border-emerald-600/60",
      tacticsCountZh: "3套阶段式战术宝典",
      tacticsCountEn: "3 Phased Tactical Playbooks",
    },
    {
      key: "VOLLEYBALL",
      path: "/volleyball",
      icon: "🏐",
      nameZh: "排球校队专区",
      nameEn: "Varsity Volleyball Channel",
      coachZh: "Kenji Takahashi 高桥健司 (主教练)",
      coachEn: "Head Coach: Kenji Takahashi",
      formationZh: "5-1 进攻掩护 · 6大轮转位与双人拦网",
      formationEn: "5-1 Rotation · Dual Block & Quick Attacks",
      accentBg: "from-[#23150C] via-[#2F1D11] to-[#150B06]",
      borderColor: "border-amber-600/40 hover:border-amber-500",
      badgeColor: "bg-amber-950/90 text-amber-300 border-amber-600/60",
      tacticsCountZh: "5-1 攻防轮转白皮书",
      tacticsCountEn: "5-1 Rotation Strategy",
    },
    {
      key: "BASKETBALL",
      path: "/basketball",
      icon: "🏀",
      nameZh: "篮球校队专区",
      nameEn: "Varsity Basketball Channel",
      coachZh: "David Sterling (主教练)",
      coachEn: "Head Coach: David Sterling",
      formationZh: "1-2-2 高位挡拆顺下 · 突分底角与转换快攻",
      formationEn: "1-2-2 Pick & Roll · Drive & Kick Finish",
      accentBg: "from-[#1F120A] via-[#2B170B] to-[#120904]",
      borderColor: "border-orange-600/40 hover:border-orange-500",
      badgeColor: "bg-orange-950/90 text-orange-300 border-orange-600/60",
      tacticsCountZh: "1-2-2 半场战术攻防",
      tacticsCountEn: "1-2-2 Half-court Playbook",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D12] text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950">
      {/* ================= 1. TOP HEADER & BILINGUAL NAVIGATION ================= */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Classical Emblem */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-[#140D05] border border-amber-500/50 flex items-center justify-center shadow-lg p-0.5">
              <img
                src="/assets/crests/nkcs-football-crest.svg"
                alt="NKCS Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-black tracking-wider text-base sm:text-lg text-amber-300 uppercase">
                  NKCS SPORTSFLOW
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                  PORTAL 大厅
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {isZh
                  ? "校级代表队战术传承与综合竞技中心"
                  : "Varsity Athletics Tactical & Performance Hub"}
              </p>
            </div>
          </div>

          {/* Right Tools: Language & User State */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs font-bold text-amber-300 border border-white/10 transition-colors"
              title="切换中英文 / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{locale === "zh" ? "🇨🇳 中文 / English" : "🇬🇧 English / 中文"}</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold">{isZh ? user.nameZh : user.nameEn}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    {user.role === "ADMIN" ? (isZh ? "总监" : "ADMIN") : (isZh ? "教练" : "COACH")}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold transition-all shadow-sm"
                  title="退出当前账号 / Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isZh ? "退出登录 / Sign Out" : "Sign Out"}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-md flex items-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isZh ? "教练 / 队员登录 · Log In" : "Log In"}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= 2. HERO PORTAL & 3D HARDWARE BANNER ================= */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12 flex-1 w-full flex flex-col justify-center space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-600/50 text-amber-300 text-xs font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isZh
                ? "3 大校级运动代表队 · 独立战术白皮书与 3D 解剖康复体系"
                : "3 Varsity Teams · Phased Tactical Playbooks & 3D Anatomy"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-white">
            {isZh ? "选择队伍专区 · 进入战术推演" : "Select Varsity Channel · Enter Tactics"}
          </h1>
          <p className="text-sm sm:text-base text-stone-400 font-medium">
            {isZh
              ? "支持外教与国内队员协同查看，具备直观跑位残影、贝塞尔弧线传跑、3D 肌肉疲劳探针与分步演练。"
              : "Bilingual platform for foreign head coaches and student-athletes, featuring ghost motion trails, curved trajectories, and 3D muscular recovery."}
          </p>
        </div>

        {/* ================= 3. THREE SPORT VARSITY CHANNELS (CARDS) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {sportsChannels.map((ch) => (
            <div
              key={ch.key}
              className={`rounded-2xl bg-gradient-to-b ${ch.accentBg} border ${ch.borderColor} p-6 shadow-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-500/10 group`}
            >
              <div className="space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-3xl p-2 rounded-xl bg-black/40 border border-white/10 group-hover:scale-110 transition-transform">
                    {ch.icon}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${ch.badgeColor}`}>
                    {isZh ? ch.tacticsCountZh : ch.tacticsCountEn}
                  </span>
                </div>

                {/* Channel Title */}
                <div>
                  <h3 className="text-xl font-serif font-black text-white group-hover:text-amber-300 transition-colors">
                    {ch.nameZh}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">{ch.nameEn}</p>
                </div>

                {/* Coach & Core Tactics */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 text-stone-200">
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold">{isZh ? ch.coachZh : ch.coachEn}</span>
                  </div>
                  <div className="flex items-start space-x-2 text-stone-300">
                    <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>{isZh ? ch.formationZh : ch.formationEn}</span>
                  </div>
                </div>

                {/* Submodules Quick Links */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href={`${ch.path}/tactics`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300 hover:text-white flex items-center space-x-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isZh ? "战术宝典" : "Tactics"}</span>
                  </Link>
                  <Link
                    href={`${ch.path}/recovery`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300 hover:text-white flex items-center space-x-1.5 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isZh ? "3D 肌肉康复" : "3D Recovery"}</span>
                  </Link>
                  <Link
                    href={`${ch.path}/schedule`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300 hover:text-white flex items-center space-x-1.5 transition-colors"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isZh ? "训练计划" : "Training"}</span>
                  </Link>
                  <Link
                    href={`${ch.path}/squad`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300 hover:text-white flex items-center space-x-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isZh ? "队伍名册" : "Roster"}</span>
                  </Link>
                </div>
              </div>

              {/* Enter Button */}
              <div className="pt-6">
                <Link
                  href={ch.path}
                  onClick={() => setSport(ch.key as any)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-stone-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-white/10 group-hover:border-amber-400"
                >
                  <span>{isZh ? `进入${ch.nameZh} · 进入主页` : `Enter ${ch.nameEn}`}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ================= 4. ROLE ARCHITECTURE GUIDE (ADMIN VS ATHLETE) ================= */}
        <div className="p-6 rounded-2xl bg-[#121620] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-white/10">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-black text-base sm:text-lg text-white">
              {isZh ? "管理端 (Admin/Coach) 与 队员端 (Athlete) 权限与功能定位" : "Role Architecture & Permissions"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-300">
            {/* Coach & Admin Card */}
            <div className="p-4 rounded-xl bg-black/40 border border-emerald-600/30 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                <span>🛡️ 主教练 / 管理员端 (Coach & Admin Mode)</span>
              </div>
              <p className="text-stone-400">
                {isZh
                  ? "拥有全权战术创编与排布权限：可自由添加/拖动球员防守人、拉出贝塞尔弧线跑动、一键部署 4-3-3 / 5-1 / 1-2-2 阵型、分步拆解 1-2-3 战术阶段、为每个队员指派战术跑位职责，下发每日训练科目与审批伤病报告。"
                  : "Full tactical authoring authority: add/move tokens, draw bezier pass/run arcs, deploy formations, orchestrate 1-2-3 tactical phases, assign athlete duties, and publish drills."}
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                <Link
                  href="/login"
                  className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 font-bold"
                >
                  {isZh ? "⚽ 足球教练 (football)" : "Football Coach"}
                </Link>
                <Link
                  href="/login"
                  className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-300 font-bold"
                >
                  {isZh ? "🏐 排球教练 (volleyball)" : "Volleyball Coach"}
                </Link>
                <Link
                  href="/login"
                  className="px-2.5 py-1 rounded bg-orange-950/80 hover:bg-orange-900 border border-orange-600/60 text-orange-300 font-bold"
                >
                  {isZh ? "🏀 篮球教练 (basketball)" : "Basketball Coach"}
                </Link>
                <Link
                  href="/login"
                  className="px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-600/60 text-purple-300 font-bold"
                >
                  {isZh ? "🛡️ 体育总监 (admin)" : "Director Admin"}
                </Link>
              </div>
            </div>

            {/* Athlete Card */}
            <div className="p-4 rounded-xl bg-black/40 border border-sky-600/30 space-y-2">
              <div className="flex items-center space-x-2 text-sky-300 font-bold text-sm">
                <span>🏃 队员端 · 专属战术自查与 3D 自愈 (Athlete Centric View)</span>
              </div>
              <p className="text-stone-400">
                {isZh
                  ? "以队员个人视角为主：进入战术板自动聚焦我的球衣号码（聚光灯高亮），查看“我的本阶段跑位任务与动向”，通过上一阶段残影一眼读懂跑动路线；在 3D 肌肉解剖图谱上旋转自查疲劳酸痛点，获取专属物理治疗康复方案。"
                  : "Player-first view: tactical spotlight highlights your personal jersey number, displays your specific phase assignments with ghost trace trails, and lets you rotate the 3D musculoskeletal visualizer to report injury."}
              </p>
              <div className="pt-2">
                <Link
                  href="/football/tactics"
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-600/60 text-sky-300 font-bold"
                >
                  <span>{isZh ? "体验队员战术沙盘自查 · Athlete Sandbox" : "Experience Athlete Sandbox"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= 5. FOOTER ================= */}
      <footer className="border-t border-white/10 bg-black/60 px-4 lg:px-8 py-5 text-center text-xs text-stone-500">
        <p>© 2026 NKCS SportsFlow · Confidential Varsity Tactics & Training Hub · 双语体育竞技平台</p>
      </footer>
    </div>
  );
}
