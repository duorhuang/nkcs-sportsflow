"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  TacticData,
  PlayerProfileData,
  SportChannel,
  TacticToken,
  TacticPhaseData,
} from "@/types";
import TacticsBoard from "@/components/tactics/TacticsBoard";
import CharacterTray from "@/components/tactics/CharacterTray";
import BigScreenModal from "@/components/tactics/BigScreenModal";
import TacticPrintView from "@/components/tactics/TacticPrintView";
import {
  BookOpen,
  Plus,
  Play,
  Save,
  MessageSquare,
  Send,
  Sliders,
  Tv,
  Printer,
  ChevronRight,
  Shield,
  Award,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function TacticsPage() {
  const params = useParams();
  const sport = ((params.sport as string) || "FOOTBALL").toUpperCase() as SportChannel;
  const { user, locale } = useApp();
  const isZh = locale === "zh";

  const isCoachOrAdmin = user?.role === "COACH" || user?.role === "ADMIN";

  const [tactics, setTactics] = useState<TacticData[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<TacticData | null>(null);
  const [players, setPlayers] = useState<PlayerProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showBigScreen, setShowBigScreen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Tactic Form State
  const [newTitleZh, setNewTitleZh] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newScenario, setNewScenario] = useState("阵地进攻");
  const [newCourtFormat, setNewCourtFormat] = useState(
    sport === "FOOTBALL" ? "11人制标准草坪" : sport === "VOLLEYBALL" ? "6人制室内排球场" : "5v5全场硬木地板"
  );
  const [newDescriptionZh, setNewDescriptionZh] = useState("");

  // Comment input state
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch tactics and roster
  const loadData = async () => {
    try {
      setLoading(true);
      const [tacticsRes, playersRes] = await Promise.all([
        fetch(`/api/tactics?sport=${sport}`),
        fetch(`/api/players?sport=${sport}&filter=ALL`),
      ]);

      if (tacticsRes.ok) {
        const tacticsData = await tacticsRes.json();
        setTactics(tacticsData.tactics || []);
        if (tacticsData.tactics && tacticsData.tactics.length > 0) {
          setSelectedTactic(tacticsData.tactics[0]);
        }
      }

      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData.profiles || []);
      }
    } catch (err) {
      console.error("Failed to load tactics page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sport]);

  // Handle tactical token additions from Character Tray
  const handleAddTokenToCurrentPhase = (newToken: TacticToken) => {
    if (!selectedTactic) return;
    const currentPhases = [...selectedTactic.phases];
    if (currentPhases.length === 0) return;

    // Add token to the current first phase or active phase
    const updatedPhase = {
      ...currentPhases[0],
      tokens: [...currentPhases[0].tokens, newToken],
    };
    currentPhases[0] = updatedPhase;

    setSelectedTactic({
      ...selectedTactic,
      phases: currentPhases,
    });
  };

  // Handle Save Tactic Changes (Coach / Admin)
  const handleSaveTactic = async () => {
    if (!selectedTactic || !isCoachOrAdmin) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/tactics/${selectedTactic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleZh: selectedTactic.titleZh,
          titleEn: selectedTactic.titleEn,
          scenario: selectedTactic.scenario,
          courtFormat: selectedTactic.courtFormat,
          tags: selectedTactic.tags,
          descriptionZh: selectedTactic.descriptionZh,
          descriptionEn: selectedTactic.descriptionEn,
          phases: selectedTactic.phases,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Refresh tactics list
        const refreshedRes = await fetch(`/api/tactics?sport=${sport}`);
        if (refreshedRes.ok) {
          const data = await refreshedRes.json();
          setTactics(data.tactics || []);
        }
      }
    } catch (err) {
      console.error("Failed to save tactic:", err);
    } finally {
      setSaving(false);
    }
  };

  // Create New Tactic
  const handleCreateTactic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleZh || !newTitleEn) return;

    try {
      const initialPhase: TacticPhaseData = {
        phaseIndex: 1,
        titleZh: "阶段一：初始站位",
        titleEn: "Phase 1: Initial Setup",
        notesZh: "基础站位与防线部署",
        notesEn: "Base formation alignment",
        tokens: [
          {
            id: `ball_${Date.now()}`,
            type: "BALL",
            label: "Ball",
            x: 500,
            y: 350,
          },
        ],
        trajectories: [],
      };

      const res = await fetch("/api/tactics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          titleZh: newTitleZh,
          titleEn: newTitleEn,
          scenario: newScenario,
          courtFormat: newCourtFormat,
          tags: ["最新编排", sport],
          descriptionZh: newDescriptionZh,
          phases: [initialPhase],
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitleZh("");
        setNewTitleEn("");
        setNewDescriptionZh("");
        await loadData();
      }
    } catch (err) {
      console.error("Failed to create tactic:", err);
    }
  };

  // Post Comment / Feedback
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTactic || !newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tactics/${selectedTactic.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewComment("");
        // Append comment
        setSelectedTactic({
          ...selectedTactic,
          comments: [data.comment, ...(selectedTactic.comments || [])],
        });
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-2 border-heritage-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400">正在调取 NKCS 战术白皮书资料库...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn print:m-0 print:p-0">
      {/* Printable A4 View (hidden on screen, active on print) */}
      {selectedTactic && <TacticPrintView sport={sport} tactic={selectedTactic} />}

      {/* Screen View */}
      <div className="print:hidden space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-heritage-gold/20 text-heritage-gold text-[10px] font-bold border border-heritage-gold/30 uppercase tracking-wider">
                {sport} TACTICAL PLAYBOOK
              </span>
              <span className="text-xs text-gray-400">
                {tactics.length} 套典藏经典战术体系
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
              <BookOpen className="w-7 h-7 text-heritage-gold" />
              <span>{isZh ? `${sport} 战术白皮书宝典` : `${sport} Tactics Playbook`}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {isZh
                ? "历届传承战术 · 阶段推演演播 · 角色选择器调配现役主力与传奇名宿 · 更衣室大屏模式"
                : "Heritage Tactics · Keyframe Animation · Active Squad & Legend Selection · Locker Room Big-Screen"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCoachOrAdmin && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>新建战术</span>
                </button>

                <button
                  onClick={handleSaveTactic}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md ${
                    saveSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-heritage-gold hover:brightness-110 text-black"
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>保存成功</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{saving ? "正在存盘..." : "保存战术变动"}</span>
                    </>
                  )}
                </button>
              </>
            )}

            {selectedTactic && (
              <button
                onClick={() => setShowBigScreen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-frameGold transition-all"
              >
                <Tv className="w-4 h-4" />
                <span>📺 更衣室大屏演播</span>
              </button>
            )}
          </div>
        </div>

        {/* Tactic Selector Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tactics.map((tactic) => {
            const isSelected = selectedTactic?.id === tactic.id;
            return (
              <div
                key={tactic.id}
                onClick={() => setSelectedTactic(tactic)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? "bg-gradient-to-br from-heritage-gold/20 via-black/80 to-black/90 border-heritage-gold shadow-frameGold scale-[1.01]"
                    : "bg-black/50 border-white/10 hover:border-white/20 hover:bg-black/70"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-heritage-gold uppercase">
                    {tactic.scenario}
                  </span>
                  <span className="text-gray-400 text-[10px] font-mono">
                    {tactic.courtFormat}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm line-clamp-1">
                  {isZh ? tactic.titleZh : tactic.titleEn}
                </h3>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                  {isZh ? tactic.titleEn : tactic.titleZh}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[11px] text-gray-400">
                  <span>{tactic.phases?.length || 0} 个动画推演阶段</span>
                  <span className="text-heritage-gold font-bold flex items-center space-x-0.5">
                    <span>演练</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Tactic Workbench */}
        {selectedTactic && (
          <div className="space-y-6">
            {/* Interactive Tactics Board */}
            <TacticsBoard
              sport={sport}
              tactic={selectedTactic}
              players={players}
              editable={isCoachOrAdmin}
              onUpdateTactic={(updated) => setSelectedTactic(updated)}
              onOpenBigScreen={() => setShowBigScreen(true)}
              onPrintA4={() => window.print()}
            />

            {/* Game Character Select Tray (角色选择器) */}
            <CharacterTray
              players={players}
              onAddToken={handleAddTokenToCurrentPhase}
              deployedTokenIds={
                selectedTactic.phases[0]?.tokens.map((t) => t.id) || []
              }
            />

            {/* Tactical Brief & Locker Room Discussion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tactical Overview */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/15">
                <h3 className="text-xs font-bold uppercase tracking-wider text-heritage-gold mb-2 flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>战术核心要旨与实战执行</span>
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {selectedTactic.descriptionZh || selectedTactic.descriptionEn || "无特定附加说明。"}
                </p>

                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-gray-400">
                  <div className="flex justify-between py-1">
                    <span>主编教练：</span>
                    <strong className="text-white">
                      {selectedTactic.creator?.nameZh} ({selectedTactic.creator?.role})
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>场地制式：</span>
                    <span className="text-gray-300">{selectedTactic.courtFormat}</span>
                  </div>
                </div>
              </div>

              {/* Discussion & Player Notes */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-black/60 border border-white/15 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-heritage-gold mb-3 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>战术交流区 · 队员反馈与教练答疑</span>
                  </h3>

                  {/* Comment List */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {(!selectedTactic.comments || selectedTactic.comments.length === 0) ? (
                      <p className="text-xs text-gray-500 py-4 text-center">
                        暂无队内讨论，在下方留言提出你对该战术跑位的建议或疑问。
                      </p>
                    ) : (
                      selectedTactic.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-heritage-gold">
                              {comment.user.nameZh} ({comment.user.role})
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-300">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Comment Input */}
                <form onSubmit={handlePostComment} className="mt-4 pt-3 border-t border-white/10 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="输入战术建议或向教练提问..."
                    className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-heritage-gold/50"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-3.5 py-2 rounded-lg bg-heritage-gold hover:brightness-110 text-black font-bold text-xs flex items-center space-x-1 disabled:opacity-50 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>发送</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Locker Room Big-Screen Modal */}
      {selectedTactic && (
        <BigScreenModal
          sport={sport}
          tactic={selectedTactic}
          players={players}
          isOpen={showBigScreen}
          onClose={() => setShowBigScreen(false)}
        />
      )}

      {/* Create Tactic Modal (Coach/Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/90 border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-black text-lg text-white">
              创建全新 {sport} 战术体系
            </h3>

            <form onSubmit={handleCreateTactic} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  战术中文名称 *
                </label>
                <input
                  type="text"
                  required
                  value={newTitleZh}
                  onChange={(e) => setNewTitleZh(e.target.value)}
                  placeholder="如：4-3-3 肋部渗透与快速反击"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  战术英文名称 *
                </label>
                <input
                  type="text"
                  required
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. 4-3-3 Half-Space Overload"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    战术场景
                  </label>
                  <input
                    type="text"
                    value={newScenario}
                    onChange={(e) => setNewScenario(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    场地制式
                  </label>
                  <input
                    type="text"
                    value={newCourtFormat}
                    onChange={(e) => setNewCourtFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  战术原则与执行要点说明
                </label>
                <textarea
                  rows={3}
                  value={newDescriptionZh}
                  onChange={(e) => setNewDescriptionZh(e.target.value)}
                  placeholder="简述跑位时机、第一出球点以及包抄路线..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  创建战术白皮书
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
