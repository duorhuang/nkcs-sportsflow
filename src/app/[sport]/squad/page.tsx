"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel, PlayerProfileData } from "@/types";
import PlayerCard from "@/components/player/PlayerCard";
import {
  Users,
  Search,
  Filter,
  Award,
  Shield,
  GraduationCap,
  X,
  LayoutGrid,
  MapPin,
  Flame,
  Crown,
} from "lucide-react";

export default function SquadPage() {
  const params = useParams();
  const currentSport = (params.sport as string)?.toUpperCase() as SportChannel;
  const { locale, t } = useApp();
  const isZh = locale === "zh";

  const [players, setPlayers] = useState<PlayerProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "HALL_OF_FAME" | "ALUMNI_REGULAR">("ALL");
  const [displayMode, setDisplayMode] = useState<"PITCH" | "CARDS">("PITCH");
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

  const activeSquad = players.filter((p) => !p.isRetired);

  // Tactical Pitch Formations Mapping
  const getFormationCoordinates = (index: number, total: number) => {
    if (currentSport === "FOOTBALL") {
      // 4-3-3: GK(1), Def(4), Mid(3), Fwd(3)
      const positions = [
        { x: 10, y: 50 },  // GK
        { x: 28, y: 20 },  // LB
        { x: 26, y: 40 },  // CB
        { x: 26, y: 60 },  // CB
        { x: 28, y: 80 },  // RB
        { x: 48, y: 30 },  // CM
        { x: 44, y: 50 },  // CDM
        { x: 48, y: 70 },  // CM
        { x: 74, y: 22 },  // LW
        { x: 80, y: 50 },  // ST
        { x: 74, y: 78 },  // RW
      ];
      return positions[index % positions.length] || { x: 50, y: 50 };
    }

    if (currentSport === "VOLLEYBALL") {
      // 6-Position Court Rotation
      const positions = [
        { x: 25, y: 75 },  // Pos 1 (Server/Setter)
        { x: 68, y: 75 },  // Pos 2 (Opposite)
        { x: 68, y: 50 },  // Pos 3 (Middle Blocker)
        { x: 68, y: 25 },  // Pos 4 (Outside Hitter)
        { x: 25, y: 25 },  // Pos 5 (Left Back / Libero)
        { x: 25, y: 50 },  // Pos 6 (Middle Back)
      ];
      return positions[index % positions.length] || { x: 50, y: 50 };
    }

    // BASKETBALL (5-man unit)
    const positions = [
      { x: 28, y: 50 },  // PG
      { x: 48, y: 24 },  // SG
      { x: 48, y: 76 },  // SF
      { x: 72, y: 32 },  // PF
      { x: 78, y: 50 },  // C
    ];
    return positions[index % positions.length] || { x: 50, y: 50 };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-stone-100 flex items-center space-x-2.5">
            <Users className="w-7 h-7 text-amber-500" />
            <span>{isZh ? `${currentSport} 球队花名册与名宿殿堂` : `${currentSport} Squad & Hall of Fame`}</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {isZh
              ? "收录历届建队功勋与现役生力军 · 赛后与推演随时调取 · 阵型站位俯瞰与卡牌合辑"
              : "Active varsity lineup, legend hall of fame, and interactive pitch formation view"}
          </p>
        </div>

        {/* Search input & View Mode Toggle */}
        <div className="flex items-center space-x-2.5">
          <div className="relative w-full md:w-56">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isZh ? "搜索姓名 / 号码..." : "Search name, #..."}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-600 placeholder:text-stone-500"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold">
            <button
              onClick={() => setDisplayMode("PITCH")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                displayMode === "PITCH"
                  ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isZh ? "球场站位" : "Pitch View"}</span>
            </button>
            <button
              onClick={() => setDisplayMode("CARDS")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                displayMode === "CARDS"
                  ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isZh ? "卡片流" : "Card Grid"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 1. PITCH FORMATION VIEW (俯瞰球场阵容视图) ================= */}
      {displayMode === "PITCH" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-stone-200 uppercase tracking-wider">
                {currentSport === "FOOTBALL"
                  ? "⚽ 4-3-3 经典进攻阵型站位"
                  : currentSport === "VOLLEYBALL"
                  ? "🏐 5-1 二传轮转六点位"
                  : "🏀 1-2-2 阵地突破攻防站位"}
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                {activeSquad.length} 名现役主力已落位
              </span>
            </div>
            <span className="text-stone-400 text-[11px]">点击场上任意球员弹出详细档案</span>
          </div>

          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-[#0F241A] select-none">
            {/* Pitch Background SVG */}
            <svg viewBox="0 0 1000 625" className="w-full h-full pointer-events-none">
              {currentSport === "FOOTBALL" && (
                <g opacity="0.6">
                  <rect width="1000" height="625" fill="#0E2419" />
                  {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((x, i) => (
                    <rect key={x} x={x} y="0" width="100" height="625" fill={i % 2 === 0 ? "#122E20" : "#0E2419"} />
                  ))}
                  <rect x="30" y="30" width="940" height="565" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
                  <line x1="500" y1="30" x2="500" y2="595" stroke="#FFFFFF" strokeWidth="2.5" />
                  <circle cx="500" cy="312" r="75" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
                  <rect x="30" y="160" width="150" height="305" fill="none" stroke="#FFFFFF" strokeWidth="2" />
                  <rect x="820" y="160" width="150" height="305" fill="none" stroke="#FFFFFF" strokeWidth="2" />
                </g>
              )}

              {currentSport === "VOLLEYBALL" && (
                <g opacity="0.6">
                  <rect width="1000" height="625" fill="#141E28" />
                  <rect x="120" y="90" width="760" height="445" fill="#8C3F1B" stroke="#FFFFFF" strokeWidth="3" />
                  <line x1="500" y1="90" x2="500" y2="535" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="4 2" />
                  <line x1="373" y1="90" x2="373" y2="535" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="6 4" />
                  <line x1="627" y1="90" x2="627" y2="535" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="6 4" />
                </g>
              )}

              {currentSport === "BASKETBALL" && (
                <g opacity="0.6">
                  <rect width="1000" height="625" fill="#20140E" />
                  <rect x="40" y="40" width="920" height="545" fill="none" stroke="#C5A059" strokeWidth="3" />
                  <line x1="500" y1="40" x2="500" y2="585" stroke="#C5A059" strokeWidth="3" />
                  <circle cx="500" cy="312" r="70" fill="none" stroke="#C5A059" strokeWidth="3" />
                  <rect x="40" y="210" width="160" height="205" fill="#5E2A12" fillOpacity="0.4" stroke="#C5A059" strokeWidth="2.5" />
                  <rect x="800" y="210" width="160" height="205" fill="#5E2A12" fillOpacity="0.4" stroke="#C5A059" strokeWidth="2.5" />
                </g>
              )}
            </svg>

            {/* Positioned Athlete Tokens */}
            <div className="absolute inset-0">
              {activeSquad.slice(0, currentSport === "FOOTBALL" ? 11 : currentSport === "VOLLEYBALL" ? 6 : 5).map((player, idx) => {
                const pos = getFormationCoordinates(idx, activeSquad.length);

                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center transition-transform hover:scale-110 z-20"
                  >
                    <div className="relative">
                      {/* Athlete Circular Avatar */}
                      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden bg-stone-950 border-2 border-stone-300 group-hover:border-amber-400 shadow-xl flex items-center justify-center">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.user.nameEn}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <span className="font-serif font-black text-amber-400 text-sm">
                            #{player.jerseyNumber}
                          </span>
                        )}
                      </div>

                      {/* Captain Badge */}
                      {player.isCaptain && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-black text-[9px] flex items-center justify-center border border-stone-900 shadow-sm">
                          C
                        </span>
                      )}

                      {/* Number Tag */}
                      <span className="absolute -bottom-1 -right-1 px-1 rounded bg-stone-900 text-white font-mono font-bold text-[9px] border border-stone-700">
                        #{player.jerseyNumber}
                      </span>
                    </div>

                    {/* Name Pill */}
                    <div className="mt-1 px-2 py-0.5 rounded-md bg-stone-950/90 border border-stone-800 text-[10px] text-stone-200 font-bold whitespace-nowrap shadow-md group-hover:bg-amber-600 group-hover:text-stone-950 transition-colors">
                      {player.user.nameZh} · {player.primaryPosition}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. CARDS GRID VIEW (名宿与阵容切换栏) ================= */}
      {displayMode === "CARDS" && (
        <div className="space-y-4">
          {/* Filter Tabs: 全部 | 现役主力 | 校队名宿 | 毕业校友 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "ALL"
                  ? "bg-stone-200 text-stone-950 font-black shadow-sm"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              {isZh ? `全部成员 (${players.length})` : `All (${players.length})`}
            </button>

            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === "ACTIVE"
                  ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isZh ? "现役主力 (Active)" : "Active Squad"}</span>
            </button>

            <button
              onClick={() => setActiveTab("HALL_OF_FAME")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === "HALL_OF_FAME"
                  ? "bg-amber-950/80 text-amber-200 border border-amber-700/80 font-black shadow-sm"
                  : "bg-stone-900 text-stone-400 hover:text-amber-300 border border-stone-800"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{isZh ? "🏆 校队名宿 (Hall of Fame)" : "Hall of Fame"}</span>
            </button>

            <button
              onClick={() => setActiveTab("ALUMNI_REGULAR")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === "ALUMNI_REGULAR"
                  ? "bg-stone-800 text-stone-200 border border-stone-700 font-bold"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{isZh ? "🎓 毕业校友 (Alumni)" : "Alumni"}</span>
            </button>
          </div>

          {/* Grid of Classical Player Cards */}
          {loading ? (
            <div className="py-20 text-center text-stone-400 text-sm">
              {isZh ? "正在加载校队阵容..." : "Loading squad roster..."}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-sm bg-stone-900/40 rounded-xl border border-stone-800">
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
        </div>
      )}

      {/* ================= 3. PLAYER DOSSIER MODAL (球员档案弹窗) ================= */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141B18] border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 mb-4">
              <div className="w-20 h-24 rounded-xl overflow-hidden bg-stone-950 border border-stone-700 shadow-md shrink-0 flex items-center justify-center">
                {selectedPlayer.photoUrl ? (
                  <img
                    src={selectedPlayer.photoUrl}
                    alt={selectedPlayer.user.nameEn}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span className="font-serif text-2xl font-black text-amber-400">
                    #{selectedPlayer.jerseyNumber}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-serif text-xl font-black text-amber-400">
                    #{selectedPlayer.jerseyNumber}
                  </span>
                  {selectedPlayer.isCaptain && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-200 border border-amber-700/80">
                      © 队长
                    </span>
                  )}
                  {selectedPlayer.isRetired && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                      {selectedPlayer.alumniTier === "HALL_OF_FAME" ? "🏆 终身名宿" : "🎓 毕业校友"}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-serif font-black text-stone-100 mt-1">
                  {isZh ? selectedPlayer.user.nameZh : selectedPlayer.user.nameEn}
                </h3>
                <p className="text-xs text-stone-400">
                  {isZh ? selectedPlayer.user.nameEn : selectedPlayer.user.nameZh}
                </p>
                <p className="text-xs text-amber-300 font-semibold mt-1">
                  {selectedPlayer.primaryPosition} · {selectedPlayer.positionGroup || "主力位置组"}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-300 border-t border-stone-800 pt-4">
              <div className="flex justify-between py-1 border-b border-stone-800/80">
                <span className="text-stone-400">{isZh ? "队员身份状态" : "Status"}</span>
                <span className="font-bold text-stone-100">
                  {selectedPlayer.isRetired
                    ? selectedPlayer.alumniTier === "HALL_OF_FAME"
                      ? "🏆 校队名宿 (Hall of Fame)"
                      : "🎓 毕业校友"
                    : "现役主力队员"}
                </span>
              </div>
              {selectedPlayer.graduationYear && (
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">{isZh ? "毕业届次" : "Class of"}</span>
                  <span className="font-bold text-stone-100">{selectedPlayer.graduationYear} 届</span>
                </div>
              )}
              {selectedPlayer.honors && (
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-400">{isZh ? "所获荣誉" : "Honors"}</span>
                  <span className="font-bold text-amber-300">{selectedPlayer.honors}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-stone-400">{isZh ? "竞技成长经验 (XP)" : "Athletic XP"}</span>
                <span className="font-bold text-amber-400">{selectedPlayer.xpPoints} XP ({selectedPlayer.cardTier})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
