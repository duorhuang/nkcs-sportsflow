"use client";

import React from "react";
import { TacticData, SportChannel } from "@/types";

interface TacticPrintViewProps {
  sport: SportChannel;
  tactic: TacticData;
}

export default function TacticPrintView({ sport, tactic }: TacticPrintViewProps) {
  return (
    <div className="hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto min-h-[297mm] font-serif">
      {/* Official Collegiate Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-wider uppercase">
            NKCS ATHLETICS · 战术白皮书手册
          </h1>
          <p className="text-xs text-gray-700 tracking-tight">
            DEPARTMENT OF ATHLETIC EXCELLENCE & TACTICAL STRATEGY
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="font-bold">{sport} · {tactic.courtFormat}</p>
          <p className="text-gray-600">机密战术文件 · 仅限队内传阅</p>
        </div>
      </div>

      {/* Tactic Title & Specs */}
      <div className="mb-6">
        <h2 className="text-xl font-black mb-1">{tactic.titleZh}</h2>
        <p className="text-sm italic text-gray-700 mb-3">{tactic.titleEn}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="font-bold">战术应用场景：</span> {tactic.scenario} |
          <span className="font-bold">阶段数量：</span> {tactic.phases.length} 个推演相位 |
          <span className="font-bold">主教练：</span> {tactic.creator.nameZh} ({tactic.creator.nameEn})
        </div>
      </div>

      {/* Tactical Description */}
      <div className="p-3 bg-gray-100 border border-gray-300 rounded mb-6 text-xs leading-relaxed">
        <strong>战术核心思想与执行原则：</strong>
        <p className="mt-1">{tactic.descriptionZh || tactic.descriptionEn}</p>
      </div>

      {/* Phase Breakdowns */}
      <div className="space-y-6">
        {tactic.phases.map((phase, idx) => (
          <div key={idx} className="border border-gray-300 rounded p-4 break-inside-avoid">
            <h3 className="font-bold text-sm border-b border-gray-200 pb-1 mb-2 flex justify-between">
              <span>{phase.titleZh || `阶段 ${idx + 1}`}</span>
              <span className="text-gray-500 font-normal">{phase.titleEn}</span>
            </h3>
            <p className="text-xs text-gray-700 mb-3">{phase.notesZh || phase.notesEn}</p>

            {/* Token Duties in this phase */}
            <div className="text-xs">
              <strong className="block mb-1 text-gray-800">各位置队员战术职责分工：</strong>
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-[11px]">
                    <th className="p-1 border border-gray-200 w-16">号位/身份</th>
                    <th className="p-1 border border-gray-200 w-24">姓名</th>
                    <th className="p-1 border border-gray-200">具体动作与跑位职责</th>
                  </tr>
                </thead>
                <tbody>
                  {phase.tokens
                    .filter((t) => t.type === "PLAYER")
                    .map((t) => (
                      <tr key={t.id} className="text-[11px]">
                        <td className="p-1 border border-gray-200 font-bold font-mono">
                          #{t.jerseyNumber || "-"} {t.position || ""}
                        </td>
                        <td className="p-1 border border-gray-200 font-bold">
                          {t.label} {t.isCaptain ? "(C)" : ""}
                        </td>
                        <td className="p-1 border border-gray-200 text-gray-700">
                          {t.dutyZh || t.dutyEn || "保持战术位置，随时传接球"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Sign-off Block */}
      <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-500">
        <p>© 2026 南京金陵中学会战术与竞技管理委员会 · 内部技术归档</p>
        <div className="flex space-x-6">
          <span>主教练签名：__________________</span>
          <span>领队/队长确认：__________________</span>
        </div>
      </div>
    </div>
  );
}
