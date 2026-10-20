"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { SportChannel, PlayerProfileData } from "@/types";
import {
  Settings,
  Plus,
  Shield,
  Award,
  Crown,
  GraduationCap,
  Save,
  Trash2,
  Edit2,
  Check,
  X,
  UserPlus,
} from "lucide-react";

export default function RosterAdminPage() {
  const { locale, user, authLoading } = useApp();
  const isZh = locale === "zh";

  const [currentSport, setCurrentSport] = useState<SportChannel>("FOOTBALL");
  const [players, setPlayers] = useState<PlayerProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New player form fields
  const [nameZh, setNameZh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("player123");
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [primaryPosition, setPrimaryPosition] = useState("CB");
  const [positionGroup, setPositionGroup] = useState("Backline (护卫组)");
  const [honors, setHonors] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [isViceCaptain, setIsViceCaptain] = useState(false);
  const [isRetired, setIsRetired] = useState(false);
  const [alumniTier, setAlumniTier] = useState<"HALL_OF_FAME" | "ALUMNI_REGULAR">("HALL_OF_FAME");
  const [graduationYear, setGraduationYear] = useState<number>(2024);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/players?sport=${currentSport}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.profiles || []);
      }
    } catch (err) {
      console.error("Failed to load roster:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [currentSport]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: currentSport,
          nameZh,
          nameEn,
          username: username.trim() || undefined,
          password: password || "player123",
          jerseyNumber,
          primaryPosition,
          positionGroup,
          honors: honors || undefined,
          isCaptain,
          isViceCaptain,
          isRetired,
          alumniTier: isRetired ? alumniTier : undefined,
          graduationYear: isRetired ? graduationYear : undefined,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset form
        setNameZh("");
        setNameEn("");
        setUsername("");
        setIsCaptain(false);
        setIsViceCaptain(false);
        setIsRetired(false);
        await fetchRoster();
      }
    } catch (err) {
      console.error("Failed to add player:", err);
    }
  };

  const toggleCaptain = async (player: PlayerProfileData) => {
    try {
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: player.id,
          isCaptain: !player.isCaptain,
        }),
      });
      if (res.ok) fetchRoster();
    } catch (err) {
      console.error("Failed to toggle captain:", err);
    }
  };

  const toggleRetired = async (player: PlayerProfileData) => {
    try {
      const willRetire = !player.isRetired;
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: player.id,
          isRetired: willRetire,
          alumniTier: willRetire ? "HALL_OF_FAME" : null,
          graduationYear: willRetire ? new Date().getFullYear() : null,
        }),
      });
      if (res.ok) fetchRoster();
    } catch (err) {
      console.error("Failed to toggle retirement:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm">
        {isZh ? "正在验证管理员权限..." : "Verifying administrator permissions..."}
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="py-20 text-center text-rose-400 text-sm">
        {isZh ? "访问受限：需要管理员最高权限" : "Access Denied: Admin authorization required"}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <Settings className="w-7 h-7 text-purple-400" />
            <span>{isZh ? "花名册全局录入与代际管理中心" : "Roster Admin & Alumni Center"}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "按队独立管理队员信息 · 授予队长勋章 · 设定校队名宿与毕业届次 · 永久载入校史"
              : "Independent team rosters · Captain crest assignment · Hall of Fame & Alumni designation"}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 shadow-md shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isZh ? "录入新队员" : "Add Player"}</span>
        </button>
      </div>

      {/* Sport Selector Chips */}
      <div className="flex items-center space-x-2">
        {(["FOOTBALL", "VOLLEYBALL", "BASKETBALL"] as SportChannel[]).map((s) => (
          <button
            key={s}
            onClick={() => setCurrentSport(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              currentSport === s
                ? "bg-purple-600 text-white shadow-md border border-purple-400"
                : "bg-black/40 text-gray-400 hover:text-white border border-white/10"
            }`}
          >
            <span>{s === "FOOTBALL" ? "⚽ 足球" : s === "VOLLEYBALL" ? "🏐 排球" : "🏀 篮球"}</span>
            <span className="text-[10px] opacity-75">({s})</span>
          </button>
        ))}
      </div>

      {/* Roster Table */}
      <div className="bg-[#121815] border border-stone-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-200">
            <thead className="bg-white/5 uppercase text-[10px] tracking-wider text-gray-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3"># 球衣</th>
                <th className="px-4 py-3">姓名 (中/EN)</th>
                <th className="px-4 py-3">账号用户名</th>
                <th className="px-4 py-3">位置与群组</th>
                <th className="px-4 py-3">队长身份</th>
                <th className="px-4 py-3">现役 / 退役传承</th>
                <th className="px-4 py-3">XP 经验 / 卡牌</th>
                <th className="px-4 py-3 text-right">快捷操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    {isZh ? "正在加载花名册..." : "Loading roster..."}
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    {isZh ? "当前专区暂无录入的队员信息" : "No players in this sport"}
                  </td>
                </tr>
              ) : (
                players.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 font-serif font-black text-sm text-heritage-antiqueGold">
                      #{p.jerseyNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white">{p.user.nameZh}</div>
                      <div className="text-[11px] text-gray-400">{p.user.nameEn}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-gray-400">
                      {p.user.username}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-emerald-400 mr-2">{p.primaryPosition}</span>
                      <span className="text-[11px] text-gray-400">{p.positionGroup || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.isCaptain ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>队长</span>
                        </span>
                      ) : p.isViceCaptain ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] border border-blue-500/40">
                          <span>副队长</span>
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">队员</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {p.isRetired ? (
                        p.alumniTier === "HALL_OF_FAME" ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-heritage-gold/20 text-heritage-gold font-bold text-[10px] border border-heritage-gold/50">
                            <Award className="w-3 h-3 text-heritage-gold" />
                            <span>校队名宿 · {p.graduationYear}届</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gray-600/30 text-gray-300 font-semibold text-[10px] border border-gray-500/40">
                            <GraduationCap className="w-3 h-3" />
                            <span>毕业校友 · {p.graduationYear}届</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                          <span>现役主力</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-gray-300">{p.xpPoints} XP</span>
                      <span className="text-[10px] ml-1.5 px-1 py-0.2 bg-white/10 rounded uppercase text-gray-400">
                        {p.cardTier}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => toggleCaptain(p)}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-amber-300 transition-colors"
                        title="切换队长状态"
                      >
                        {p.isCaptain ? "取消队长" : "设为队长"}
                      </button>
                      <button
                        onClick={() => toggleRetired(p)}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-purple-300 transition-colors"
                        title="切换退役传承状态"
                      >
                        {p.isRetired ? "转为现役" : "退役入殿"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141618] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>{isZh ? `录入 ${currentSport} 队员档案` : `Add Player to ${currentSport}`}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlayer} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">中文姓名 *</label>
                  <input
                    type="text"
                    required
                    value={nameZh}
                    onChange={(e) => setNameZh(e.target.value)}
                    placeholder="如：赵刚"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">英文姓名 *</label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Zhao Gang"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    账号登录用户名 * <span className="text-xs text-amber-400 font-normal">(学号/专属账号)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="如: zhangwei, liufeng 等，不可为空"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">默认初始密码</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="player123"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">球衣号码 *</label>
                  <input
                    type="number"
                    required
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">主打位置 *</label>
                  <input
                    type="text"
                    required
                    value={primaryPosition}
                    onChange={(e) => setPrimaryPosition(e.target.value.toUpperCase())}
                    placeholder="CB / OH / PG"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">位置群组</label>
                  <input
                    type="text"
                    value={positionGroup}
                    onChange={(e) => setPositionGroup(e.target.value)}
                    placeholder="如：护卫组"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">所获赛事荣誉 / 备注</label>
                <input
                  type="text"
                  value={honors}
                  onChange={(e) => setHonors(e.target.value)}
                  placeholder="如：2024 Cup MVP, 最佳防守球员"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                />
              </div>

              <div className="flex items-center space-x-6 py-2 border-y border-white/10">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCaptain}
                    onChange={(e) => setIsCaptain(e.target.checked)}
                    className="rounded bg-black/50 border-white/20 text-amber-500 focus:ring-0"
                  />
                  <span className="text-gray-200">球队队长 (Captain)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isViceCaptain}
                    onChange={(e) => setIsViceCaptain(e.target.checked)}
                    className="rounded bg-black/50 border-white/20 text-blue-500 focus:ring-0"
                  />
                  <span className="text-gray-200">副队长 (Vice-Captain)</span>
                </label>
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRetired}
                    onChange={(e) => setIsRetired(e.target.checked)}
                    className="rounded bg-black/50 border-white/20 text-purple-500 focus:ring-0"
                  />
                  <span className="text-gray-200 font-bold">该队员已退役 / 载入校史档案</span>
                </label>

                {isRetired && (
                  <div className="grid grid-cols-2 gap-3 pl-6 pt-1">
                    <div>
                      <label className="block text-gray-300 font-bold mb-1">传承层级</label>
                      <select
                        value={alumniTier}
                        onChange={(e) => setAlumniTier(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                      >
                        <option value="HALL_OF_FAME">🏆 校队名宿 (Hall of Fame)</option>
                        <option value="ALUMNI_REGULAR">🎓 毕业校友 (Alumni Regular)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 font-bold mb-1">毕业届次年份</label>
                      <input
                        type="number"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  保存录入档案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
