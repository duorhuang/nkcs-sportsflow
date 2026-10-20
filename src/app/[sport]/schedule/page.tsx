"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel, TrainingPlanData, TrainingDrillItem } from "@/types";
import DrillCard from "@/components/drill/DrillCard";
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Flame,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";

export default function SchedulePage() {
  const params = useParams();
  const currentSport = (params.sport as string)?.toUpperCase() as SportChannel;
  const { locale, user } = useApp();
  const isZh = locale === "zh";

  const [plans, setPlans] = useState<TrainingPlanData[]>([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New plan form state
  const [newTitleZh, setNewTitleZh] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newLocation, setNewLocation] = useState("2号主天然草坪");
  const [newStartTime, setNewStartTime] = useState("16:30");
  const [newEndTime, setNewEndTime] = useState("18:30");
  const [newDrills, setNewDrills] = useState<Partial<TrainingDrillItem>[]>([
    {
      titleZh: "动态热身与核心激活",
      titleEn: "Dynamic Warmup & Core Activation",
      category: "WARMUP",
      durationMins: 15,
      setsAndReps: "持续 1 组",
      pitchSpecs: "20m x 20m 半场",
      playerCount: "全队分成两组",
      coachingCuesZh: "1. 保持脚踝刚性；2. 动作幅度循序渐进；3. 激活主要发力肌群",
      coachingCuesEn: "1. Maintain ankle stiffness; 2. Progressive intensity; 3. Activate core muscle groups",
    },
    {
      titleZh: "半场高压攻防转换演练",
      titleEn: "Half-Court High-Pressure Transition",
      category: "TACTICAL",
      durationMins: 30,
      setsAndReps: "3组 x 8分钟，间歇2分钟",
      pitchSpecs: "禁区前沿 35m x 40m",
      playerCount: "主力防线 vs 替补攻击群",
      coachingCuesZh: "1. 就地5秒围抢；2. 夺球后第一时间传向弱侧空当；3. 门前形成交叉掩护包抄",
      coachingCuesEn: "1. Immediate 5-second counter-press; 2. Switch to weak side upon turnover; 3. Cross runs in box",
    },
  ]);

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

  const activePlan = plans[selectedPlanIndex] || null;

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/training-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: currentSport,
          trainingDate: new Date().toISOString(),
          startTime: newStartTime,
          endTime: newEndTime,
          location: newLocation,
          titleZh: newTitleZh,
          titleEn: newTitleEn,
          drills: newDrills,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitleZh("");
        setNewTitleEn("");
        await fetchPlans();
      }
    } catch (err) {
      console.error("Failed to create training plan:", err);
    }
  };

  const isCoachOrAdmin = user?.role === "COACH" || user?.role === "ADMIN";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Coach Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <CalendarDays className="w-7 h-7 text-emerald-400" />
            <span>{isZh ? `${currentSport} 日常训练计划与动作卡片` : `${currentSport} Training Schedule & Drills`}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "精确到分钟的科目编排 · 场地要求与人员配比 · 3 点教练指导原则 · 免打卡纯查阅"
              : "Minute-level drill timetable · Pitch specs & personnel · 3 Key coaching principles"}
          </p>
        </div>

        {isCoachOrAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-heritage-gold via-heritage-antiqueGold to-heritage-brass text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center space-x-2 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isZh ? "发布新训练计划" : "New Training Session"}</span>
          </button>
        )}
      </div>

      {/* Date / Plan Selector Bar */}
      {plans.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
          {plans.map((p, idx) => {
            const isSelected = idx === selectedPlanIndex;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlanIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                  isSelected
                    ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                    : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                }`}
              >
                <span>{new Date(p.trainingDate).toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "short", day: "numeric" })}</span>
                <span className="text-[11px] font-normal opacity-90 truncate max-w-[140px]">
                  {isZh ? p.titleZh : p.titleEn}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Session Detail Card */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">
          {isZh ? "正在加载训练计划..." : "Loading training schedule..."}
        </div>
      ) : activePlan ? (
        <div className="space-y-6">
          {/* Practice Overview Banner */}
          <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-md">
                  {isZh ? "训练课重点概览" : "Session Overview"}
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-100 mt-2">
                  {isZh ? activePlan.titleZh : activePlan.titleEn}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {isZh ? activePlan.titleEn : activePlan.titleZh}
                </p>
              </div>

              {/* Specs chips */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{activePlan.startTime && activePlan.endTime ? `${activePlan.startTime} - ${activePlan.endTime}` : "16:30 - 18:30"}</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{activePlan.location || "NKCS 主球场"}</span>
                </div>
              </div>
            </div>

            {activePlan.contentZh && (
              <p className="text-xs text-gray-300 mt-4 leading-relaxed pt-3 border-t border-white/10">
                {isZh ? activePlan.contentZh : activePlan.contentEn}
              </p>
            )}
          </div>

          {/* Drill Cards Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-black tracking-wide text-white flex items-center space-x-2">
              <span>{isZh ? "动作与科目高级卡片库 (Drill Cards)" : "Structured Drill Cards"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-sans font-semibold">
                {activePlan.drills?.length || 0}
              </span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activePlan.drills && activePlan.drills.length > 0 ? (
                activePlan.drills.map((drill, idx) => (
                  <DrillCard key={drill.id} drill={drill} index={idx + 1} />
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs bg-black/20 rounded-xl border border-white/5 col-span-2">
                  {isZh ? "本次训练暂未排布精细动作卡片" : "No drill cards attached to this session yet"}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400 text-sm bg-black/20 rounded-xl border border-white/5">
          {isZh ? "暂无日常训练安排" : "No training sessions found"}
        </div>
      )}

      {/* Coach/Admin Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141618] border border-white/20 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-heritage-antiqueGold" />
                <span>{isZh ? "发布新训练课计划" : "Create New Training Plan"}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  {isZh ? "训练课中文标题 *" : "Chinese Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={newTitleZh}
                  onChange={(e) => setNewTitleZh(e.target.value)}
                  placeholder="例如：边肋结合反击推进与前插包抄"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  {isZh ? "训练课英文标题 *" : "English Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. Wide Counter Transition & Box Finishing"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    {isZh ? "开始时间" : "Start Time"}
                  </label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    {isZh ? "结束时间" : "End Time"}
                  </label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    {isZh ? "场地编号" : "Location"}
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <span className="font-bold text-gray-300 block mb-2">
                  {isZh ? "已包含高级动作卡片 (Drills Preview):" : "Included Drills:"}
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {newDrills.map((d, i) => (
                    <div key={i} className="p-2.5 rounded bg-white/5 border border-white/10 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">{d.titleZh}</p>
                        <p className="text-[10px] text-gray-400">{d.category} · {d.durationMins} 分钟</p>
                      </div>
                      <span className="text-emerald-400 font-semibold">{d.pitchSpecs}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white"
                >
                  {isZh ? "取消" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {isZh ? "确认发布" : "Publish Practice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
