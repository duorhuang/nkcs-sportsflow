"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel } from "@/types";
import InteractiveBodyVisualizer from "@/components/recovery/InteractiveBodyVisualizer";
import {
  BodyPartKey,
  SpecificMuscle,
  ANATOMY_DATABASE,
} from "@/lib/anatomyData";
import {
  Activity,
  ShieldCheck,
  Zap,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wind,
  Plus,
  Send,
  ThumbsUp,
  XCircle,
  Clock,
  Layers,
  Crosshair,
  MapPin,
  Fingerprint,
} from "lucide-react";

interface GuideItem {
  id: string;
  sport: string;
  bodyPartKey: string;
  modality: string;
  titleZh: string;
  titleEn: string;
  contentZh: string;
  contentEn: string;
  durationNotes?: string | null;
  equipmentNotes?: string | null;
  contraindications?: string | null;
  status: string;
  author: {
    id: string;
    nameZh: string;
    nameEn: string;
    role: string;
  };
}

export default function RecoveryPage() {
  const params = useParams();
  const sport = ((params.sport as string) || "FOOTBALL").toUpperCase() as SportChannel;
  const { user, locale } = useApp();
  const isZh = locale === "zh";

  const isCoachOrAdmin = user?.role === "COACH" || user?.role === "ADMIN";

  // Selected Zone & Specific Muscle
  const [selectedPart, setSelectedPart] = useState<BodyPartKey>("hamstrings");
  const [selectedSpecificMuscle, setSelectedSpecificMuscle] = useState<string>("biceps_femoris");
  const [condition, setCondition] = useState<"DOMS" | "ACUTE" | "CHRONIC">("DOMS");
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UGC Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [ugcTitle, setUgcTitle] = useState("");
  const [ugcContent, setUgcContent] = useState("");
  const [ugcModality, setUgcModality] = useState("ZERO_COST_SUBSTITUTE");
  const [ugcEquipment, setUgcEquipment] = useState("");
  const [ugcDuration, setUgcDuration] = useState("");
  const [submittingUgc, setSubmittingUgc] = useState(false);

  // Derive current zone and specific muscle from ANATOMY_DATABASE
  const currentZone = ANATOMY_DATABASE[selectedPart] || ANATOMY_DATABASE.hamstrings;
  const currentMuscle =
    currentZone.muscles.find((m) => m.key === selectedSpecificMuscle) ||
    currentZone.muscles[0];

  const handleSelectZone = (zoneKey: BodyPartKey, specificKey?: string) => {
    setSelectedPart(zoneKey);
    const targetZone = ANATOMY_DATABASE[zoneKey];
    if (specificKey) {
      setSelectedSpecificMuscle(specificKey);
    } else if (targetZone && targetZone.muscles.length > 0) {
      setSelectedSpecificMuscle(targetZone.muscles[0].key);
    }
  };

  const handleSelectSpecificMuscle = (specificKey: string, parentZone: BodyPartKey) => {
    setSelectedPart(parentZone);
    setSelectedSpecificMuscle(specificKey);
  };

  // Load community / verified guides for active body part
  const loadGuides = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/recovery?sport=${sport}&bodyPart=${selectedPart}&includePending=${isCoachOrAdmin}`
      );
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides || []);
      }
    } catch (err) {
      console.error("Failed to load recovery guides:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuides();
  }, [sport, selectedPart, isCoachOrAdmin]);

  // Submit UGC Guide / Substitute
  const handleSubmitUgc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ugcTitle || !ugcContent) return;

    setSubmittingUgc(true);
    try {
      const res = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          bodyPartKey: selectedPart,
          modality: ugcModality,
          titleZh: ugcTitle,
          contentZh: ugcContent,
          equipmentNotes: ugcEquipment,
          durationNotes: ugcDuration,
        }),
      });

      if (res.ok) {
        setShowSubmitModal(false);
        setUgcTitle("");
        setUgcContent("");
        setUgcEquipment("");
        setUgcDuration("");
        await loadGuides();
      }
    } catch (err) {
      console.error("Failed to submit UGC guide:", err);
    } finally {
      setSubmittingUgc(false);
    }
  };

  // Review Guide (Coach / Admin)
  const handleReviewGuide = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/recovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await loadGuides();
      }
    } catch (err) {
      console.error("Failed to review guide:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 uppercase tracking-wider">
              {sport} ATHLETIC MEDICINE & RECOVERY
            </span>
            <span className="text-xs text-gray-400">
              现代运动医学标准 · 具体肌肉细分 · 零成本校园自愈
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <Activity className="w-7 h-7 text-rose-400" />
            <span>{isZh ? `${sport} 竞技康复与损伤自愈白皮书` : `${sport} Recovery & Rehab Hub`}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "3D 空间立体人体模型 · 按具体肌肉精确定位 · 触诊自查指南 · 宿舍零成本自愈替代 · 返场红绿灯达标测试"
              : "3D musculoskeletal anatomy · Specific muscle breakdown · Tactile palpation · Zero-cost dorm substitutes · RTP readiness tests"}
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-rose-400" />
          <span>{isZh ? "贡献宿舍零成本小妙招" : "Submit Dorm Recovery Tip"}</span>
        </button>
      </div>

      {/* Main Split Workbench: Anatomical Visualizer on Left, Clinical Prescriptions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Body Map (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <InteractiveBodyVisualizer
            sport={sport}
            selectedPart={selectedPart}
            selectedSpecificMuscle={selectedSpecificMuscle}
            onSelectPart={handleSelectZone}
            onSelectSpecificMuscle={handleSelectSpecificMuscle}
          />

          {/* Quick Body Zone Selector Pills */}
          <div className="p-4 rounded-xl bg-[#141B18] border border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                {isZh ? "选择大肌群区域 (PRIMARY BODY ZONE)" : "Select Primary Body Zone"}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {Object.keys(ANATOMY_DATABASE).length} 大核心区域
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ANATOMY_DATABASE) as BodyPartKey[]).map((key) => {
                const zone = ANATOMY_DATABASE[key];
                const isSelected = selectedPart === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectZone(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-rose-700 text-white font-bold shadow-md ring-1 ring-rose-400"
                        : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
                    }`}
                  >
                    {isZh ? zone.nameZh.split("/")[0] : zone.nameEn.split("(")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptions & Specific Muscle Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Specific Muscle Clinical Card */}
          <div className="p-6 rounded-2xl bg-[#141B18] border border-stone-800 shadow-xl space-y-5">
            {/* Zone & Sub-Part Title */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800">
              <div>
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>TARGET BODY ZONE · {currentZone.nameEn}</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-100 mt-0.5">
                  {currentMuscle.nameZh}
                </h2>
                <p className="text-xs text-stone-400 font-mono">{currentMuscle.nameEn}</p>
              </div>

              {/* Condition Switcher Tabs */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold">
                <button
                  onClick={() => setCondition("DOMS")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    condition === "DOMS"
                      ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  ⚡ 延迟性酸痛 (DOMS)
                </button>
                <button
                  onClick={() => setCondition("ACUTE")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    condition === "ACUTE"
                      ? "bg-rose-700 text-white font-bold"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  ⚠️ 急性扭拉伤
                </button>
                <button
                  onClick={() => setCondition("CHRONIC")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    condition === "CHRONIC"
                      ? "bg-stone-700 text-stone-100 font-bold"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  🔄 慢性劳损
                </button>
              </div>
            </div>

            {/* Specific Muscle Sub-Parts Tab Bar */}
            <div className="p-3.5 rounded-xl bg-[#0D1211] border border-amber-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isZh ? "按具体肌肉部位细分 (SPECIFIC MUSCLE PART)" : "Specific Muscle Part Breakdown"}
                  </span>
                </span>
                <span className="text-[10px] text-stone-400">
                  {currentZone.muscles.length} 块特定肌肉
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentZone.muscles.map((muscle) => {
                  const isActive = muscle.key === currentMuscle.key;
                  return (
                    <button
                      key={muscle.key}
                      onClick={() => handleSelectSpecificMuscle(muscle.key, currentZone.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        isActive
                          ? "bg-amber-600 text-stone-950 font-black shadow-lg ring-2 ring-amber-400 scale-[1.02]"
                          : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
                      }`}
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${isActive ? "text-stone-950" : "text-amber-400"}`} />
                      <span>{muscle.nameZh}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exact Anatomical Location & Injury Mechanism */}
            <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs space-y-1.5">
              <div className="flex items-center space-x-1.5 text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>精确解剖定位与损伤机制 (SPECIFIC ANATOMICAL LOCATION)</span>
              </div>
              <p className="text-stone-200 leading-relaxed font-medium">
                {currentMuscle.locationZh}
              </p>
              <p className="text-[11px] text-stone-400 font-mono italic">
                {currentMuscle.locationEn}
              </p>
            </div>

            {/* Clinical Tactile Palpation / Self-Check Guide */}
            <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-sky-300 font-bold">
                <Crosshair className="w-4 h-4 text-sky-400 shrink-0" />
                <span>临床触诊与自查方法 (TACTILE PALPATION & SELF-CHECK GUIDE)</span>
              </div>
              <p className="text-sky-100 leading-relaxed">
                {currentMuscle.palpationZh}
              </p>
            </div>

            {/* Ischemic Trigger Point Release */}
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-purple-300 font-bold">
                <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                <span>靶向激痛点缺血性按压松解 (TRIGGER POINT RELEASE)</span>
              </div>
              <p className="text-purple-100 leading-relaxed">
                {currentMuscle.triggerPointZh}
              </p>
            </div>

            {/* Zero-Cost Campus / Dormitory Substitute Spotlight */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/50 to-stone-900 border border-amber-800/50 shadow-md">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>宿舍零成本简易自愈替代手法 (ZERO-COST DORM SUBSTITUTE)</span>
              </h4>
              <p className="text-xs text-amber-100 leading-relaxed font-medium">
                {currentMuscle.dormSubstituteZh}
              </p>
            </div>

            {/* Action Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dynamic Stretch */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-xs font-bold text-sky-400 mb-1 flex items-center space-x-1.5">
                  <Wind className="w-3.5 h-3.5" />
                  <span>动态热身与神经激活</span>
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentMuscle.dynamicStretchZh}
                </p>
              </div>

              {/* Static Stretch */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-xs font-bold text-teal-400 mb-1 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>静态深度牵拉</span>
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentMuscle.staticStretchZh}
                </p>
              </div>

              {/* Massage Gun Guidance */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-xs font-bold text-purple-400 mb-1 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>筋膜枪与器械要点</span>
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentMuscle.gunCuesZh}
                </p>
              </div>

              {/* Medical Directive */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-xs font-bold text-amber-400 mb-1 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>运动医学处置准则</span>
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentZone.generalPeaceLoveZh}
                </p>
              </div>
            </div>

            {/* Return to Play Safety Traffic Light Checklist */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>
                  {isZh
                    ? `${currentMuscle.nameZh} 返场安全评估红绿灯达标测试`
                    : "Return-To-Play Readiness Test"}
                </span>
              </h4>
              <p className="text-[11px] text-gray-400 mb-3">
                在重新穿上球鞋参加全队高强度合练前，运动员需自主完成以下全部达标测试：
              </p>
              <div className="space-y-2">
                {currentMuscle.rtpChecksZh.map((check: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2.5 p-2 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Crowdsourced UGC Submissions & Peer Experience */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-black text-sm text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>校队师生共建经验库 ({guides.length} 条已归档)</span>
              </h3>
              <span className="text-xs text-gray-400">经队医与主教练核验</span>
            </div>

            {loading ? (
              <div className="text-center py-6 text-xs text-gray-500">
                正在检索共建数据库...
              </div>
            ) : guides.length === 0 ? (
              <div className="p-6 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-gray-400">
                该部位暂无运动员提交宿舍替代小妙招，欢迎点击上方按钮成为首位贡献者！
              </div>
            ) : (
              <div className="space-y-3">
                {guides.map((guide) => (
                  <div
                    key={guide.id}
                    className={`p-4 rounded-xl border transition-all ${
                      guide.status === "PENDING_REVIEW"
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{guide.titleZh}</span>
                        {guide.status === "PENDING_REVIEW" && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            待教练审核
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        贡献者：{guide.author.nameZh} ({guide.author.role})
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed mb-2">
                      {guide.contentZh}
                    </p>

                    {guide.equipmentNotes && (
                      <p className="text-[11px] text-emerald-400">
                        <strong>无器械替代工具：</strong> {guide.equipmentNotes}
                      </p>
                    )}

                    {/* Coach Review Actions */}
                    {isCoachOrAdmin && guide.status === "PENDING_REVIEW" && (
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-end space-x-2 text-xs">
                        <button
                          onClick={() => handleReviewGuide(guide.id, "REJECTED")}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>驳回修改</span>
                        </button>
                        <button
                          onClick={() => handleReviewGuide(guide.id, "APPROVED")}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1 shadow-md"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>核准并公开</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UGC Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/95 border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-black text-lg text-white">
              分享你的宿舍零成本康复小妙招
            </h3>
            <p className="text-xs text-gray-400">
              提交后将经由主教练或队医安全审核，确认动作符合运动医学规范后收录至全队白皮书。
            </p>

            <form onSubmit={handleSubmitUgc} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  妙招标题 *
                </label>
                <input
                  type="text"
                  required
                  value={ugcTitle}
                  onChange={(e) => setUgcTitle(e.target.value)}
                  placeholder="如：网球足底踩踏松解法、冷冻可乐罐冰敷"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  具体操作手法与步骤说明 *
                </label>
                <textarea
                  rows={4}
                  required
                  value={ugcContent}
                  onChange={(e) => setUgcContent(e.target.value)}
                  placeholder="详细写出你的姿势、用力程度、感觉酸痛还是舒适，以及注意事项..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    使用替代物品
                  </label>
                  <input
                    type="text"
                    value={ugcEquipment}
                    onChange={(e) => setUgcEquipment(e.target.value)}
                    placeholder="如：网球、500ml矿泉水瓶、浴巾"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    推荐单次时长
                  </label>
                  <input
                    type="text"
                    value={ugcDuration}
                    onChange={(e) => setUgcDuration(e.target.value)}
                    placeholder="如：两组 x 45秒"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingUgc}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingUgc ? "正在提交..." : "提交审核"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
