"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { SportChannel } from "@/types";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  Sparkles,
  HeartPulse,
  ChevronRight,
  User,
  ArrowLeft,
  Search,
} from "lucide-react";

interface GuideItem {
  id: string;
  sport: SportChannel;
  bodyPartKey: string;
  modality: string;
  titleZh: string;
  titleEn: string;
  contentZh: string;
  contentEn: string;
  durationNotes?: string | null;
  equipmentNotes?: string | null;
  contraindications?: string | null;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    nameZh: string;
    nameEn: string;
    role: string;
  };
}

export default function UgcReviewPage() {
  const { user, locale } = useApp();
  const isZh = locale === "zh";

  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_REVIEW" | "APPROVED" | "REJECTED">("PENDING_REVIEW");
  const [sportFilter, setSportFilter] = useState<"ALL" | SportChannel>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Reject modal state
  const [rejectingGuide, setRejectingGuide] = useState<GuideItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isPrivileged = user?.role === "ADMIN" || user?.role === "COACH";

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const sportParam = sportFilter === "ALL" ? "FOOTBALL" : sportFilter;
      // Fetch including pending
      const res = await fetch(`/api/recovery?sport=${sportParam}&includePending=true`);
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides || []);
      }
    } catch (err) {
      console.error("Failed to load guides for review:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [sportFilter]);

  const handleUpdateStatus = async (guideId: string, newStatus: "APPROVED" | "REJECTED", reason?: string) => {
    setProcessingId(guideId);
    try {
      const res = await fetch("/api/recovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: guideId,
          status: newStatus,
          rejectionReason: reason || undefined,
        }),
      });

      if (res.ok) {
        setGuides((prev) =>
          prev.map((g) =>
            g.id === guideId
              ? { ...g, status: newStatus, rejectionReason: reason || null }
              : g
          )
        );
        if (rejectingGuide?.id === guideId) {
          setRejectingGuide(null);
          setRejectionReason("");
        }
      }
    } catch (err) {
      console.error("Failed to update guide status:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered guides
  const filtered = guides.filter((g) => {
    if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = g.titleZh.toLowerCase().includes(q) || g.titleEn.toLowerCase().includes(q);
      const matchAuthor = g.author.nameZh.toLowerCase().includes(q) || g.author.username.toLowerCase().includes(q);
      const matchPart = g.bodyPartKey.toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchPart;
    }
    return true;
  });

  const pendingCount = guides.filter((g) => g.status === "PENDING_REVIEW").length;
  const approvedCount = guides.filter((g) => g.status === "APPROVED").length;

  if (!isPrivileged) {
    return (
      <div className="py-24 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">权限不足 (Access Denied)</h2>
        <p className="text-xs text-stone-400">
          UGC 康复白皮书审核中心仅对校队主教练 (COACH) 与竞技总监 (ADMIN) 开放。
        </p>
        <Link
          href="/football"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-amber-600 text-stone-950 font-bold text-xs"
        >
          返回球场主页
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto py-2">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 font-bold">
              UGC REVIEW & CLINICAL GOVERNANCE
            </span>
            <span className="text-xs text-stone-400 font-mono">
              待办待审: <strong className="text-amber-400">{pendingCount}</strong> 条
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-stone-100 flex items-center space-x-2.5">
            <ShieldCheck className="w-7 h-7 text-amber-500" />
            <span>{isZh ? "康复白皮书师生共建审核中心" : "UGC Recovery Review Center"}</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {isZh
              ? "严格把关队员上传的自愈手法、宿舍替代技巧与防拉伤经验，确保符合现代运动医学原则后公开上架"
              : "Review student-athlete crowdsourced recovery substitutes before public publishing"}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isZh ? "搜索标题 / 队员 / 部位..." : "Search title, author, part..."}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-600"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-stone-900/80 border border-stone-800">
        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">状态:</span>
          {(
            [
              { id: "PENDING_REVIEW", labelZh: `待教练审核 (${pendingCount})`, labelEn: "Pending" },
              { id: "APPROVED", labelZh: `已收录上线 (${approvedCount})`, labelEn: "Approved" },
              { id: "ALL", labelZh: "全部记录", labelEn: "All" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-amber-600 text-stone-950 shadow-sm"
                  : "bg-stone-800/80 text-stone-400 hover:text-stone-200"
              }`}
            >
              {isZh ? tab.labelZh : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Sport Channel Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">专区:</span>
          {(
            [
              { id: "ALL", label: "全部专区" },
              { id: "FOOTBALL", label: "⚽ 足球" },
              { id: "VOLLEYBALL", label: "🏐 排球" },
              { id: "BASKETBALL", label: "🏀 篮球" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setSportFilter(s.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                sportFilter === s.id
                  ? "bg-stone-200 text-stone-950 font-bold"
                  : "bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Cards Stream */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 text-xs">
          正在读取待审核共建数据...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#121815] border border-stone-800 text-stone-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-stone-200 text-sm">所有共建条目已审核完毕</h3>
          <p className="text-xs text-stone-500">
            {statusFilter === "PENDING_REVIEW"
              ? "暂无待处理的队员提交，全队康复白皮书运行良好。"
              : "未检索到匹配的记录。"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((guide) => {
            const isPending = guide.status === "PENDING_REVIEW";
            const isApproved = guide.status === "APPROVED";
            const isProcessing = processingId === guide.id;

            return (
              <div
                key={guide.id}
                className="p-5 rounded-2xl bg-[#121815] border border-stone-800 shadow-md flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  {/* Top Meta Strip */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-stone-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-900 text-amber-300 border border-stone-700">
                        {guide.sport}
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-300">
                        部位: {guide.bodyPartKey.toUpperCase()}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPending
                          ? "bg-amber-950/70 text-amber-300 border border-amber-800"
                          : isApproved
                          ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800"
                          : "bg-rose-950/70 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {isPending ? "⏳ 待审核" : isApproved ? "✅ 已上线" : "❌ 已驳回"}
                    </span>
                  </div>

                  {/* Title & Content */}
                  <div className="mt-3">
                    <h3 className="font-serif font-black text-base text-stone-100">
                      {guide.titleZh}
                    </h3>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      {guide.titleEn}
                    </p>

                    <p className="text-xs text-stone-300 mt-2.5 leading-relaxed bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                      {guide.contentZh}
                    </p>

                    {guide.equipmentNotes && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/40 text-xs text-amber-200">
                        <strong>💡 零成本/宿舍替代说明：</strong> {guide.equipmentNotes}
                      </div>
                    )}

                    {guide.contraindications && (
                      <div className="mt-2 text-[11px] text-rose-300 bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                        <strong>⚠️ 禁忌提醒：</strong> {guide.contraindications}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitter & Actions Footer */}
                <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-stone-400 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    <span>
                      提交者: <strong>{guide.author.nameZh}</strong> (@{guide.author.username})
                    </span>
                  </div>

                  {/* Approval / Reject Buttons */}
                  <div className="flex items-center space-x-2">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => setRejectingGuide(guide)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/40 text-rose-300 border border-stone-700 hover:border-rose-700 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          驳回修改
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(guide.id, "APPROVED")}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>批准收录上线</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-stone-500 font-mono">
                        已于 {new Date(guide.createdAt).toLocaleDateString()} 审核归档
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141B18] border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-100 flex items-center space-x-2 mb-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>驳回共建条目：{rejectingGuide.titleZh}</span>
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              请填写针对该拉伸或自愈手法的运动医学指导意见，帮助队员规范动作与安全边界：
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="例：手法偏离肌肉走向，未说明避开急性红肿期，请补充冰敷适应症与安全说明..."
              className="w-full p-3 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-rose-600 mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectingGuide(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold hover:bg-stone-700"
              >
                取消
              </button>
              <button
                onClick={() => handleUpdateStatus(rejectingGuide.id, "REJECTED", rejectionReason)}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold shadow-sm"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
