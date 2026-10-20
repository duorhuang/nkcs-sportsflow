"use client";

import React from "react";
import { PlayerProfileData, SportChannel } from "@/types";
import { useApp } from "@/context/AppContext";
import { sportsGlossary } from "@/lib/i18n";

interface PlayerCardProps {
  player?: PlayerProfileData | null;
  demoTier?: "GOLD" | "SILVER" | "BRONZE" | "ICON";
  demoName?: string;
  demoPosition?: string;
  demoJersey?: number;
  demoOvr?: number;
  onClick?: () => void;
  isCompact?: boolean;
  isSelected?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  demoTier,
  demoName,
  demoPosition,
  demoJersey,
  demoOvr,
  onClick,
  isCompact = false,
  isSelected = false,
}) => {
  const { locale, sport } = useApp();
  const isZh = locale === "zh";

  // Derive card tier
  const isHoF = player?.isRetired && player?.alumniTier === "HALL_OF_FAME";
  const tier: "GOLD" | "SILVER" | "BRONZE" | "ICON" =
    demoTier ||
    (isHoF
      ? "ICON"
      : player?.cardTier === "ICON"
      ? "ICON"
      : player?.cardTier === "GOLD"
      ? "GOLD"
      : player?.cardTier === "SILVER"
      ? "SILVER"
      : player?.cardTier === "BRONZE"
      ? "BRONZE"
      : "GOLD"); // Default to prestigious Gold card

  // Calculate dynamic OVR
  const baseOvr =
    demoOvr ||
    (player
      ? 78 +
        (player.cardTier === "ICON" ? 14 : player.cardTier === "GOLD" ? 9 : player.cardTier === "SILVER" ? 4 : 0) +
        (player.isCaptain ? 2 : 0) +
        Math.min(5, Math.floor((player.xpPoints || 0) / 100))
      : 86);

  const position = demoPosition || player?.primaryPosition || "CB";
  const jerseyNumber = demoJersey ?? (player?.jerseyNumber ?? 10);
  const displayNameZh = player?.user?.nameZh || demoName || "校队精英";
  const displayNameEn = player?.user?.nameEn || demoName || "VARSITY PRO";
  const photo = player?.photoUrl || null;

  // Glossaries
  const glossary = sportsGlossary[sport] || {};
  const posInfo = glossary[position];
  const posDisplay = isZh ? (posInfo?.zh || position) : position;

  // Dynamic 6-Attribute Stats tailored per sport (Iconic FC Mobile Grid)
  const getStats = () => {
    const o = baseOvr;
    if (sport === "FOOTBALL") {
      return [
        { label: "PAC", value: o - 2 },
        { label: "DRI", value: o - 4 },
        { label: "SHO", value: o - 6 },
        { label: "DEF", value: o + 1 },
        { label: "PAS", value: o - 3 },
        { label: "PHY", value: o },
      ];
    }
    if (sport === "VOLLEYBALL") {
      return [
        { label: "SRV", value: o - 1 },
        { label: "BLK", value: o + 2 },
        { label: "ATK", value: o },
        { label: "PAS", value: o - 2 },
        { label: "SET", value: o - 3 },
        { label: "REC", value: o + 1 },
      ];
    }
    // BASKETBALL
    return [
      { label: "SPD", value: o - 1 },
      { label: "REB", value: o + 2 },
      { label: "SHT", value: o - 3 },
      { label: "DEF", value: o + 1 },
      { label: "PAS", value: o - 2 },
      { label: "STR", value: o },
    ];
  };

  const stats = getStats();

  // Tier Colors (Authentic Metallic & Matte Foil - ZERO NEON)
  const tierThemes = {
    GOLD: {
      outerBg: "from-[#D8B45B] via-[#EED894] to-[#8C6D23]",
      innerBg: "from-[#1F261F] via-[#141B15] to-[#0D120E]",
      trim: "border-[#C5A059]",
      textAccent: "text-[#EED894]",
      nameplateBg: "from-[#2A2315] via-[#3D321D] to-[#1C170E]",
      nameplateBorder: "border-[#C5A059]/70",
      statsText: "text-[#E6D5AC]",
    },
    SILVER: {
      outerBg: "from-[#CBD5E1] via-[#F1F5F9] to-[#64748B]",
      innerBg: "from-[#1E242B] via-[#13171C] to-[#0A0D10]",
      trim: "border-[#94A3B8]",
      textAccent: "text-[#E2E8F0]",
      nameplateBg: "from-[#222831] via-[#333C48] to-[#181D24]",
      nameplateBorder: "border-[#94A3B8]/70",
      statsText: "text-[#CBD5E1]",
    },
    BRONZE: {
      outerBg: "from-[#B45309] via-[#D97706] to-[#78350F]",
      innerBg: "from-[#261B14] via-[#1A120D] to-[#0F0B08]",
      trim: "border-[#B45309]",
      textAccent: "text-[#FCD34D]",
      nameplateBg: "from-[#2D1B10] via-[#432918] to-[#1F120A]",
      nameplateBorder: "border-[#B45309]/70",
      statsText: "text-[#FDE68A]",
    },
    ICON: {
      outerBg: "from-[#F59E0B] via-[#FEF08A] to-[#B45309]",
      innerBg: "from-[#111317] via-[#090A0C] to-[#040506]",
      trim: "border-[#FDE047]",
      textAccent: "text-[#FDE047]",
      nameplateBg: "from-[#221A0A] via-[#3A2D10] to-[#141005]",
      nameplateBorder: "border-[#FDE047]/80",
      statsText: "text-[#FEF08A]",
    },
  };

  const theme = tierThemes[tier];

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-300 select-none group ${
        isCompact ? "w-44" : "w-full max-w-[260px] mx-auto"
      } ${isSelected ? "scale-105 z-20" : "hover:-translate-y-1 hover:shadow-2xl"}`}
    >
      {/* ================= FC MOBILE OUTER SHIELD BEVEL ================= */}
      <div
        className={`p-[3px] bg-gradient-to-b ${theme.outerBg} shadow-xl transition-all duration-300 ${
          isHoF ? "shadow-amber-950/60" : "shadow-black/70"
        }`}
        style={{
          clipPath: "polygon(14% 0%, 86% 0%, 100% 9%, 100% 89%, 50% 100%, 0% 89%, 0% 9%)",
        }}
      >
        {/* ================= FC MOBILE INNER CARD FACE ================= */}
        <div
          className={`relative bg-gradient-to-b ${theme.innerBg} px-3 pt-3.5 pb-4 overflow-hidden flex flex-col justify-between`}
          style={{
            clipPath: "polygon(13% 0%, 87% 0%, 100% 9%, 100% 89%, 50% 100%, 0% 89%, 0% 9%)",
            minHeight: isCompact ? "270px" : "360px",
          }}
        >
          {/* Authentic Radial Card Texture Lines */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.4)_0%,transparent_65%)]" />
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.08)_8px,rgba(255,255,255,0.08)_16px)]" />

          {/* ================= TOP SECTION: OVR, POS, CREST & CAPTAIN ================= */}
          <div className="relative z-10 flex items-start justify-between">
            {/* Left Stack: OVR & Position & Crest */}
            <div className="flex flex-col items-center leading-none">
              <span className={`font-serif font-black tracking-tighter ${isCompact ? "text-2xl" : "text-3xl"} ${theme.textAccent}`}>
                {baseOvr}
              </span>
              <span className="font-mono font-bold text-[11px] tracking-wider uppercase text-stone-200 mt-0.5">
                {position}
              </span>

              {/* School Crest Shield */}
              <div className="w-5 h-5 mt-1.5 opacity-90">
                <img
                  src={`/assets/crests/nkcs-${sport.toLowerCase()}-crest.svg`}
                  alt="NKCS"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Right: Status Pill or Captain Badge */}
            <div className="flex flex-col items-end space-y-1">
              {player?.isCaptain && (
                <div className="px-1.5 py-0.5 rounded bg-amber-600/30 border border-amber-500/70 text-amber-300 text-[9px] font-black tracking-widest uppercase">
                  © CAP
                </div>
              )}
              {isHoF && (
                <div className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/80 text-amber-300 text-[8px] font-serif font-black tracking-widest uppercase">
                  ICON
                </div>
              )}
              <span className="font-serif font-black text-stone-400 text-xs opacity-60">
                #{jerseyNumber}
              </span>
            </div>
          </div>

          {/* ================= CENTER: ATHLETE PORTRAIT / SILHOUETTE ================= */}
          <div className="relative my-1 flex items-center justify-center flex-1">
            <div className={`relative aspect-[4/5] ${isCompact ? "w-28" : "w-36"} mx-auto flex items-end justify-center overflow-hidden`}>
              {photo ? (
                <img
                  src={photo}
                  alt={displayNameEn}
                  className="w-full h-full object-cover object-top filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                /* Authentic FC Cutout Silhouette with Number */
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-600/70">
                  <div className="w-20 h-20 rounded-full bg-stone-900/80 border border-stone-800 flex items-center justify-center shadow-inner">
                    <span className="font-serif font-black text-2xl text-stone-500">#{jerseyNumber}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono mt-1">NKCS VARSITY</span>
                </div>
              )}
            </div>
          </div>

          {/* ================= LOWER: NAMEPLATE RIBBON ================= */}
          <div className="relative z-10 space-y-2">
            <div
              className={`py-1 px-2.5 rounded bg-gradient-to-r ${theme.nameplateBg} border ${theme.nameplateBorder} text-center shadow-md`}
            >
              <h4 className="font-serif font-black tracking-wider text-stone-100 uppercase text-xs sm:text-sm truncate">
                {isZh ? displayNameZh : displayNameEn}
              </h4>
              <p className="text-[9px] font-mono tracking-widest uppercase text-stone-400 truncate">
                {posDisplay} · NKCS {sport}
              </p>
            </div>

            {/* ================= BOTTOM: THE ICONIC 6-ATTRIBUTE GRID (FC MOBILE) ================= */}
            <div className="pt-1.5 border-t border-stone-800/80">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-center">
                {/* Column 1 */}
                <div className="space-y-0.5 border-r border-stone-800/80 pr-1">
                  {stats.slice(0, 3).map((st) => (
                    <div key={st.label} className="flex items-center justify-between text-[11px] leading-tight">
                      <span className={`font-mono font-black ${theme.statsText}`}>{st.value}</span>
                      <span className="font-mono text-[9px] text-stone-400 font-semibold tracking-wider">{st.label}</span>
                    </div>
                  ))}
                </div>

                {/* Column 2 */}
                <div className="space-y-0.5 pl-1">
                  {stats.slice(3, 6).map((st) => (
                    <div key={st.label} className="flex items-center justify-between text-[11px] leading-tight">
                      <span className={`font-mono font-black ${theme.statsText}`}>{st.value}</span>
                      <span className="font-mono text-[9px] text-stone-400 font-semibold tracking-wider">{st.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Bottom Shield Accent */}
          <div className="h-1" />
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
