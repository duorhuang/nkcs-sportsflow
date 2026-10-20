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
  Video,
  Image as ImageIcon,
  Film,
  Edit3,
  ExternalLink,
  Camera,
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
  const [showMediaModal, setShowMediaModal] = useState(false);

  // New Tactic Form State
  const [newTitleZh, setNewTitleZh] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newScenario, setNewScenario] = useState("阵地进攻");
  const [newCourtFormat, setNewCourtFormat] = useState(
    sport === "FOOTBALL" ? "11人制标准草坪" : sport === "VOLLEYBALL" ? "6人制室内排球场" : "5v5全场硬木地板"
  );
  const [newDescriptionZh, setNewDescriptionZh] = useState("");
  const [newDescriptionEn, setNewDescriptionEn] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newDiagramUrl, setNewDiagramUrl] = useState("");

  // Edit media for selected tactic
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editDiagramUrl, setEditDiagramUrl] = useState("");

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
          setEditVideoUrl(tacticsData.tactics[0].videoUrl || "");
          setEditDiagramUrl(tacticsData.tactics[0].diagramUrl || "");
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

  useEffect(() => {
    if (selectedTactic) {
      setEditVideoUrl(selectedTactic.videoUrl || "");
      setEditDiagramUrl(selectedTactic.diagramUrl || "");
    }
  }, [selectedTactic?.id]);

  // Handle tactical token additions from Character Tray
  const handleAddTokenToCurrentPhase = (newToken: TacticToken) => {
    if (!selectedTactic) return;
    const currentPhases = [...selectedTactic.phases];
    if (currentPhases.length === 0) return;

    const updatedPhases = currentPhases.map((phase) => {
      if (phase.tokens.some((t) => t.id === newToken.id)) return phase;
      return {
        ...phase,
        tokens: [...phase.tokens, { ...newToken }],
      };
    });

    setSelectedTactic({
      ...selectedTactic,
      phases: updatedPhases,
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
          videoUrl: selectedTactic.videoUrl,
          diagramUrl: selectedTactic.diagramUrl,
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

  // Save updated media links
  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTactic || !isCoachOrAdmin) return;

    const updated = {
      ...selectedTactic,
      videoUrl: editVideoUrl.trim() || null,
      diagramUrl: editDiagramUrl.trim() || null,
    };
    setSelectedTactic(updated);

    try {
      await fetch(`/api/tactics/${selectedTactic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: updated.videoUrl,
          diagramUrl: updated.diagramUrl,
        }),
      });
      setShowMediaModal(false);
    } catch (err) {
      console.error("Failed to update tactic media:", err);
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
          descriptionEn: newDescriptionEn || newTitleEn,
          videoUrl: newVideoUrl.trim() || null,
          diagramUrl: newDiagramUrl.trim() || null,
          phases: [initialPhase],
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitleZh("");
        setNewTitleEn("");
        setNewDescriptionZh("");
        setNewDescriptionEn("");
        setNewVideoUrl("");
        setNewDiagramUrl("");
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
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-400">
          {isZh ? "正在调取 NKCS 战术白皮书资料库..." : "Loading NKCS tactical database..."}
        </p>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-stone-900 text-amber-400 text-[10px] font-bold border border-stone-800 uppercase tracking-wider font-mono">
                {sport} TACTICAL PLAYBOOK
              </span>
              <span className="text-xs text-stone-400">
                {tactics.length} {isZh ? "套典藏经典战术体系" : "Tactical Systems"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-stone-100 flex items-center space-x-2.5">
              <BookOpen className="w-7 h-7 text-amber-500" />
              <span>{isZh ? `${sport} 战术白皮书宝典` : `${sport} Tactics Playbook`}</span>
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              {isZh
                ? "历届传承战术 · 阶段推演演播 · 实战图解与视频演示 · 更衣室大屏模式"
                : "Heritage Tactics · Keyframe Animation · Photo Diagrams & Video Demos · Locker Room Big-Screen"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCoachOrAdmin && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>{isZh ? "新建战术" : "New Tactic"}</span>
                </button>

                <button
                  onClick={handleSaveTactic}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md ${
                    saveSuccess
                      ? "bg-emerald-800 text-stone-100 border border-emerald-600"
                      : "bg-amber-600 hover:bg-amber-500 text-stone-950 font-black"
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{isZh ? "保存成功" : "Saved"}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{saving ? (isZh ? "正在存盘..." : "Saving...") : (isZh ? "保存战术变动" : "Save Changes")}</span>
                    </>
                  )}
                </button>
              </>
            )}

            {selectedTactic && (
              <button
                onClick={() => setShowBigScreen(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-amber-400 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <Tv className="w-4 h-4 text-amber-500" />
                <span>{isZh ? "📺 更衣室大屏演播" : "📺 Big Screen"}</span>
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
                    ? "bg-[#1C241E] border-amber-600/80 shadow-md scale-[1.01]"
                    : "bg-[#181818] border-stone-800 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-amber-400 uppercase">
                    {tactic.scenario}
                  </span>
                  <span className="text-stone-400 text-[10px] font-mono">
                    {tactic.courtFormat}
                  </span>
                </div>
                <h3 className="font-bold text-stone-100 text-sm line-clamp-1">
                  {isZh ? tactic.titleZh : tactic.titleEn}
                </h3>
                <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                  {isZh ? tactic.titleEn : tactic.titleZh}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-800 text-[11px] text-stone-400">
                  <span>{tactic.phases?.length || 0} {isZh ? "个动画推演阶段" : "Phases"}</span>
                  <span className="text-amber-400 font-bold flex items-center space-x-0.5">
                    <span>{isZh ? "演练" : "View"}</span>
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

            {/* Game Character Select Tray (角色选择器，仅教练/管理员可见) */}
            {isCoachOrAdmin && (
              <CharacterTray
                players={players}
                onAddToken={handleAddTokenToCurrentPhase}
                deployedTokenIds={
                  selectedTactic.phases[0]?.tokens.map((t) => t.id) || []
                }
              />
            )}

            {/* ================= MULTIMEDIA SHOWCASE (战术实拍照片与视频演示) ================= */}
            <div className="p-5 rounded-2xl bg-[#191919] border border-stone-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <Film className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-100">
                      {isZh ? "战术多媒体教学 · 实战视频与图解挂图" : "Tactical Multimedia · Video & Diagram Demonstrations"}
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      {isZh ? "支持教练上传实拍示范视频、跑位剖析图解及战术黑板笔记" : "Video tutorials, match breakdowns, and tactical pitch diagrams"}
                    </p>
                  </div>
                </div>

                {isCoachOrAdmin && (
                  <button
                    onClick={() => setShowMediaModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isZh ? "配置多媒体链接" : "Edit Media"}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Tactical Video Player */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                    <span className="flex items-center space-x-1.5">
                      <Video className="w-4 h-4 text-amber-400" />
                      <span>{isZh ? "实战教学与视频示范" : "Video Demonstration"}</span>
                    </span>
                    {selectedTactic.videoUrl && (
                      <a
                        href={selectedTactic.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-stone-400 hover:text-amber-400 flex items-center space-x-1"
                      >
                        <span>{isZh ? "新窗口打开" : "Open link"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {selectedTactic.videoUrl ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-stone-800 shadow-md">
                      {selectedTactic.videoUrl.includes("youtube.com") || selectedTactic.videoUrl.includes("youtu.be") ? (
                        <iframe
                          src={selectedTactic.videoUrl}
                          title="Tactical Video"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={selectedTactic.videoUrl}
                          controls
                          className="w-full h-full object-contain bg-black"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border border-dashed border-stone-800 bg-stone-900/50 flex flex-col items-center justify-center p-4 text-center">
                      <Video className="w-8 h-8 text-stone-600 mb-2" />
                      <p className="text-xs text-stone-400 font-medium">
                        {isZh ? "暂未配置战术实战示范视频" : "No video demo attached yet"}
                      </p>
                      {isCoachOrAdmin && (
                        <button
                          onClick={() => setShowMediaModal(true)}
                          className="mt-2 text-xs text-amber-400 hover:underline"
                        >
                          {isZh ? "+ 点击添加视频链接" : "+ Add video URL"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Tactical Photo / Diagram */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                    <span className="flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-sky-400" />
                      <span>{isZh ? "战术跑位图解与示意照片" : "Tactical Diagram / Photo"}</span>
                    </span>
                    {selectedTactic.diagramUrl && (
                      <a
                        href={selectedTactic.diagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-stone-400 hover:text-sky-400 flex items-center space-x-1"
                      >
                        <span>{isZh ? "高清原图" : "Full resolution"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {selectedTactic.diagramUrl ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-950 border border-stone-800 shadow-md flex items-center justify-center p-2 group">
                      <img
                        src={selectedTactic.diagramUrl}
                        alt="Tactical Diagram"
                        className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border border-dashed border-stone-800 bg-stone-900/50 flex flex-col items-center justify-center p-4 text-center">
                      <Camera className="w-8 h-8 text-stone-600 mb-2" />
                      <p className="text-xs text-stone-400 font-medium">
                        {isZh ? "暂未配置跑位图解或挂图照片" : "No diagram attached yet"}
                      </p>
                      {isCoachOrAdmin && (
                        <button
                          onClick={() => setShowMediaModal(true)}
                          className="mt-2 text-xs text-sky-400 hover:underline"
                        >
                          {isZh ? "+ 点击添加示意照片 / 挂图" : "+ Add diagram / photo URL"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tactical Brief & Locker Room Discussion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tactical Overview */}
              <div className="p-5 rounded-2xl bg-[#191919] border border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>{isZh ? "战术核心要旨与实战执行" : "Tactical Core Principles"}</span>
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {isZh
                    ? selectedTactic.descriptionZh || selectedTactic.descriptionEn || "无特定附加说明。"
                    : selectedTactic.descriptionEn || selectedTactic.descriptionZh || "No additional notes provided."}
                </p>

                <div className="mt-4 pt-3 border-t border-stone-800 text-[11px] text-stone-400">
                  <div className="flex justify-between py-1">
                    <span>{isZh ? "主编教练：" : "Head Coach:"}</span>
                    <strong className="text-stone-200">
                      {isZh ? selectedTactic.creator?.nameZh : selectedTactic.creator?.nameEn} ({selectedTactic.creator?.role})
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>{isZh ? "场地制式：" : "Pitch Format:"}</span>
                    <span className="text-stone-300">{selectedTactic.courtFormat}</span>
                  </div>
                </div>
              </div>

              {/* Discussion & Player Notes */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-[#191919] border border-stone-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{isZh ? "战术交流区 · 队员反馈与教练答疑" : "Tactics Discussion & Player Feedback"}</span>
                  </h3>

                  {/* Comment List */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {(!selectedTactic.comments || selectedTactic.comments.length === 0) ? (
                      <p className="text-xs text-stone-500 py-4 text-center">
                        {isZh
                          ? "暂无队内讨论，在下方留言提出你对该战术跑位的建议或疑问。"
                          : "No discussion yet. Post a comment or question below."}
                      </p>
                    ) : (
                      selectedTactic.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-amber-400">
                              {isZh ? comment.user.nameZh : comment.user.nameEn} ({comment.user.role})
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-stone-300">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Comment Input */}
                <form onSubmit={handlePostComment} className="mt-4 pt-3 border-t border-stone-800 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isZh ? "输入战术建议或向教练提问..." : "Type tactical note or question..."}
                    className="flex-1 px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs outline-none focus:border-amber-600 placeholder:text-stone-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center space-x-1 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isZh ? "发送" : "Send"}</span>
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

      {/* Edit Media Modal (Coach / Admin) */}
      {showMediaModal && selectedTactic && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-black text-lg text-stone-100 flex items-center space-x-2">
              <Film className="w-5 h-5 text-amber-400" />
              <span>{isZh ? "配置战术多媒体演示资料" : "Configure Tactical Multimedia"}</span>
            </h3>

            <form onSubmit={handleSaveMedia} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  {isZh ? "示范视频链接 (YouTube / Bilibili / MP4)" : "Video URL (YouTube / Bilibili / MP4)"}
                </label>
                <input
                  type="text"
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/... or /assets/video.mp4"
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  {isZh ? "战术跑位图解 / 挂图照片链接 (SVG / PNG / JPG)" : "Diagram / Photo URL (SVG / PNG / JPG)"}
                </label>
                <input
                  type="text"
                  value={editDiagramUrl}
                  onChange={(e) => setEditDiagramUrl(e.target.value)}
                  placeholder="/assets/drills/crossing-box-combination.svg"
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                >
                  {isZh ? "取消" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold"
                >
                  {isZh ? "保存多媒体" : "Save Media"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Tactic Modal (Coach/Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-stone-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-black text-lg text-stone-100">
              {isZh ? `创建全新 ${sport} 战术白皮书` : `Create New ${sport} Tactic`}
            </h3>

            <form onSubmit={handleCreateTactic} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  {isZh ? "战术中文名称 *" : "Title (Chinese) *"}
                </label>
                <input
                  type="text"
                  required
                  value={newTitleZh}
                  onChange={(e) => setNewTitleZh(e.target.value)}
                  placeholder={isZh ? "如：4-3-3 肋部渗透与快速反击" : "e.g. 4-3-3 Half-Space Penetration"}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  {isZh ? "战术英文名称 *" : "Title (English) *"}
                </label>
                <input
                  type="text"
                  required
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. 4-3-3 Half-Space Overload"
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    {isZh ? "战术场景" : "Scenario"}
                  </label>
                  <input
                    type="text"
                    value={newScenario}
                    onChange={(e) => setNewScenario(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    {isZh ? "场地制式" : "Court Format"}
                  </label>
                  <input
                    type="text"
                    value={newCourtFormat}
                    onChange={(e) => setNewCourtFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  {isZh ? "示范视频链接 (选填)" : "Video URL (Optional)"}
                </label>
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  {isZh ? "示意跑位图解链接 (选填)" : "Diagram / Photo URL (Optional)"}
                </label>
                <input
                  type="text"
                  value={newDiagramUrl}
                  onChange={(e) => setNewDiagramUrl(e.target.value)}
                  placeholder="/assets/drills/crossing-box-combination.svg"
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  {isZh ? "战术原则与执行要点说明" : "Tactical Notes & Principles"}
                </label>
                <textarea
                  rows={3}
                  value={newDescriptionZh}
                  onChange={(e) => setNewDescriptionZh(e.target.value)}
                  placeholder={isZh ? "简述跑位时机、第一出球点以及包抄路线..." : "Describe movement timing, first pass option, box runs..."}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                >
                  {isZh ? "取消" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold"
                >
                  {isZh ? "创建战术白皮书" : "Create Tactic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
