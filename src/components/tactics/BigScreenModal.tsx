"use client";

import React, { useEffect } from "react";
import { TacticData, SportChannel, PlayerProfileData } from "@/types";
import { X, Tv, Shield } from "lucide-react";
import TacticsBoard from "./TacticsBoard";

interface BigScreenModalProps {
  sport: SportChannel;
  tactic: TacticData;
  players?: PlayerProfileData[];
  isOpen: boolean;
  onClose: () => void;
}

export default function BigScreenModal({
  sport,
  tactic,
  players = [],
  isOpen,
  onClose,
}: BigScreenModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-4 sm:p-8 animate-fadeIn overflow-y-auto">
      {/* Top Locker Room Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-heritage-gold/30">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-heritage-gold/20 border border-heritage-gold/40 text-heritage-gold shadow-frameGold">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-heritage-gold/20 text-heritage-gold border border-heritage-gold/40 uppercase">
                📺 更衣室大屏演播模式 (LOCKER ROOM BROADCAST)
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {tactic.courtFormat}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-white mt-1">
              {tactic.titleZh}
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              {tactic.titleEn}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 hover:text-white transition-all hover:scale-105"
          title="退出大屏演播 (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Board Presentation Stage */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        <TacticsBoard
          sport={sport}
          tactic={tactic}
          players={players}
          editable={false}
          onPrintA4={() => window.print()}
        />

        {/* Tactical Principles & Key Coaching Guidelines */}
        <div className="mt-6 p-5 rounded-2xl bg-black/70 border border-white/15">
          <h4 className="text-xs font-bold uppercase tracking-wider text-heritage-gold mb-2 flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>主教练核心战术指令与执行要领 (COACHING DIRECTIVES)</span>
          </h4>
          <p className="text-sm text-gray-200 leading-relaxed">
            {tactic.descriptionZh || tactic.descriptionEn || "全队坚决贯彻战术纪律，注意观察持球队员第一意图，弱侧无球队员保持全速跑位。"}
          </p>
        </div>
      </div>
    </div>
  );
}
