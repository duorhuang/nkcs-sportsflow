"use client";

import React from "react";
import { PlayerProfileData } from "@/types";
import { useApp } from "@/context/AppContext";
import { sportsGlossary } from "@/lib/i18n";
import { Shield, Award, Crown, GraduationCap, Star, Sparkles } from "lucide-react";

interface PlayerCardProps {
  player: PlayerProfileData;
  onClick?: () => void;
  isCompact?: boolean;
  isSelected?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onClick,
  isCompact = false,
  isSelected = false,
}) => {
  const { locale, sport } = useApp();
  const isZh = locale === "zh";

  const isHallOfFame = player.isRetired && player.alumniTier === "HALL_OF_FAME";
  const isRegularAlumni = player.isRetired && player.alumniTier !== "HALL_OF_FAME";
  const isActive = !player.isRetired;

  // Position glossary resolution
  const glossary = sportsGlossary[sport] || {};
  const posInfo = glossary[player.primaryPosition];
  const positionTitleZh = posInfo ? posInfo.zh : player.primaryPosition;
  const positionTitleEn = posInfo ? posInfo.en : player.primaryPosition;

  // Secondary positions array
  const secondaryPosList = Array.isArray(player.secondaryPositions)
    ? player.secondaryPositions
    : [];

  const crestFallback = `/assets/crests/nkcs-${sport.toLowerCase()}-crest.svg`;

  return (
    <div
      onClick={onClick}
      className={`relative group rounded-2xl cursor-pointer transition-all duration-300 select-none overflow-hidden ${
        isSelected ? "ring-2 ring-heritage-gold shadow-[0_0_25px_rgba(229,184,66,0.5)] scale-[1.02]" : ""
      } ${
        isHallOfFame
          ? "bg-gradient-to-b from-[#2B1D0E] via-[#1B1208] to-[#0A0703] border-2 border-[#E5B842]/70 shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:border-[#F5D061] hover:shadow-[0_0_30px_rgba(229,184,66,0.35)]"
          : isRegularAlumni
          ? "bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] border border-[#94A3B8]/60 shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:border-slate-300 hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]"
          : "bg-gradient-to-b from-[#121E17] via-[#0A140F] to-[#050B08] border border-[#34D399]/40 shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:border-[#34D399]/80 hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]"
      } ${isCompact ? "p-3" : "p-4.5"} hover:-translate-y-1`}
    >
      {/* Hall of Fame Gold Aura & Laurel Background Pattern */}
      {isHallOfFame && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#E5B842]/20 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Ornate Card Corner Filigree Accents (Classical Heritage) */}
      <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-white/20 pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-white/20 pointer-events-none" />
      <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-white/20 pointer-events-none" />
      <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-white/20 pointer-events-none" />

      {/* Top Header: Varsity Numeral & Status Badges */}
      <div className="flex items-center justify-between relative z-10 mb-2">
        <div className="flex items-center space-x-1.5">
          <span
            className={`font-serif font-black tracking-tight ${
              isCompact ? "text-xl" : "text-2xl"
            } ${
              isHallOfFame
                ? "text-gold-foil drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                : isRegularAlumni
                ? "text-silver-foil"
                : "text-white"
            }`}
          >
            #{player.jerseyNumber}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-bold">
            {player.primaryPosition}
          </span>
        </div>

        {/* Status Honor Badges */}
        <div className="flex items-center space-x-1">
          {/* Captain Brass Ribbon */}
          {player.isCaptain && (
            <span
              title={isZh ? "校队正队长" : "Team Captain"}
              className="inline-flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-amber-200 border border-amber-400/60 shadow-sm"
            >
              <Crown className="w-3 h-3 text-amber-300 fill-amber-300/40" />
              <span>{isZh ? "队长" : "Captain"}</span>
            </span>
          )}

          {player.isViceCaptain && !player.isCaptain && (
            <span
              title={isZh ? "校队副队长" : "Vice-Captain"}
              className="inline-flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/50"
            >
              <span>{isZh ? "副队" : "VC"}</span>
            </span>
          )}

          {/* Hall of Fame Gold Shield */}
          {isHallOfFame && (
            <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#C69214]/30 text-[#FFF5C0] border border-[#E5B842]/70 shadow-md">
              <Award className="w-3 h-3 text-[#E5B842]" />
              <span>{isZh ? "终身名宿" : "Hall of Fame"}</span>
            </span>
          )}

          {/* Regular Alumni Silver Seal */}
          {isRegularAlumni && (
            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-200 border border-slate-400/50">
              <GraduationCap className="w-3 h-3 text-slate-300" />
              <span>{player.graduationYear ? `${player.graduationYear}届` : isZh ? "校友" : "Alumni"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Central Classical Portrait Frame */}
      <div className="relative z-10 flex flex-col items-center my-2">
        <div
          className={`relative rounded-xl overflow-hidden flex items-center justify-center transition-all ${
            isCompact ? "w-24 h-28" : "w-32 h-40"
          } ${
            isHallOfFame
              ? "border-2 border-[#E5B842]/80 shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(229,184,66,0.3)] bg-[#1A1206]"
              : isRegularAlumni
              ? "border-2 border-[#94A3B8]/60 shadow-[0_4px_16px_rgba(0,0,0,0.8)] bg-[#0B111C]"
              : "border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.8)] bg-black/60"
          }`}
        >
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.user.nameEn}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-3">
              <img
                src={crestFallback}
                alt="Crest"
                className="w-16 h-16 object-contain opacity-70 group-hover:opacity-90 transition-opacity"
              />
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 mt-1">
                NKCS {sport.slice(0, 3)}
              </span>
            </div>
          )}

          {/* Retired Ribbon Overlay at Corner if Retired */}
          {player.isRetired && (
            <div className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
              {isHallOfFame ? (isZh ? "名宿" : "LEGEND") : (isZh ? "已退役" : "RETIRED")}
            </div>
          )}

          {/* Card Tier Tag */}
          <div className="absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-black/80 text-gray-200 border border-white/10 uppercase tracking-wider backdrop-blur-sm">
            {player.cardTier}
          </div>
        </div>
      </div>

      {/* Position & Role Banner Directly Below Photo (舒适醒目) */}
      <div className="relative z-10 text-center my-1">
        <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-300 tracking-wide shadow-sm">
          {positionTitleZh} · {positionTitleEn}
        </div>
      </div>

      {/* Player Names */}
      <div className="text-center relative z-10 mt-1">
        <h3
          className={`font-serif font-black tracking-wide truncate ${
            isCompact ? "text-sm" : "text-base"
          } ${isHallOfFame ? "text-gold-foil" : "text-white"}`}
        >
          {isZh ? player.user.nameZh : player.user.nameEn}
        </h3>
        <p className="text-[11px] text-gray-400 font-sans truncate">
          {isZh ? player.user.nameEn : player.user.nameZh}
        </p>
      </div>

      {/* Tactical Tags & Honors Ribbon */}
      <div className="relative z-10 mt-2.5 flex flex-wrap gap-1.5 justify-center">
        {/* Position Group Tag */}
        {player.positionGroup && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
            {player.positionGroup}
          </span>
        )}

        {/* Secondary Positions */}
        {secondaryPosList.map((pos) => (
          <span
            key={pos}
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10"
          >
            {pos}
          </span>
        ))}

        {/* Honors or Career Achievements */}
        {player.honors && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            <span className="truncate max-w-[140px]">{player.honors}</span>
          </span>
        )}
      </div>

      {/* Card Footer: Career XP Progress for Active Athletes */}
      {isActive && (
        <div className="relative z-10 mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
          <span className="font-mono">XP {player.xpPoints}</span>
          <div className="w-24 bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (player.xpPoints % 500) / 5)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
