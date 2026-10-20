"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel, PlayerProfileData } from "@/types";
import {
  Trophy,
  Calendar,
  MapPin,
  CheckCircle,
  Shield,
  Plus,
  Star,
  Award,
  Sparkles,
  MessageSquare,
  Send,
  UserCheck,
  HeartPulse,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface MatchItem {
  id: string;
  sport: string;
  matchDate: string;
  location: string;
  opponentName: string;
  isHome: boolean;
  ourScore?: number | null;
  opponentScore?: number | null;
  scoreDetails?: string | null;
  linkedTacticIds?: string[];
  debriefs?: any[];
}

export default function MatchesPage() {
  const params = useParams();
  const sport = ((params.sport as string) || "FOOTBALL").toUpperCase() as SportChannel;
  const { user, locale } = useApp();
  const isZh = locale === "zh";

  const isCoachOrAdmin = user?.role === "COACH" || user?.role === "ADMIN";

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [players, setPlayers] = useState<PlayerProfileData[]>([]);
  const [debriefs, setDebriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Match Modal State
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [opponentName, setOpponentName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [location, setLocation] = useState("NKCS 主球场");
  const [isHome, setIsHome] = useState(true);
  const [ourScore, setOurScore] = useState<number | "">("");
  const [opponentScore, setOpponentScore] = useState<number | "">("");

  // New Debrief Modal State
  const [showDebriefModal, setShowDebriefModal] = useState(false);
  const [targetType, setTargetType] = useState<"INDIVIDUAL" | "TEAM">("INDIVIDUAL");
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [debriefRating, setDebriefRating] = useState(9);
  const [debriefHonors, setDebriefHonors] = useState("MATCH_MVP");
  const [debriefQuickTags, setDebriefQuickTags] = useState("高位逼抢积极, 防线统率有力");
  const [debriefPrivateNote, setDebriefPrivateNote] = useState("");
  const [debriefSummaryZh, setDebriefSummaryZh] = useState("");
  const [recBodyParts, setRecBodyParts] = useState<string[]>(["hamstrings", "calves"]);

  // Action item response state for athlete
  const [actionItemNotes, setActionItemNotes] = useState<Record<string, string>>({});
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matchesRes, debriefsRes, playersRes] = await Promise.all([
        fetch(`/api/matches?sport=${sport}`),
        fetch(`/api/debriefs?sport=${sport}`),
        fetch(`/api/players?sport=${sport}&filter=ACTIVE`),
      ]);

      if (matchesRes.ok) {
        const mData = await matchesRes.json();
        setMatches(mData.matches || []);
      }

      if (debriefsRes.ok) {
        const dData = await debriefsRes.json();
        setDebriefs(dData.debriefs || []);
      }

      if (playersRes.ok) {
        const pData = await playersRes.json();
        setPlayers(pData.profiles || []);
        if (pData.profiles && pData.profiles.length > 0) {
          setSelectedAthleteId(pData.profiles[0].userId);
        }
      }
    } catch (err) {
      console.error("Failed to load matches data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sport]);

  // Create Match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentName || !matchDate || !location) return;

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          opponentName,
          matchDate,
          location,
          isHome,
          ourScore: ourScore !== "" ? ourScore : undefined,
          opponentScore: opponentScore !== "" ? opponentScore : undefined,
        }),
      });

      if (res.ok) {
        setShowAddMatch(false);
        setOpponentName("");
        setMatchDate("");
        setOurScore("");
        setOpponentScore("");
        await loadData();
      }
    } catch (err) {
      console.error("Failed to create match:", err);
    }
  };

  // Coach Issues Debrief
  const handleCreateDebrief = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedPlayer = players.find((p) => p.userId === selectedAthleteId);

      const res = await fetch("/api/debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          targetType,
          summaryZh: debriefSummaryZh || "全队在场上坚决执行了赛前部署，攻防转换速度极快。",
          recommendedBodyParts: recBodyParts,
          recipients:
            targetType === "INDIVIDUAL" && selectedPlayer
              ? [
                  {
                    userId: selectedPlayer.userId,
                    profileId: selectedPlayer.id,
                    rating: debriefRating,
                    honors: debriefHonors,
                    quickTags: debriefQuickTags,
                    privateNoteZh: debriefPrivateNote,
                  },
                ]
              : players.map((p) => ({
                  userId: p.userId,
                  profileId: p.id,
                  rating: 8,
                  quickTags: "团队协作出色",
                  privateNoteZh: "表现稳定，注意今晚充分补充水分与睡眠。",
                })),
        }),
      });

      if (res.ok) {
        setShowDebriefModal(false);
        setDebriefPrivateNote("");
        setDebriefSummaryZh("");
        await loadData();
      }
    } catch (err) {
      console.error("Failed to create debrief:", err);
    }
  };

  // Athlete Acknowledges Debrief
  const handleAcknowledge = async (recipientId: string) => {
    const note = actionItemNotes[recipientId] || "";
    setAcknowledgingId(recipientId);

    try {
      const res = await fetch("/api/debriefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          actionItemNote: note,
        }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to acknowledge debrief:", err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase tracking-wider">
              {sport} MATCH CENTER & DEBRIEFS
            </span>
            <span className="text-xs text-gray-400">
              赛程战绩 · 1对1 专属复盘卡 · 疲劳恢复处方
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>{isZh ? `${sport} 比赛中心与全场景即时复盘` : `${sport} Match Center & Debriefs`}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "赛程预告 · 极简比分战报 · 主教练 1对1 私密评价回执 · 战术复盘行动项自勉"
              : "Fixtures & Results · 1-on-1 private debrief cards · Fatigue prescription · Athlete self-reflection"}
          </p>
        </div>

        {isCoachOrAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddMatch(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>录入赛程/比分</span>
            </button>

            <button
              onClick={() => setShowDebriefModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-frameGold transition-all"
            >
              <Award className="w-4 h-4" />
              <span>发放专属复盘卡</span>
            </button>
          </div>
        )}
      </div>

      {/* Fixtures & Results Section */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>最新赛程与战果记录 (FIXTURES & RESULTS)</span>
        </h2>

        {matches.length === 0 ? (
          <div className="p-8 rounded-2xl bg-black/50 border border-dashed border-white/15 text-center text-xs text-gray-400">
            暂无比赛日程记录，教练可点击上方按钮发布最新比赛日程。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m) => {
              const isFinished = m.ourScore !== null && m.ourScore !== undefined;
              const isWin = isFinished && (m.ourScore || 0) > (m.opponentScore || 0);

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-[#121815] border border-stone-800 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFinished
                            ? isWin
                              ? "bg-emerald-950/80 text-emerald-200 border border-emerald-800"
                              : "bg-rose-950/80 text-rose-200 border border-rose-800"
                            : "bg-amber-950/80 text-amber-200 border border-amber-800"
                        }`}
                      >
                        {isFinished
                          ? isWin
                            ? "🏆 胜场 (WIN)"
                            : "战平/未胜"
                          : "⏳ 赛事预告 (UPCOMING)"}
                      </span>
                      <span className="text-stone-400 font-mono text-[11px]">
                        {new Date(m.matchDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="text-left">
                        <strong className="text-base text-white block">
                          NKCS 校队 {m.isHome ? "(主场)" : "(客场)"}
                        </strong>
                      </div>

                      {isFinished ? (
                        <div className="px-3.5 py-1 rounded-xl bg-white/10 font-mono font-black text-lg text-heritage-gold border border-white/15">
                          {m.ourScore} : {m.opponentScore}
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-gray-500 uppercase">
                          VS
                        </div>
                      )}

                      <div className="text-right">
                        <strong className="text-base text-gray-200 block">
                          {m.opponentName}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-gray-400 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span>{m.location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Anytime Debriefing Cards Section */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-heritage-gold flex items-center space-x-2">
              <Star className="w-4 h-4 text-heritage-gold" />
              <span>主教练 1对1 专属复盘卡与行动回执 (1-ON-1 DEBRIEFING DESK)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              赛后私密反馈 · 个性化技术点评 · 疲劳恢复处方 · 运动员行动项回执
            </p>
          </div>
        </div>

        {debriefs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-black/50 border border-white/10 text-center text-xs text-gray-400">
            暂无赛后专属复盘卡。主教练可在比赛或训练结束后，为队员一键下发专属评语与恢复处方。
          </div>
        ) : (
          <div className="space-y-4">
            {debriefs.map((debrief) => (
              <div
                key={debrief.id}
                className="p-5 rounded-2xl bg-black/75 border border-heritage-gold/30 shadow-frameGold space-y-4"
              >
                {/* Debrief Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-heritage-gold" />
                    <div>
                      <span className="text-xs font-bold text-white">
                        {debrief.targetType === "INDIVIDUAL" ? "1对1 专项私密复盘" : "全队战术总结"}
                      </span>
                      <p className="text-[11px] text-gray-400">
                        主教练：{debrief.coach?.nameZh} · {new Date(debrief.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {debrief.recommendedBodyParts && debrief.recommendedBodyParts.length > 0 && (
                    <div className="flex items-center space-x-1.5 text-xs text-rose-300 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30">
                      <HeartPulse className="w-3.5 h-3.5" />
                      <span>
                        赛后重点放松肌群：
                        {debrief.recommendedBodyParts.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Team Summary */}
                {debrief.summaryZh && (
                  <div className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                    <strong className="text-heritage-gold block mb-1">
                      全队整体战术执行概评：
                    </strong>
                    {debrief.summaryZh}
                  </div>
                )}

                {/* Individual Recipient Cards */}
                <div className="space-y-3">
                  {debrief.recipients?.map((rec: any) => {
                    const isMyCard = rec.userId === user?.id;

                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isMyCard
                            ? "bg-gradient-to-r from-heritage-gold/15 via-black/80 to-black/90 border-heritage-gold"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-heritage-gold/20 border border-heritage-gold/40 flex items-center justify-center font-bold text-heritage-gold text-xs">
                              {rec.rating || 9}分
                            </div>
                            <div>
                              <strong className="text-white text-xs block">
                                {rec.user?.nameZh || "队员"}
                                {isMyCard && (
                                  <span className="ml-2 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                                    (你的专属卡)
                                  </span>
                                )}
                              </strong>
                              {rec.honors && (
                                <span className="text-[10px] text-heritage-gold font-bold">
                                  ⭐ {rec.honors}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {rec.quickTags && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                                {rec.quickTags}
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                rec.isRead
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {rec.isRead ? "已领悟回执" : "待领悟"}
                            </span>
                          </div>
                        </div>

                        {/* Private Coaching Note */}
                        {rec.privateNoteZh && (
                          <p className="text-xs text-gray-200 leading-relaxed mb-3">
                            <strong className="text-amber-300">教练寄语：</strong>
                            {rec.privateNoteZh}
                          </p>
                        )}

                        {/* Athlete Acknowledgment Block */}
                        <div className="pt-2 border-t border-white/10">
                          {rec.isRead ? (
                            <div className="text-[11px] text-gray-400 flex items-center space-x-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>
                                队员行动自勉项：
                                <strong className="text-emerald-300 font-normal ml-1">
                                  {rec.actionItemNote || "已认真领悟，保持专注！"}
                                </strong>
                              </span>
                            </div>
                          ) : isMyCard ? (
                            <div className="space-y-2 mt-2">
                              <input
                                type="text"
                                placeholder="输入一句我的下一步改进自勉（如：加强左脚接球前观察）..."
                                value={actionItemNotes[rec.id] || ""}
                                onChange={(e) =>
                                  setActionItemNotes({
                                    ...actionItemNotes,
                                    [rec.id]: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-heritage-gold/50"
                              />
                              <button
                                onClick={() => handleAcknowledge(rec.id)}
                                disabled={acknowledgingId === rec.id}
                                className="px-3 py-1.5 rounded-lg bg-heritage-gold hover:brightness-110 text-black font-bold text-xs flex items-center space-x-1 shadow-md"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>
                                  {acknowledgingId === rec.id ? "提交中..." : "确认领悟并签署回执"}
                                </span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Match Modal */}
      {showAddMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/95 border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-black text-lg text-white">
              录入 {sport} 比赛赛程与比分
            </h3>

            <form onSubmit={handleCreateMatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  对手学校 / 队伍名称 *
                </label>
                <input
                  type="text"
                  required
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  placeholder="如：上海包玉刚实验学校、德威国际学校"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    比赛日期与时间 *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    比赛场地 *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如：NKCS 1号主场"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 py-1">
                <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="homeAway"
                    checked={isHome}
                    onChange={() => setIsHome(true)}
                  />
                  <span>主场比赛</span>
                </label>
                <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="homeAway"
                    checked={!isHome}
                    onChange={() => setIsHome(false)}
                  />
                  <span>客场远征</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    NKCS 得分 (若完赛录入)
                  </label>
                  <input
                    type="number"
                    value={ourScore}
                    onChange={(e) => setOurScore(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="如：3"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    对手得分 (若完赛录入)
                  </label>
                  <input
                    type="number"
                    value={opponentScore}
                    onChange={(e) => setOpponentScore(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="如：1"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMatch(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  保存赛程
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Debrief Modal */}
      {showDebriefModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/95 border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-black text-lg text-white">
              发放主教练专属赛后复盘卡
            </h3>

            <form onSubmit={handleCreateDebrief} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  针对对象
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer text-gray-200">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "INDIVIDUAL"}
                      onChange={() => setTargetType("INDIVIDUAL")}
                    />
                    <span>指定运动员 1对1 私密复盘</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-gray-200">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "TEAM"}
                      onChange={() => setTargetType("TEAM")}
                    />
                    <span>全队集体通报</span>
                  </label>
                </div>
              </div>

              {targetType === "INDIVIDUAL" && (
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    选择受评运动员 *
                  </label>
                  <select
                    value={selectedAthleteId}
                    onChange={(e) => setSelectedAthleteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.userId} className="bg-gray-900">
                        #{p.jerseyNumber} {p.user.nameZh} ({p.primaryPosition}) {p.isCaptain ? "- 队长" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === "INDIVIDUAL" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">
                      本场评级 (1 - 10分)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={debriefRating}
                      onChange={(e) => setDebriefRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">
                      荣誉标签
                    </label>
                    <select
                      value={debriefHonors}
                      onChange={(e) => setDebriefHonors(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    >
                      <option value="MATCH_MVP" className="bg-gray-900">🏆 本场 MVP</option>
                      <option value="MOST_IMPROVED" className="bg-gray-900">⭐ 进步最大之星</option>
                      <option value="DEFENDER_OF_MATCH" className="bg-gray-900">🛡️ 铁血防守核心</option>
                      <option value="EXCELLENT_PLAY" className="bg-gray-900">✨ 表现出色</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  主教练私密寄语与技术改进点 *
                </label>
                <textarea
                  rows={3}
                  required
                  value={debriefPrivateNote}
                  onChange={(e) => setDebriefPrivateNote(e.target.value)}
                  placeholder="如：上半场逼抢非常果决，但下半场体力下降时回防有脱节，今晚注意拉伸腘绳肌并早睡！"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  赛后疲劳智能处方 (推荐针对性放松部位)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["hamstrings", "calves", "quads", "groin", "knees", "shoulders"].map((part) => {
                    const isSelected = recBodyParts.includes(part);
                    return (
                      <button
                        key={part}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setRecBodyParts(recBodyParts.filter((p) => p !== part));
                          } else {
                            setRecBodyParts([...recBodyParts, part]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-xs transition-all ${
                          isSelected
                            ? "bg-rose-600 text-white font-bold"
                            : "bg-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {part}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDebriefModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold"
                >
                  下发复盘卡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
