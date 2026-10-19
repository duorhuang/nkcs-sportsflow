"use client";

import React, { useState } from "react";
import { PlayerProfileData, TacticToken, TokenType } from "@/types";
import { Users, Award, GraduationCap, Flag, Plus, Shield, Check } from "lucide-react";

interface CharacterTrayProps {
  players: PlayerProfileData[];
  onAddToken: (token: TacticToken) => void;
  deployedTokenIds: string[];
}

export default function CharacterTray({
  players,
  onAddToken,
  deployedTokenIds,
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
      x: 500,
      y: 350,
      dutyZh: `${p.user.nameZh} 执行 ${p.primaryPosition} 战术跑位`,
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
    <div className="bg-black/75 border border-white/15 rounded-2xl p-4 shadow-chiseled backdrop-blur-md">
      {/* Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-heritage-gold" />
          <h3 className="font-serif font-black text-sm text-white tracking-wide">
            战术角色选择器 (TACTICAL SQUAD ROSTER)
          </h3>
          <span className="text-[11px] text-gray-400">
            点击调配现役主力与传奇名宿加入战术推演
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>现役主力 ({activePlayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("HOF")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "HOF"
                ? "bg-amber-600 text-white shadow-md"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>🏆 校队名宿 ({hofPlayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ALUMNI")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "ALUMNI"
                ? "bg-slate-600 text-white shadow-md"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>🎓 毕业校友 ({alumniPlayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("TOOLS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "TOOLS"
                ? "bg-heritage-gold text-black shadow-md"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>道具标记</span>
          </button>
        </div>
      </div>

      {/* Character Cards Horizontal Scroll Tray */}
      <div className="pt-3">
        {activeTab === "ACTIVE" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activePlayers.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 flex flex-col justify-between transition-all group hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-black text-heritage-gold text-xs">
                      #{player.jerseyNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {player.primaryPosition}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-xs truncate">
                    {player.user.nameZh}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    {player.user.nameEn}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {player.isCaptain && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        C 队长
                      </span>
                    )}
                    {player.isViceCaptain && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                        VC 副队
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleAddPlayer(player)}
                  className="mt-2.5 w-full py-1 px-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>调入战术</span>
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
                className="p-3 rounded-xl bg-gradient-to-b from-amber-500/10 to-black/60 border border-amber-500/30 hover:border-amber-400 flex flex-col justify-between transition-all group hover:scale-[1.02] shadow-frameGold"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-black text-amber-400 text-xs">
                      #{player.jerseyNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      {player.primaryPosition}
                    </span>
                  </div>

                  <h4 className="font-bold text-amber-200 text-xs truncate flex items-center space-x-1">
                    <span>{player.user.nameZh}</span>
                    <Award className="w-3 h-3 text-amber-400 shrink-0" />
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    {player.user.nameEn}
                  </p>

                  <div className="mt-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 block text-center truncate">
                      🏆 校队名宿 ({player.graduationYear}届)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddPlayer(player)}
                  className="mt-2.5 w-full py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>调入战术</span>
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
                className="p-3 rounded-xl bg-white/5 border border-slate-500/30 hover:border-slate-400 flex flex-col justify-between transition-all group hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-black text-gray-300 text-xs">
                      #{player.jerseyNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 font-bold border border-slate-500/30">
                      {player.primaryPosition}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-xs truncate">
                    {player.user.nameZh}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    {player.user.nameEn}
                  </p>

                  <div className="mt-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 font-bold border border-slate-500/30 block text-center truncate">
                      🎓 {player.graduationYear} 届校友
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddPlayer(player)}
                  className="mt-2.5 w-full py-1 px-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>调入战术</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "TOOLS" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleAddMarker("BALL", "比赛用球")}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all flex items-center space-x-3"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                ⚽
              </div>
              <div>
                <strong className="text-white text-xs block">比赛用球</strong>
                <span className="text-[10px] text-gray-400">添加皮球标记</span>
              </div>
            </button>

            <button
              onClick={() => handleAddMarker("OPPONENT", "对手防守人")}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all flex items-center space-x-3"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm">
                X
              </div>
              <div>
                <strong className="text-white text-xs block">对手防守人</strong>
                <span className="text-[10px] text-gray-400">标记防守对位</span>
              </div>
            </button>

            <button
              onClick={() => handleAddMarker("CONE", "训练标志盘")}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all flex items-center space-x-3"
            >
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center justify-center font-bold text-sm">
                ▲
              </div>
              <div>
                <strong className="text-white text-xs block">标志桶 / 盘</strong>
                <span className="text-[10px] text-gray-400">划定训练区域</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
