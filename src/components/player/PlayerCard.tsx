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
      className={`relative group rounded-xl cursor-pointer transition-all duration-200 select-none overflow-hidden ${
        isSelected ? "ring-2 ring-[#C5A059] shadow-lg scale-[1.01]" : ""
      } ${
        isHallOfFame
          ? "bg-[#1A130C] border border-[#B59247]/60 shadow-md hover:border-[#C5A059]"
          : isRegularAlumni
          ? "bg-[#131922] border border-stone-700 shadow-md hover:border-stone-500"
          : "bg-[#0E1A14] border border-stone-800 shadow-md hover:border-stone-700"
      } ${isCompact ? "p-3" : "p-4"} hover:-translate-y-0.5`}
    >
      {/* Top Header: Varsity Numeral & Status Badges */}
      <div className="flex items-center justify-between relative z-10 mb-2">
        <div className="flex items-center space-x-1.5">
          <span
            className={`font-serif font-black tracking-tight ${
              isCompact ? "text-xl" : "text-2xl"
            } ${
              isHallOfFame
                ? "text-[#C5A059]"
                : isRegularAlumni
                ? "text-stone-300"
                : "text-stone-100"
            }`}
          >
            #{player.jerseyNumber}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-bold border border-stone-700/60">
            {player.primaryPosition}
          </span>
        </div>

        {/* Status Honor Badges */}
        <div className="flex items-center space-x-1">
          {player.isCaptain && (
            <span
              title={isZh ? "校队正队长" : "Team Captain"}
              className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-200 border border-amber-800/80 shadow-sm"
            >
              <Crown className="w-3 h-3 text-amber-300 fill-amber-300/40" />
              <span>{isZh ? "队长" : "Captain"}</span>
            </span>
          )}

          {player.isViceCaptain && !player.isCaptain && (
            <span
              title={isZh ? "校队副队长" : "Vice Captain"}
              className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700"
            >
              <span>{isZh ? "副队" : "VC"}</span>
            </span>
          )}

          {isHallOfFame && (
            <span
              title={isZh ? "校队退役名宿 (名人堂)" : "Hall of Fame Legend"}
              className="inline-flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-200 border border-amber-700/80 shadow-sm"
            >
              <Award className="w-3 h-3 text-amber-400" />
              <span>{isZh ? "名宿" : "Icon"}</span>
            </span>
          )}

          {isRegularAlumni && (
            <span
              title={isZh ? "毕业校友档案" : "Alumni"}
              className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700"
            >
              <GraduationCap className="w-3 h-3 text-stone-400" />
              <span>{isZh ? "校友" : "Alumni"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Athlete Portrait Container */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-stone-900 border border-stone-800 my-2">
        <img
          src={player.photoUrl || crestFallback}
          alt={isZh ? player.user.nameZh : player.user.nameEn}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />

        {/* Vintage Year Ribbon */}
        {player.graduationYear && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-stone-300 border border-stone-700">
            {player.graduationYear}届
          </div>
        )}
      </div>

      {/* Athlete Identity Details */}
      <div className="mt-2.5 space-y-1">
        <div className="flex items-baseline justify-between">
          <h3 className="font-bold text-sm text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-1">
            {isZh ? player.user.nameZh : player.user.nameEn}
          </h3>
          <span className="text-[11px] text-stone-400 font-mono">
            {isZh ? player.user.nameEn : player.user.nameZh}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-800">
          <span>{isZh ? positionTitleZh : positionTitleEn}</span>
          <span className="font-mono text-[11px] text-stone-400">
            {player.xpPoints || 0} XP
          </span>
        </div>

        {player.honors && !isCompact && (
          <p className="text-[10px] text-amber-200/90 line-clamp-1 italic pt-0.5">
            ★ {player.honors}
          </p>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
