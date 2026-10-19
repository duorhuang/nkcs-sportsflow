"use client";

import React from "react";
import { PlayerProfileData } from "@/types";
import { useApp } from "@/context/AppContext";
import { sportsGlossary } from "@/lib/i18n";
import { Shield, Award, Crown, GraduationCap, Star } from "lucide-react";

interface PlayerCardProps {
  player: PlayerProfileData;
  onClick?: () => void;
  isCompact?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, isCompact = false }) => {
  const { locale, sport } = useApp();
  const isZh = locale === "zh";

  const isHallOfFame = player.isRetired && player.alumniTier === "HALL_OF_FAME";
  const isRegularAlumni = player.isRetired && player.alumniTier === "ALUMNI_REGULAR";
  const isActive = !player.isRetired;

  // Position glossary resolution
  const glossary = sportsGlossary[sport] || {};
  const posInfo = glossary[player.primaryPosition];
  const positionTitle = posInfo
    ? isZh ? posInfo.zh : posInfo.en
    : player.primaryPosition;

  // Secondary positions array
  const secondaryPosList = Array.isArray(player.secondaryPositions)
    ? player.secondaryPositions
    : [];

  return (
    <div
      onClick={onClick}
      className={`relative group rounded-xl cursor-pointer transition-all duration-300 select-none overflow-hidden ${
        isHallOfFame
          ? "bg-gradient-to-b from-[#2A2315] via-[#1A160F] to-[#0F0D09] border border-heritage-gold/50 shadow-frameGold hover:scale-[1.02]"
          : isRegularAlumni
          ? "bg-gradient-to-b from-[#222326] via-[#1A1B1D] to-[#121315] border border-heritage-pewter/40 shadow-framePewter hover:scale-[1.02]"
          : "bg-gradient-to-b from-black/40 via-black/60 to-black/80 border border-white/10 hover:border-heritage-antiqueGold/60 shadow-chiseled hover:scale-[1.02]"
      } ${isCompact ? "p-3" : "p-4"}`}
    >
      {/* Background Decorative Crest Aura for Hall of Fame */}
      {isHallOfFame && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-heritage-gold/15 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Top Bar: Jersey Number & Position Abbreviation + Status Badge */}
      <div className="flex items-center justify-between relative z-10 mb-2.5">
        <div className="flex items-baseline space-x-1.5">
          <span
            className={`font-serif font-black tracking-tight ${
              isCompact ? "text-xl" : "text-2xl"
            } ${
              isHallOfFame
                ? "text-gold-foil"
                : isRegularAlumni
                ? "text-silver-foil"
                : "text-white"
            }`}
          >
            #{player.jerseyNumber}
          </span>
          <span className="text-xs font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-gray-200">
            {player.primaryPosition}
          </span>
        </div>

        {/* Status / Honor Seal */}
        <div className="flex items-center space-x-1">
          {player.isCaptain && (
            <span
              title={isZh ? "球队队长" : "Team Captain"}
              className="inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40"
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>{isZh ? "队长" : "Captain"}</span>
            </span>
          )}
          {player.isViceCaptain && !player.isCaptain && (
            <span
              title={isZh ? "副队长" : "Vice-Captain"}
              className="inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40"
            >
              <span>{isZh ? "副队长" : "VC"}</span>
            </span>
          )}
          {isHallOfFame && (
            <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-heritage-gold/20 text-heritage-gold border border-heritage-gold/50 shadow-sm">
              <Award className="w-3 h-3 text-heritage-gold" />
              <span>{isZh ? "校队名宿" : "Hall of Fame"}</span>
            </span>
          )}
          {isRegularAlumni && (
            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-600/30 text-gray-300 border border-gray-500/40">
              <GraduationCap className="w-3 h-3 text-gray-400" />
              <span>{player.graduationYear ? `${player.graduationYear}届` : isZh ? "校友" : "Alumni"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Chiseled Photo Container */}
      <div className="relative z-10 flex flex-col items-center my-1.5">
        <div
          className={`relative rounded-lg overflow-hidden flex items-center justify-center transition-all ${
            isCompact ? "w-20 h-24" : "w-28 h-32"
          } ${
            isHallOfFame
              ? "border-2 border-heritage-gold/60 shadow-[0_0_15px_rgba(212,175,55,0.25)] bg-[#1A150D]"
              : isRegularAlumni
              ? "border border-heritage-pewter/50 shadow-md bg-[#161719]"
              : "border border-white/15 bg-black/40 frame-chiseled"
          }`}
        >
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.user.nameEn}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            /* Classical Collegiate Athletic Silhouette */
            <div className="flex flex-col items-center justify-center text-center p-2">
              <Shield
                className={`w-12 h-12 mb-1 ${
                  isHallOfFame
                    ? "text-heritage-gold/50"
                    : isRegularAlumni
                    ? "text-heritage-pewter/40"
                    : "text-white/25"
                }`}
              />
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                NKCS {sport.slice(0, 3)}
              </span>
            </div>
          )}

          {/* Level / Card Tier Badge */}
          <div className="absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-black/70 text-gray-300 uppercase tracking-wider border border-white/10">
            {player.cardTier}
          </div>
        </div>
      </div>

      {/* Player Names & Role Description */}
      <div className="text-center relative z-10 mt-2">
        <h3
          className={`font-bold tracking-wide truncate ${
            isCompact ? "text-sm" : "text-base"
          } ${isHallOfFame ? "text-heritage-gold font-serif" : "text-white"}`}
        >
          {isZh ? player.user.nameZh : player.user.nameEn}
        </h3>
        <p className="text-[11px] text-gray-400 font-sans truncate">
          {isZh ? player.user.nameEn : player.user.nameZh}
        </p>
        <p className="text-xs font-medium text-emerald-400/90 mt-0.5 truncate">
          {positionTitle}
        </p>
      </div>

      {/* Comfortable Tag Ribbon (胶囊标签带) */}
      <div className="relative z-10 mt-3 flex flex-wrap gap-1.5 justify-center">
        {/* Tactical Group Tag */}
        {player.positionGroup && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10 hover:border-white/20 transition-colors">
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

        {/* Honors or Achievements */}
        {player.honors && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300/90 border border-amber-500/20 flex items-center space-x-1">
            <Star className="w-2.5 h-2.5 text-amber-400" />
            <span className="truncate max-w-[120px]">{player.honors}</span>
          </span>
        )}
      </div>

      {/* XP Progression Bar at Card Footer for Active Players */}
      {isActive && (
        <div className="relative z-10 mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
          <span>XP {player.xpPoints}</span>
          <div className="w-20 bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (player.xpPoints % 500) / 5)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
