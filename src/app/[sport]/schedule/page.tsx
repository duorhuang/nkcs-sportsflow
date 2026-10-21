"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel, TrainingPlanData, TrainingDrillItem } from "@/types";
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Archive,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
} from "lucide-react";

export default function SchedulePage() {
  const params = useParams();
  const currentSport = (params.sport as string)?.toUpperCase() as SportChannel;
  const { locale, user } = useApp();
  const isZh = locale === "zh";

  const [plans, setPlans] = useState<TrainingPlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New plan form state: SINGLE TITLE INPUT (Never force coach to type both languages!)
  const [sessionTitle, setSessionTitle] = useState("");
  const [showOptionalEnTitle, setShowOptionalEnTitle] = useState(false);
  const [optionalEnTitle, setOptionalEnTitle] = useState("");
  const [trainingDate, setTrainingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState("16:30");
  const [endTime, setEndTime] = useState("18:30");
  const [location, setLocation] = useState(
    currentSport === "FOOTBALL"
      ? "NKCS 1号天然草坪主场"
      : currentSport === "VOLLEYBALL"
      ? "室内体育馆排球主场"
      : "主体育馆硬木球场"
  );
  const [sessionNotes, setSessionNotes] = useState("");

  // Drills list inside modal (Fully editable and customizable by the coach)
  const [drillsList, setDrillsList] = useState<Partial<TrainingDrillItem>[]>([
    {
      titleZh: "动态热身与核心神经激活",
      titleEn: "Dynamic Warmup & Core Activation",
      category: "WARMUP",
      durationMins: 15,
      pitchSpecs: "20m x 20m 半场",
      coachingCuesZh: "1. 保持脚踝刚性；2. 动作幅度循序渐进；3. 激活主要发力肌群",
    },
    {
      titleZh: "高压攻防转换与半场传控对抗",
      titleEn: "High-Pressure Transition Scrimmage",
      category: "TACTICAL",
      durationMins: 30,
      pitchSpecs: "禁区前沿 35m x 40m",
      coachingCuesZh: "1. 就地5秒反抢围堵；2. 夺球后第一时间传向弱侧空当；3. 前点包抄门前到位",
    },
  ]);

  // Inline "Add Drill" form state inside modal
  const [showAddDrillForm, setShowAddDrillForm] = useState(false);
  const [newDrillTitle, setNewDrillTitle] = useState("");
  const [newDrillCategory, setNewDrillCategory] = useState("TACTICAL");
  const [newDrillDuration, setNewDrillDuration] = useState("20");
  const [newDrillPitchSpecs, setNewDrillPitchSpecs] = useState("半场 25m x 30m");
  const [newDrillCues, setNewDrillCues] = useState("");

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/training-plans?sport=${currentSport}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error("Failed to fetch training plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentSport) {
      fetchPlans();
    }
  }, [currentSport]);

  // Split plans into Active vs Archived (older than 30 days)
  const nowTime = new Date().getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const { activePlans, archivedPlans } = useMemo(() => {
    const active: TrainingPlanData[] = [];
    const archived: TrainingPlanData[] = [];

    plans.forEach((p) => {
      const planTime = new Date(p.trainingDate).getTime();
      // If plan was more than 30 days in the past, categorize as archived
      if (nowTime - planTime > thirtyDaysMs) {
        archived.push(p);
      } else {
        active.push(p);
      }
    });

    // Sort active by trainingDate ascending (soonest first)
    active.sort((a, b) => new Date(a.trainingDate).getTime() - new Date(b.trainingDate).getTime());
    // Sort archived by trainingDate descending (most recent past first)
    archived.sort((a, b) => new Date(b.trainingDate).getTime() - new Date(a.trainingDate).getTime());

    return { activePlans: active, archivedPlans: archived };
  }, [plans, nowTime]);

  const displayedPlans = activeTab === "ACTIVE" ? activePlans : archivedPlans;

  // Add drill to draft list
  const handleAddDrill = () => {
    if (!newDrillTitle.trim()) return;
    const drillItem: Partial<TrainingDrillItem> = {
      titleZh: newDrillTitle.trim(),
      titleEn: newDrillTitle.trim(),
      category: newDrillCategory as any,
      durationMins: parseInt(newDrillDuration, 10) || 20,
      pitchSpecs: newDrillPitchSpecs.trim() || "常规训练场地",
      coachingCuesZh: newDrillCues.trim() || "注重专注度与配合默契",
      coachingCuesEn: newDrillCues.trim() || "Focus on tactical rigor and precision",
    };
    setDrillsList([...drillsList, drillItem]);
    setNewDrillTitle("");
    setNewDrillCues("");
    setShowAddDrillForm(false);
  };

  // Remove drill from draft list
  const handleRemoveDrill = (idx: number) => {
    setDrillsList(drillsList.filter((_, i) => i !== idx));
  };

  // Quick preset drills loader
  const handleLoadSportPreset = (type: "WARMUP" | "TACTICAL" | "FINISHING") => {
    if (currentSport === "FOOTBALL") {
      if (type === "WARMUP") {
        setDrillsList((prev) => [
          ...prev,
          {
            titleZh: "4v4+3 自由人高压转换抢逼围",
            titleEn: "4v4+3 Neutral Transition Rondo",
            category: "WARMUP",
            durationMins: 15,
            pitchSpecs: "20m x 20m 禁区外方格",
            coachingCuesZh: "丢球后最近两人即刻封堵出球路线，夺回第一脚快速向前！",
          },
        ]);
      } else if (type === "TACTICAL") {
        setDrillsList((prev) => [
          ...prev,
          {
            titleZh: "边锋内切与边后卫弧线套边对抗",
            titleEn: "Winger Inverted Run & Fullback Overlap",
            category: "TACTICAL",
            durationMins: 30,
            pitchSpecs: "大禁区前沿半场 40m x 35m",
            coachingCuesZh: "边锋内切带走中卫注意力，边后卫高速下底送出致命低平倒三角！",
          },
        ]);
      } else {
        setDrillsList((prev) => [
          ...prev,
          {
            titleZh: "禁区倒三角弧顶包抄迎球爆射",
            titleEn: "Cutback Box Delivery & Edge-of-Box Finish",
            category: "TECHNICAL",
            durationMins: 20,
            pitchSpecs: "大禁区内及弧顶区",
            coachingCuesZh: "中场队员从后排高速冲入空当，迎球直接推射球门死角破门！",
          },
        ]);
      }
    } else if (currentSport === "VOLLEYBALL") {
      setDrillsList((prev) => [
        ...prev,
        {
          titleZh: "二传后排插上网前与副攻背飞佯攻",
          titleEn: "Setter Penetration & Middle Slide Decoy",
          category: "TACTICAL",
          durationMins: 25,
          pitchSpecs: "18m x 9m 室内排球场",
          coachingCuesZh: "二传声响响亮提示出球方向，副攻背飞佯攻带走双人拦网，主攻6号位立体砸球！",
        },
      ]);
    } else {
      setDrillsList((prev) => [
        ...prev,
        {
          titleZh: "高位牛角双掩护与西班牙盲区背挡拆",
          titleEn: "Horns PnR & Spanish Back-Screen 3v3",
          category: "TACTICAL",
          durationMins: 25,
          pitchSpecs: "半场 14m x 15m 硬木球场",
          coachingCuesZh: "中锋扎实高位掩护顺下，射手切入设立盲区背掩护，制造空接扣篮！",
        },
      ]);
    }
  };

  // Submit new training plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    try {
      const res = await fetch("/api/training-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: currentSport,
          trainingDate: new Date(trainingDate).toISOString(),
          startTime,
          endTime,
          location,
          title: sessionTitle.trim(),
          titleZh: sessionTitle.trim(),
          titleEn: optionalEnTitle.trim() || sessionTitle.trim(),
          contentZh: sessionNotes.trim(),
          contentEn: sessionNotes.trim(),
          drills: drillsList,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setSessionTitle("");
        setOptionalEnTitle("");
        setSessionNotes("");
        await fetchPlans();
      }
    } catch (err) {
      console.error("Failed to create training plan:", err);
    }
  };

  // Delete plan
  const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(isZh ? "确定要删除该训练计划吗？" : "Are you sure you want to delete this training session?")) {
      return;
    }
    try {
      const res = await fetch(`/api/training-plans?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPlans();
      }
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  const isCoachOrAdmin = user?.role === "COACH" || user?.role === "ADMIN";

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ================= 1. HEADER & ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-stone-100">
              {currentSport === "FOOTBALL" ? "⚽ 足球" : currentSport === "VOLLEYBALL" ? "🏐 排球" : "🏀 篮球"}
              <span className="ml-1.5">{isZh ? "日常训练课排期与科目指南" : "Training Timetable & Sessions"}</span>
            </h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {isZh
              ? "按时间有序呈现 · 单一卡片聚焦 · 包含精细科目时长与执教要点 · 满一个月自动归档"
              : "Chronological schedule · Single block clarity · Exact drill minutes & cues · Archived after 30 days"}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Active / Archive Toggle Tabs */}
          <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "ACTIVE"
                  ? "bg-amber-600 text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              📅 {isZh ? "近期训练" : "Upcoming"} ({activePlans.length})
            </button>
            <button
              onClick={() => setActiveTab("ARCHIVED")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "ARCHIVED"
                  ? "bg-stone-700 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              📦 {isZh ? "历史归档" : "Archive"} ({archivedPlans.length})
            </button>
          </div>

          {/* Coach New Session Button */}
          {isCoachOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isZh ? "发布训练课" : "New Practice"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. TRAINING SESSIONS CHRONOLOGICAL STREAM (SINGLE BLOCK VIEW) ================= */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">
          {isZh ? "正在加载校队训练日程..." : "Loading training schedule..."}
        </div>
      ) : displayedPlans.length > 0 ? (
        <div className="space-y-4">
          {displayedPlans.map((plan, planIdx) => {
            const planDateObj = new Date(plan.trainingDate);
            const dateStr = planDateObj.toLocaleDateString(isZh ? "zh-CN" : "en-US", {
              month: "long",
              day: "numeric",
              weekday: "long",
            });
            const isToday =
              new Date().toISOString().slice(0, 10) === planDateObj.toISOString().slice(0, 10);

            return (
              <div
                key={plan.id}
                className={`bg-[#121815] border rounded-2xl p-5 sm:p-6 shadow-md transition-all ${
                  isToday
                    ? "border-amber-500/80 ring-1 ring-amber-500/30"
                    : "border-stone-800 hover:border-stone-700"
                }`}
              >
                {/* Block Header: Date, Time, Location & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-center shrink-0 border ${
                        isToday
                          ? "bg-amber-600 text-stone-950 border-amber-500 shadow-md"
                          : "bg-stone-900 text-stone-200 border-stone-800"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-tighter -mb-0.5">
                        {planDateObj.toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-black font-mono leading-none">
                        {planDateObj.getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base sm:text-lg font-bold text-white">{dateStr}</h3>
                        {isToday && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                            {isZh ? "今日训练 TODAY" : "TODAY"}
                          </span>
                        )}
                        {activeTab === "ARCHIVED" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
                            {isZh ? "已归档" : "Archived"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-stone-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{plan.startTime && plan.endTime ? `${plan.startTime} - ${plan.endTime}` : "16:30 - 18:30"}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{plan.location || "NKCS 主球场"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coach Options */}
                  {isCoachOrAdmin && (
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={(e) => handleDeletePlan(plan.id, e)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title={isZh ? "删除此训练课" : "Delete session"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Session Focus & Content */}
                <div className="pt-3.5 space-y-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-black text-amber-300">
                      {plan.titleZh}
                    </h2>
                    {plan.titleEn && plan.titleEn !== plan.titleZh && (
                      <p className="text-xs text-stone-400 italic mt-0.5">{plan.titleEn}</p>
                    )}
                    {plan.contentZh && (
                      <p className="text-xs text-stone-300 mt-2 leading-relaxed bg-black/25 p-3 rounded-xl border border-white/5">
                        <strong className="text-emerald-400">{isZh ? "执教重点：" : "Focus: "}</strong>
                        {isZh ? plan.contentZh : plan.contentEn}
                      </p>
                    )}
                  </div>

                  {/* Included Drills Timetable Strip */}
                  {plan.drills && plan.drills.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                        <span className="font-bold flex items-center space-x-1.5 text-stone-300">
                          <Layers className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isZh ? "本堂课科目编排" : "Structured Drill Timetable"}</span>
                        </span>
                        <span className="text-[11px] font-mono">
                          {plan.drills.reduce((acc, d) => acc + (d.durationMins || 0), 0)} {isZh ? "分钟总计" : "mins total"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {plan.drills.map((drill, dIdx) => (
                          <div
                            key={drill.id || dIdx}
                            className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    drill.category === "WARMUP"
                                      ? "bg-amber-950/70 text-amber-300 border border-amber-700/60"
                                      : drill.category === "TACTICAL"
                                      ? "bg-emerald-950/70 text-emerald-300 border border-emerald-700/60"
                                      : "bg-blue-950/70 text-blue-300 border border-blue-700/60"
                                  }`}
                                >
                                  {drill.category}
                                </span>
                                <span className="font-mono text-stone-400 font-bold">
                                  ⏱️ {drill.durationMins || 20}m
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-white mt-1">{drill.titleZh}</h4>
                              {drill.pitchSpecs && (
                                <p className="text-[10px] text-stone-400 mt-0.5 font-mono">
                                  📍 {drill.pitchSpecs}
                                </p>
                              )}
                            </div>

                            {drill.coachingCuesZh && (
                              <p className="text-[11px] text-stone-300 mt-2 pt-2 border-t border-stone-800/80 leading-snug line-clamp-2">
                                💡 {drill.coachingCuesZh}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-stone-400 text-sm bg-black/20 rounded-2xl border border-white/5">
          <Calendar className="w-10 h-10 text-stone-600 mx-auto mb-2 opacity-50" />
          <p>{activeTab === "ACTIVE" ? (isZh ? "当前暂无即将到来的日常训练" : "No upcoming training sessions") : (isZh ? "暂无超过1个月的归档训练记录" : "No archived sessions")}</p>
        </div>
      )}

      {/* ================= 3. COACH/ADMIN CREATE PLAN MODAL (FLEXIBLE TITLE & CUSTOM DRILLS) ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#14181E] border border-white/20 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{isZh ? `发布 ${currentSport} 新训练课` : `New ${currentSport} Training Session`}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              {/* Flexible Single Title Field */}
              <div>
                <label className="block text-stone-200 font-bold mb-1">
                  {isZh ? "训练课主题 / Title *" : "Session Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder={
                    currentSport === "FOOTBALL"
                      ? "例如: 4-3-3 肋部渗透与边路套边专项训练"
                      : currentSport === "VOLLEYBALL"
                      ? "例如: 5-1 进攻体系二传插上与副攻背飞佯攻"
                      : "例如: 高位牛角双掩护与西班牙空切挡拆"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              {/* Optional English Title Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptionalEnTitle(!showOptionalEnTitle)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
                >
                  <span>{showOptionalEnTitle ? "收起英文副标题" : "+ 补充英文副标题 (可选 / Optional English Title)"}</span>
                </button>
                {showOptionalEnTitle && (
                  <input
                    type="text"
                    value={optionalEnTitle}
                    onChange={(e) => setOptionalEnTitle(e.target.value)}
                    placeholder="e.g. Half-Space Penetration & Overlapping Wing Attack"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs outline-none focus:border-amber-500"
                  />
                )}
              </div>

              {/* Date, Time & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    {isZh ? "训练日期" : "Date"}
                  </label>
                  <input
                    type="date"
                    required
                    value={trainingDate}
                    onChange={(e) => setTrainingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    {isZh ? "开始时间" : "Start"}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    {isZh ? "结束时间" : "End"}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    {isZh ? "场地位置" : "Location"}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Tactical Focus Notes */}
              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  {isZh ? "全队执教要点与赛前指令" : "Coaching Focus & Cues"}
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder={
                    isZh
                      ? "例如: 重点演练中路吸引防守后的弱侧大弧线转移，注意后点包抄时机。"
                      : "Key tactical coaching cues for this practice..."
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* ================= INCLUDED DRILLS MANAGER ================= */}
              <div className="pt-2 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-200 block text-xs">
                      {isZh ? "本堂课包含科目 (Included Drills):" : "Included Drills:"}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {isZh ? "教练可自由增删修改各环节内容" : "Freely add or remove drill items"}
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadSportPreset("WARMUP")}
                      className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-300"
                    >
                      + {isZh ? "热身模板" : "Warmup"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSportPreset("TACTICAL")}
                      className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-emerald-300"
                    >
                      + {isZh ? "对抗模板" : "Tactical"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddDrillForm(true)}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-[11px] flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isZh ? "添加科目" : "Add Drill"}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add Drill Form */}
                {showAddDrillForm && (
                  <div className="p-3.5 rounded-xl bg-stone-900 border border-amber-500/40 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
                      <span className="font-bold text-amber-400 text-xs">
                        {isZh ? "新增自定义训练科目" : "Add Custom Drill"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddDrillForm(false)}
                        className="text-stone-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-stone-400 mb-0.5">
                          {isZh ? "科目名称 *" : "Drill Title *"}
                        </label>
                        <input
                          type="text"
                          value={newDrillTitle}
                          onChange={(e) => setNewDrillTitle(e.target.value)}
                          placeholder="例如: 3v2 边路快速反击与弱侧传中"
                          className="w-full px-2.5 py-1.5 rounded bg-black/60 border border-stone-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-400 mb-0.5">
                          {isZh ? "科目类型" : "Category"}
                        </label>
                        <select
                          value={newDrillCategory}
                          onChange={(e) => setNewDrillCategory(e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-black/60 border border-stone-700 text-white text-xs"
                        >
                          <option value="WARMUP">热身 (WARMUP)</option>
                          <option value="TECHNICAL">技术 (TECHNICAL)</option>
                          <option value="TACTICAL">战术对抗 (TACTICAL)</option>
                          <option value="PHYSICAL">体能 (PHYSICAL)</option>
                          <option value="COOL_DOWN">整理放松 (COOL_DOWN)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-stone-400 mb-0.5">
                          {isZh ? "时长 (分钟)" : "Duration (mins)"}
                        </label>
                        <input
                          type="number"
                          value={newDrillDuration}
                          onChange={(e) => setNewDrillDuration(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-black/60 border border-stone-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-400 mb-0.5">
                          {isZh ? "场地规格" : "Pitch Specs"}
                        </label>
                        <input
                          type="text"
                          value={newDrillPitchSpecs}
                          onChange={(e) => setNewDrillPitchSpecs(e.target.value)}
                          placeholder="例如: 半场 30m x 25m"
                          className="w-full px-2.5 py-1.5 rounded bg-black/60 border border-stone-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">
                        {isZh ? "教练指导要点 (Coaching Cues)" : "Coaching Cues"}
                      </label>
                      <input
                        type="text"
                        value={newDrillCues}
                        onChange={(e) => setNewDrillCues(e.target.value)}
                        placeholder="例如: 1. 抬头观察弱侧；2. 传球后立刻全速套边"
                        className="w-full px-2.5 py-1.5 rounded bg-black/60 border border-stone-700 text-white text-xs"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddDrillForm(false)}
                        className="px-3 py-1 rounded bg-stone-800 text-stone-300"
                      >
                        {isZh ? "取消" : "Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddDrill}
                        disabled={!newDrillTitle.trim()}
                        className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold"
                      >
                        {isZh ? "加入计划" : "Add to Session"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Drills Preview List with Delete Buttons */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {drillsList.length > 0 ? (
                    drillsList.map((d, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between items-center group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-5 h-5 rounded-full bg-stone-800 text-amber-400 flex items-center justify-center font-mono text-[10px] font-bold">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-bold text-white text-xs">{d.titleZh}</p>
                            <p className="text-[10px] text-stone-400">
                              {d.category} · {d.durationMins || 20}分钟 · {d.pitchSpecs || "半场"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDrill(i)}
                          className="p-1 rounded text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title={isZh ? "移除此科目" : "Remove drill"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-stone-500 italic p-3 text-center border border-dashed border-stone-800 rounded-xl">
                      {isZh ? "暂无添加科目，点击右上角“添加科目”或载入模板" : "No drills added yet"}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white"
                >
                  {isZh ? "取消" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={!sessionTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold transition-all shadow-md"
                >
                  {isZh ? "确认发布训练课" : "Publish Practice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
