"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel, TrainingPlanData, PlayerProfileData } from "@/types";
import DrillCard from "@/components/drill/DrillCard";
import PlayerCard from "@/components/player/PlayerCard";
import {
  Zap,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Shield,
  Activity,
  BookOpen,
  Users,
  Trophy,
  Sparkles,
  Flame,
} from "lucide-react";

export default function ChannelDashboard() {
  const params = useParams();
  const currentSportParam = (params.sport as string)?.toUpperCase() as SportChannel;
  const { locale, user, t } = useApp();
  const isZh = locale === "zh";

  const [trainingPlan, setTrainingPlan] = useState<TrainingPlanData | null>(null);
  const [featuredPlayers, setFeaturedPlayers] = useState<PlayerProfileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Fetch latest training plan
        const planRes = await fetch(`/api/training-plans?sport=${currentSportParam}`);
        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData.plans && planData.plans.length > 0) {
            setTrainingPlan(planData.plans[0]);
          } else {
            setTrainingPlan(null);
          }
        }

        // Fetch players for preview
        const playerRes = await fetch(`/api/players?sport=${currentSportParam}`);
        if (playerRes.ok) {
          const playerData = await playerRes.json();
          setFeaturedPlayers(playerData.profiles?.slice(0, 4) || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (currentSportParam) {
      loadDashboardData();
    }
  }, [currentSportParam]);

  // Find user's profile in this sport to display personalized "My Duties"
  const myProfile = user?.playerProfiles?.find(
    (p) => p.sport.toUpperCase() === currentSportParam
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ================= 1. 训前 5 分钟极速确认核心大卡 (Pre-Practice Ritual Card) ================= */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/80 via-black/60 to-black/90 border border-heritage-gold/30 p-6 md:p-8 shadow-frameGold">
        {/* Subtle background glow & Heraldic Crest Watermark */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-heritage-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-52 h-52 opacity-20 pointer-events-none hidden md:block">
          <img
            src={`/assets/crests/nkcs-${currentSportParam.toLowerCase()}-crest.svg`}
            alt="Collegiate Crest"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isZh ? "今日训前 5 分钟速览" : "Today's 5-Minute Brief"}</span>
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {new Date().toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white">
              {trainingPlan
                ? isZh ? trainingPlan.titleZh : trainingPlan.titleEn
                : isZh ? "今日训练安排更新中" : "Training Session Scheduled"}
            </h1>

            {/* Time & Location Chips */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
              <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {trainingPlan?.startTime && trainingPlan?.endTime
                    ? `${trainingPlan.startTime} - ${trainingPlan.endTime}`
                    : "16:30 - 18:30"}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {trainingPlan?.location || (isZh ? "NKCS 校队主球馆 / 2号草坪" : "Main Arena / Pitch 2")}
                </span>
              </div>
            </div>

            {/* Personalized "My Duties" Spotlight for Athletes */}
            {myProfile && (
              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-black/50 to-transparent border border-emerald-500/30 flex items-start space-x-3">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>{isZh ? "我的今日战术点位 (My Duties)" : "My Tactical Duties"}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] text-emerald-200">
                      #{myProfile.jerseyNumber} {myProfile.primaryPosition}
                    </span>
                  </h4>
                  <p className="text-xs text-gray-200 mt-1 leading-relaxed">
                    {isZh
                      ? `你在今日训练中担任【${myProfile.positionGroup || "核心位置"}】协同枢纽，重点注意退防速度与由守转攻的第一时间出球！`
                      : `You are assigned to [${myProfile.positionGroup || "Key Unit"}]. Focus on defensive drop speed and rapid forward distribution.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Button Box */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href={`/${currentSportParam.toLowerCase()}/schedule`}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-heritage-gold via-heritage-antiqueGold to-heritage-brass text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center space-x-2 shadow-md"
            >
              <span>{isZh ? "查看完整科目与参数" : "View Full Practice Drills"}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              href={`/${currentSportParam.toLowerCase()}/recovery`}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold transition-all flex items-center justify-center space-x-2"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{isZh ? "训前动态激活指引" : "Dynamic Warmup Guide"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 2. 今日训练课高级动作卡片流 (Precision Drill Cards) ================= */}
      {trainingPlan && trainingPlan.drills && trainingPlan.drills.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-black tracking-wide text-white flex items-center space-x-2">
                <span>{isZh ? "今日精确训练科目" : "Today's Structured Drills"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-sans font-semibold">
                  {trainingPlan.drills.length} {isZh ? "个科目" : "Drills"}
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh ? "教练端精细时间表 · 场地规格 · 核心原则" : "Coaching timeline · Pitch specs · Key cues"}
              </p>
            </div>

            <Link
              href={`/${currentSportParam.toLowerCase()}/schedule`}
              className="text-xs font-semibold text-heritage-antiqueGold hover:text-heritage-gold flex items-center space-x-1 transition-colors"
            >
              <span>{isZh ? "管理与周历" : "Weekly Schedule"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {trainingPlan.drills.map((drill, idx) => (
              <DrillCard key={drill.id} drill={drill} index={idx + 1} />
            ))}
          </div>
        </section>
      )}

      {/* ================= 3. 球队竞技三大模块直达 (Hub Quick Tiles) ================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tactics Playbook Tile */}
        <Link
          href={`/${currentSportParam.toLowerCase()}/tactics`}
          className="group p-5 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/40 shadow-chiseled transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              {isZh ? "战术白皮书宝典" : "Tactics Playbook"}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isZh
                ? "校队经典传世战术、交互式平滑推演、阶段走位与多维标签检索。"
                : "Enduring tactical asset library, interactive 2D animation, and phased keyframing."}
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-1 text-xs font-bold text-emerald-400">
            <span>{isZh ? "进入推演大厅" : "Explore Tactics"}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 3D Recovery Tile */}
        <Link
          href={`/${currentSportParam.toLowerCase()}/recovery`}
          className="group p-5 rounded-xl bg-black/40 border border-white/10 hover:border-blue-500/40 shadow-chiseled transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
              {isZh ? "3D 身体康复白皮书" : "3D Recovery Guide"}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isZh
                ? "精细 3D 人体肌群模型、动态/静态拉伸、筋膜枪/刀与零成本替代方案。"
                : "3D interactive muscle visualizer, dynamic/static stretching, and zero-cost home substitutes."}
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-1 text-xs font-bold text-blue-400">
            <span>{isZh ? "开启人体图谱" : "Interactive Body"}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Squad & Hall of Fame Tile */}
        <Link
          href={`/${currentSportParam.toLowerCase()}/squad`}
          className="group p-5 rounded-xl bg-black/40 border border-white/10 hover:border-heritage-gold/40 shadow-chiseled transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-heritage-gold/15 border border-heritage-gold/30 flex items-center justify-center text-heritage-gold group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-heritage-gold transition-colors">
              {isZh ? "花名册与名宿名人堂" : "Squad & Hall of Fame"}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isZh
                ? "现役主力阵容、退役名宿骑士盾徽章与毕业校友档案，永不删号。"
                : "Active squad, Hall of Fame knights shield emblems, and permanent alumni legacy."}
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-1 text-xs font-bold text-heritage-gold">
            <span>{isZh ? "浏览队员名单" : "View Squad"}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </section>

      {/* ================= 4. 阵容卡牌速览 (Squad Roster Preview) ================= */}
      {featuredPlayers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-black tracking-wide text-white">
                {isZh ? "校队阵容精选" : "Squad Roster Preview"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh ? "古典相框 · 队长金徽 · 传承名宿" : "Classical frames · Captain crests · Heritage legends"}
              </p>
            </div>
            <Link
              href={`/${currentSportParam.toLowerCase()}/squad`}
              className="text-xs font-semibold text-heritage-antiqueGold hover:text-heritage-gold flex items-center space-x-1 transition-colors"
            >
              <span>{isZh ? "查看全部花名册" : "Full Roster"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {featuredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
