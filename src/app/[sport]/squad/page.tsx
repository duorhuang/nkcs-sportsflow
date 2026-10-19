"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel, PlayerProfileData } from "@/types";
import PlayerCard from "@/components/player/PlayerCard";
import { Users, Search, Filter, Award, Shield, GraduationCap, X } from "lucide-react";

export default function SquadPage() {
  const params = useParams();
  const currentSport = (params.sport as string)?.toUpperCase() as SportChannel;
  const { locale, t } = useApp();
  const isZh = locale === "zh";

  const [players, setPlayers] = useState<PlayerProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "HALL_OF_FAME" | "ALUMNI_REGULAR">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileData | null>(null);

  useEffect(() => {
    async function fetchSquad() {
      setLoading(true);
      try {
        const res = await fetch(`/api/players?sport=${currentSport}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.profiles || []);
        }
      } catch (err) {
        console.error("Failed to load squad:", err);
      } finally {
        setLoading(false);
      }
    }
    if (currentSport) {
      fetchSquad();
    }
  }, [currentSport]);

  // Filter players by tab & search query
  const filteredPlayers = players.filter((player) => {
    // Tab filter
    if (activeTab === "ACTIVE" && player.isRetired) return false;
    if (activeTab === "HALL_OF_FAME" && (!player.isRetired || player.alumniTier !== "HALL_OF_FAME")) return false;
    if (activeTab === "ALUMNI_REGULAR" && (!player.isRetired || player.alumniTier !== "ALUMNI_REGULAR")) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNameEn = player.user.nameEn.toLowerCase().includes(q);
      const matchNameZh = player.user.nameZh.toLowerCase().includes(q);
      const matchNum = player.jerseyNumber.toString() === q;
      const matchPos = player.primaryPosition.toLowerCase().includes(q);
      return matchNameEn || matchNameZh || matchNum || matchPos;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <Users className="w-7 h-7 text-heritage-antiqueGold" />
            <span>{isZh ? `${currentSport} 球队花名册与名宿殿堂` : `${currentSport} Squad & Hall of Fame`}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "收录历届建队功勋与现役生力军 · 赛后与推演随时调取 · 代际传承永不磨灭"
              : "Honoring active athletes and legendary alumni · Character tray selectable · Permanent legacy"}
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isZh ? "搜索姓名 / 号码 / 位置..." : "Search name, #, position..."}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-heritage-gold/50 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Filter Tabs: 全部 | 现役主力 | 校队名宿 | 毕业校友 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-white/20 text-white shadow-sm border border-white/30"
              : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
          }`}
        >
          {isZh ? `全部成员 (${players.length})` : `All (${players.length})`}
        </button>

        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === "ACTIVE"
              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm"
              : "bg-white/5 text-gray-400 hover:text-emerald-300 border border-white/5"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{isZh ? "现役主力 (Active)" : "Active Squad"}</span>
        </button>

        <button
          onClick={() => setActiveTab("HALL_OF_FAME")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === "HALL_OF_FAME"
              ? "bg-heritage-gold/30 text-heritage-gold border border-heritage-gold/60 shadow-[0_0_12px_rgba(212,175,55,0.3)]"
              : "bg-white/5 text-gray-400 hover:text-heritage-gold border border-white/5"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-heritage-gold" />
          <span>{isZh ? "🏆 校队名宿 (Hall of Fame)" : "Hall of Fame"}</span>
        </button>

        <button
          onClick={() => setActiveTab("ALUMNI_REGULAR")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === "ALUMNI_REGULAR"
              ? "bg-gray-600/30 text-gray-200 border border-gray-400/50"
              : "bg-white/5 text-gray-400 hover:text-gray-200 border border-white/5"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{isZh ? "🎓 毕业校友 (Alumni)" : "Alumni"}</span>
        </button>
      </div>

      {/* Grid of Classical Player Cards */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm">
          {isZh ? "正在加载校队阵容..." : "Loading squad roster..."}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm bg-black/20 rounded-xl border border-white/5">
          {isZh ? "未检索到匹配的队员记录" : "No players match the criteria"}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={() => setSelectedPlayer(player)}
            />
          ))}
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121415] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 mb-4">
              <div className="w-20 h-24 rounded-xl overflow-hidden bg-black/80 border-2 border-heritage-gold/50 shadow-lg shrink-0 flex items-center justify-center">
                {selectedPlayer.photoUrl ? (
                  <img
                    src={selectedPlayer.photoUrl}
                    alt={selectedPlayer.user.nameEn}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span className="font-serif text-2xl font-black text-heritage-gold">
                    #{selectedPlayer.jerseyNumber}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-serif text-xl font-black text-heritage-gold">
                    #{selectedPlayer.jerseyNumber}
                  </span>
                  {selectedPlayer.isCaptain && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50">
                      © 队长
                    </span>
                  )}
                  {selectedPlayer.isRetired && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/20">
                      {selectedPlayer.alumniTier === "HALL_OF_FAME" ? "🏆 终身名宿" : "🎓 已退役校友"}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-serif font-black text-white mt-1">
                  {isZh ? selectedPlayer.user.nameZh : selectedPlayer.user.nameEn}
                </h3>
                <p className="text-xs text-gray-400">
                  {isZh ? selectedPlayer.user.nameEn : selectedPlayer.user.nameZh}
                </p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  {selectedPlayer.primaryPosition} · {selectedPlayer.positionGroup || "位置组"}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-300 border-t border-white/10 pt-4">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">{isZh ? "队员身份状态" : "Status"}</span>
                <span className="font-bold text-white">
                  {selectedPlayer.isRetired
                    ? selectedPlayer.alumniTier === "HALL_OF_FAME"
                      ? "🏆 校队名宿 (Hall of Fame)"
                      : "🎓 毕业校友"
                    : "现役主力队员"}
                </span>
              </div>
              {selectedPlayer.graduationYear && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">{isZh ? "毕业届次" : "Class of"}</span>
                  <span className="font-bold text-white">{selectedPlayer.graduationYear} 届</span>
                </div>
              )}
              {selectedPlayer.honors && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">{isZh ? "所获荣誉" : "Honors"}</span>
                  <span className="font-bold text-amber-300">{selectedPlayer.honors}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-gray-400">{isZh ? "竞技成长经验 (XP)" : "Athletic XP"}</span>
                <span className="font-bold text-emerald-400">{selectedPlayer.xpPoints} XP ({selectedPlayer.cardTier})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
