"use client";

import React, { useState } from "react";
import { PlayerProfileData, TacticToken, TokenType } from "@/types";
import { Users, Award, GraduationCap, Flag, Plus, Shield, Check, Flame } from "lucide-react";

interface CharacterTrayProps {
  players: PlayerProfileData[];
  onAddToken: (token: TacticToken) => void;
  deployedTokenIds?: string[];
  sport?: string;
}

export default function CharacterTray({
  players,
  onAddToken,
  deployedTokenIds = [],
  sport = "FOOTBALL",
}: CharacterTrayProps) {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HOF" | "ALUMNI" | "TOOLS">("ACTIVE");

  const activePlayers = players.filter((p) => !p.isRetired);
  const hofPlayers = players.filter((p) => p.isRetired && p.alumniTier === "HALL_OF_FAME");
  const alumniPlayers = players.filter((p) => p.isRetired && p.alumniTier !== "HALL_OF_FAME");

  const handleAddPlayer = (p: PlayerProfileData) => {
    const isHoF = p.alumniTier === "HALL_OF_FAME";
    const label = `${p.user.nameZh} ${p.isCaptain ? "(C)" : ""}`;

    const newToken: TacticToken = {
      id: `p_${p.userId}_${Date.now()}`,
      type: "PLAYER",
      label: p.user.nameZh,
      jerseyNumber: p.jerseyNumber,
      position: p.primaryPosition,
      isCaptain: p.isCaptain,
      isRetired: p.isRetired,
      alumniTier: p.alumniTier,
      photoUrl: p.photoUrl,
      x: 500,
      y: 350,
      dutyZh: `${p.user.nameZh} 执行 ${p.primaryPosition} 战术职责`,
      dutyEn: `${p.user.nameEn} execute tactical duty`,
    };

    onAddToken(newToken);
  };

  const handleAddMarker = (type: TokenType, label: string) => {
    const newToken: TacticToken = {
      id: `m_${type.toLowerCase()}_${Date.now()}`,
      type,
      label,
      x: 500,
      y: 350,
      dutyZh: label,
      dutyEn: label,
    };
    onAddToken(newToken);
  };

  return (
    <div className="bg-gradient-to-b from-[#16171A] to-[#0D0E10] border-2 border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
      {/* Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-heritage-gold/20 border border-heritage-gold/50 flex items-center justify-center">
            <Shield className="w-4 h-4 text-heritage-gold" />
          </div>
          <div>
            <h3 className="font-serif font-black text-sm text-white tracking-wider flex items-center space-x-2">
              <span>战术角色选择席</span>
              <span className="text-[10px] font-mono text-heritage-gold tracking-widest font-normal">
                SQUAD ROSTER SELECTION
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">
              调配现役主力、退役校友与传奇名宿加入战术推演沙盘
            </p>
          </div>
        </div>

        {/* Tab Buttons (Game-like Character Select Tabs) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>现役主力 ({activePlayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("HOF")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "HOF"
                ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-[0_0_18px_rgba(245,158,11,0.5)] border border-amber-400"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>🏆 传奇名宿 ({hofPlayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ALUMNI")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "ALUMNI"
                ? "bg-slate-700 text-white shadow-[0_0_15px_rgba(148,163,184,0.3)] border border-slate-400"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-slate-300" />
            <span>🎓 毕业校友 ({alumniPlayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("TOOLS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "TOOLS"
                ? "bg-heritage-gold text-black shadow-md border border-yellow-300"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>战具道具</span>
          </button>
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="pt-3">
        {activeTab === "ACTIVE" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activePlayers.map((player) => (
              <div
                key={player.id}
                className="group p-2.5 rounded-xl bg-gradient-to-b from-[#1A251E] to-[#0D1410] border border-emerald-500/30 hover:border-emerald-400 flex flex-col justify-between transition-all hover:scale-[1.03] shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <div>
                  {/* Photo & Number Header */}
                  <div className="relative rounded-lg overflow-hidden w-full aspect-[4/5] mb-2 bg-black/60 border border-white/10 flex items-center justify-center">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.user.nameEn}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-white/30" />
                    )}

                    {/* Number Overlay */}
                    <span className="absolute top-1 left-1.5 font-serif font-black text-white text-base drop-shadow-md">
                      #{player.jerseyNumber}
                    </span>

                    {/* Position Pill */}
                    <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/75 text-emerald-300 border border-emerald-500/40">
                      {player.primaryPosition}
                    </span>

                    {/* Captain Tag */}
                    {player.isCaptain && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-black shadow-sm">
                        © 队长
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-white text-xs truncate">
                    {player.user.nameZh}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    {player.user.nameEn}
                  </p>
                </div>

                <button
                  onClick={() => handleAddPlayer(player)}
                  className="mt-2 w-full py-1 px-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>调入推演</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "HOF" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {hofPlayers.map((player) => (
              <div
                key={player.id}
                className="group p-2.5 rounded-xl bg-gradient-to-b from-[#2E200C] to-[#140D04] border-2 border-[#E5B842]/70 hover:border-[#FFF0B0] flex flex-col justify-between transition-all hover:scale-[1.03] shadow-[0_0_20px_rgba(229,184,66,0.25)] hover:shadow-[0_0_25px_rgba(229,184,66,0.5)]"
              >
                <div>
                  <div className="relative rounded-lg overflow-hidden w-full aspect-[4/5] mb-2 bg-[#1A1206] border border-[#E5B842]/50 flex items-center justify-center">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.user.nameEn}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Award className="w-8 h-8 text-[#E5B842]/50" />
                    )}

                    <span className="absolute top-1 left-1.5 font-serif font-black text-gold-foil text-base drop-shadow-md">
                      #{player.jerseyNumber}
                    </span>

                    <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500/50">
                      {player.primaryPosition}
                    </span>

                    <span className="absolute bottom-1 left-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-sm">
                      🏆 名宿
                    </span>
                  </div>

                  <h4 className="font-bold text-[#FFF5C0] text-xs truncate flex items-center space-x-1">
                    <span>{player.user.nameZh}</span>
                    <Award className="w-3 h-3 text-[#E5B842] shrink-0" />
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    {player.graduationYear} 届 · 终身荣誉
                  </p>
                </div>

                <button
                  onClick={() => handleAddPlayer(player)}
                  className="mt-2 w-full py-1 px-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors shadow-md"
                >
                  <Plus className="w-3 h-3" />
                  <span>调入推演</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "ALUMNI" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {alumniPlayers.map((player) => (
              <div
                key={player.id}
                className="group p-2.5 rounded-xl bg-gradient-to-b from-[#1C2433] to-[#0E131D] border border-slate-500/40 hover:border-slate-300 flex flex-col justify-between transition-all hover:scale-[1.03] shadow-md"
              >
                <div>
                  <div className="relative rounded-lg overflow-hidden w-full aspect-[4/5] mb-2 bg-[#0C121E] border border-slate-500/30 flex items-center justify-center">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.user.nameEn}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <GraduationCap className="w-8 h-8 text-slate-400/50" />
                    )}

                    <span className="absolute top-1 left-1.5 font-serif font-black text-silver-foil text-base drop-shadow-md">
                      #{player.jerseyNumber}
                    </span>

                    <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-slate-300 border border-slate-500/40">
                      {player.primaryPosition}
                    </span>

                    <span className="absolute bottom-1 left-1 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-700 text-slate-200">
                      🎓 已退役
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-xs truncate">
                    {player.user.nameZh}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    {player.graduationYear} 届校友
                  </p>
                </div>

                <button
                  onClick={() => handleAddPlayer(player)}
                  className="mt-2 w-full py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>调入推演</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "TOOLS" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <button
              onClick={() => handleAddMarker("BALL", "比赛用球")}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400 flex flex-col items-center justify-center text-center space-y-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-400 flex items-center justify-center text-black font-black text-sm shadow-md">
                ⚽
              </div>
              <span className="text-xs font-bold text-white">比赛用球</span>
            </button>

            <button
              onClick={() => handleAddMarker("OPPONENT", "对位防守人 (X1)")}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500 flex flex-col items-center justify-center text-center space-y-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-rose-700 border-2 border-rose-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                X1
              </div>
              <span className="text-xs font-bold text-rose-300">防守人 X1</span>
            </button>

            <button
              onClick={() => handleAddMarker("OPPONENT", "协防中卫 (X2)")}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500 flex flex-col items-center justify-center text-center space-y-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-rose-700 border-2 border-rose-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                X2
              </div>
              <span className="text-xs font-bold text-rose-300">协防人 X2</span>
            </button>

            <button
              onClick={() => handleAddMarker("CONE", "标志碟/锥形桶")}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500 flex flex-col items-center justify-center text-center space-y-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 font-black text-sm shadow-md">
                ▲
              </div>
              <span className="text-xs font-bold text-amber-300">标志盘/桶</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
