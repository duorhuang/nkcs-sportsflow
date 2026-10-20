"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { SportChannel } from "@/types";
import {
  User,
  Shield,
  Crown,
  Award,
  Star,
  CheckCircle,
  Flame,
  Calendar,
  LogOut,
  BookOpen,
  ClipboardList,
  Trophy,
  Users,
  Settings,
  Download,
  Activity,
  HeartPulse,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const { user, locale, sport, setSport, logout } = useApp();
  const isZh = locale === "zh";
  const [exportingBackup, setExportingBackup] = useState(false);

  if (!user) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm">
        {isZh ? "未检测到有效登录信息" : "Not authenticated"}
      </div>
    );
  }

  const profiles = user.playerProfiles || [];
  const activeProfileInCurrentSport = profiles.find(
    (p) => p.sport.toUpperCase() === sport
  );

  const isCoach = user.role === "COACH";
  const isAdmin = user.role === "ADMIN";
  const isPlayer = user.role === "PLAYER";

  // Handle backup snapshot export
  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const [playersRes, tacticsRes, plansRes, matchesRes] = await Promise.all([
        fetch(`/api/players?sport=FOOTBALL&filter=ALL`),
        fetch(`/api/tactics?sport=FOOTBALL`),
        fetch(`/api/training-plans?sport=FOOTBALL`),
        fetch(`/api/matches?sport=FOOTBALL`),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        institution: "NKCS Athletics (南京金陵中学)",
        exportedBy: user.nameZh,
        football: {
          players: await playersRes.json(),
          tactics: await tacticsRes.json(),
          plans: await plansRes.json(),
          matches: await matchesRes.json(),
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nkcs-sports-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup export error:", err);
    } finally {
      setExportingBackup(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* ================= 1. USER HEADER CARD ================= */}
      <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          {/* Avatar with classical crest border */}
          <div className="w-20 h-24 rounded-2xl overflow-hidden bg-stone-900 border-2 border-heritage-gold/50 flex items-center justify-center font-serif text-3xl font-black text-heritage-gold shadow-md shrink-0">
            {user.avatarUrl || activeProfileInCurrentSport?.photoUrl ? (
              <img
                src={user.avatarUrl || activeProfileInCurrentSport?.photoUrl!}
                alt={user.nameEn}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              user.nameZh.slice(0, 1)
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-white">{isZh ? user.nameZh : user.nameEn}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-heritage-gold/20 text-heritage-gold font-bold border border-heritage-gold/40">
                {user.role === "COACH" ? (isZh ? "校队主教练 (COACH)" : "VARSITY COACH") : user.role === "ADMIN" ? (isZh ? "竞技总监 (ADMIN)" : "ATHLETIC DIRECTOR") : (isZh ? "校队运动员 (ATHLETE)" : "VARSITY ATHLETE")}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              @{user.username} · {isZh ? user.nameEn : user.nameZh}
            </p>

            {/* Multi-sport tags for athletes */}
            {profiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSport(p.sport as SportChannel)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      sport === p.sport.toUpperCase()
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm"
                        : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
                    }`}
                  >
                    <span>{p.sport === "FOOTBALL" ? "⚽ 足球" : p.sport === "VOLLEYBALL" ? "🏐 排球" : "🏀 篮球"}</span>
                    <span>#{p.jerseyNumber} {p.primaryPosition}</span>
                    {p.isCaptain && <Crown className="w-3 h-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/15 text-gray-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 text-xs font-semibold transition-colors flex items-center space-x-2 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>{isZh ? "退出当前账号" : "Sign Out"}</span>
        </button>
      </div>

      {/* ================= 2. COACH CONSOLE (COACH VIEW) ================= */}
      {isCoach && (
        <div className="space-y-6">
          <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {isZh ? "校队主教练执教指挥中心" : "Varsity Head Coaching Command"}
                </span>
                <h2 className="text-xl font-serif font-black text-white mt-1">
                  {isZh ? `${sport} 教研与训练管理中枢` : `${sport} Coaching & Operations Hub`}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-bold text-stone-300">
                  {sport} 战区已锁定
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-[11px] text-stone-400 block">{isZh ? "战术白皮书" : "Playbook"}</span>
                <strong className="text-xl font-serif font-black text-amber-400 mt-1 block">3 套体系</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-[11px] text-stone-400 block">{isZh ? "训练教案" : "Drill Sessions"}</span>
                <strong className="text-xl font-serif font-black text-emerald-400 mt-1 block">5 堂课</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-[11px] text-stone-400 block">{isZh ? "本赛季战绩" : "Season Form"}</span>
                <strong className="text-xl font-serif font-black text-stone-200 mt-1 block">6 胜 1 负</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-[11px] text-stone-400 block">{isZh ? "待审康复小妙招" : "Pending UGC"}</span>
                <Link
                  href="/admin/review"
                  className="text-xl font-serif font-black text-rose-400 hover:text-rose-300 mt-1 flex items-center space-x-1"
                >
                  <span>待审核</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
              <Link
                href={`/${sport.toLowerCase()}/tactics`}
                className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-600/60 transition-all flex items-center space-x-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {isZh ? "编排战术体系" : "Tactics Playbook"}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {isZh ? "推演走位与更衣室大屏" : "Phasing & Big-Screen"}
                  </p>
                </div>
              </Link>

              <Link
                href={`/${sport.toLowerCase()}/schedule`}
                className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-emerald-600/60 transition-all flex items-center space-x-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {isZh ? "发布今日训练课" : "Daily Training Plan"}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {isZh ? "精确动作卡片与要诀" : "Structured drill cards"}
                  </p>
                </div>
              </Link>

              <Link
                href={`/${sport.toLowerCase()}/matches`}
                className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-600/60 transition-all flex items-center space-x-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {isZh ? "录入赛果与复盘卡" : "Debrief Desk"}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {isZh ? "1对1 私密指导与处方" : "Private coach feedback"}
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/roster"
                className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-stone-600 transition-all flex items-center space-x-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-stone-200 transition-colors">
                    {isZh ? "本队花名册维护" : "Roster Administration"}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {isZh ? "队员、名宿与队长身份" : "Manage active & alumni"}
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/review"
                className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-rose-600/60 transition-all flex items-center space-x-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                    {isZh ? "UGC 康复技巧审核" : "Review UGC Guides"}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {isZh ? "审核队员贡献的小妙招" : "Approve student tips"}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. ADMIN CONSOLE (ADMIN VIEW) ================= */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  {isZh ? "校队竞技总监控制台 (ATHLETIC DIRECTOR)" : "Campus Athletic Directorate"}
                </span>
                <h2 className="text-xl font-serif font-black text-white mt-1">
                  {isZh ? "全校体育竞技大盘与全局资产调度" : "NKCS Institutional Athletics Matrix"}
                </h2>
              </div>

              <button
                onClick={handleExportBackup}
                disabled={exportingBackup}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{exportingBackup ? (isZh ? "正在导出..." : "Exporting...") : (isZh ? "备份赛季快照 (JSON)" : "Export Snapshot")}</span>
              </button>
            </div>

            {/* Department Roster Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-400">⚽ 足球校队</span>
                  <span className="text-stone-400 text-[10px]">U19 VARSITY</span>
                </div>
                <div className="flex items-baseline space-x-2 mt-2">
                  <strong className="text-2xl font-serif text-white">6</strong>
                  <span className="text-xs text-stone-400">现役主力</span>
                  <strong className="text-base font-serif text-amber-400 ml-2">2</strong>
                  <span className="text-xs text-stone-400">名宿</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-orange-400">🏐 排球校队</span>
                  <span className="text-stone-400 text-[10px]">U19 VARSITY</span>
                </div>
                <div className="flex items-baseline space-x-2 mt-2">
                  <strong className="text-2xl font-serif text-white">5</strong>
                  <span className="text-xs text-stone-400">现役主力</span>
                  <strong className="text-base font-serif text-amber-400 ml-2">2</strong>
                  <span className="text-xs text-stone-400">名宿</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-rose-400">🏀 篮球校队</span>
                  <span className="text-stone-400 text-[10px]">U19 VARSITY</span>
                </div>
                <div className="flex items-baseline space-x-2 mt-2">
                  <strong className="text-2xl font-serif text-white">5</strong>
                  <span className="text-xs text-stone-400">现役主力</span>
                  <strong className="text-base font-serif text-amber-400 ml-2">2</strong>
                  <span className="text-xs text-stone-400">名宿</span>
                </div>
              </div>
            </div>

            {/* Admin Command Links */}
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/admin/roster"
                className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-purple-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {isZh ? "全局花名册与账号录入中心" : "Master Roster Administration"}
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {isZh ? "录入新队员、设定队长与名宿阶级、重置密码" : "Manage athletes, credentials & HoF"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-500 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/admin/review"
                className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {isZh ? "UGC 康复白皮书全站审核中心" : "Global UGC Review Desk"}
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {isZh ? "三专区队员上传技巧终审、驳回与医学合规" : "Review all recovery submissions"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. FC26 ATHLETE PROGRESSION & RECOVERY (ATHLETE VIEW) ================= */}
      {isPlayer && activeProfileInCurrentSport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Progression Box */}
          <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Flame className="w-4 h-4 text-heritage-antiqueGold" />
                <span>{isZh ? "竞技卡牌经验成长 (XP Growth)" : "Athletic XP Progression"}</span>
              </h3>
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/60">
                {activeProfileInCurrentSport.cardTier} TIER
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-400">{isZh ? "当前经验值" : "Total XP"}</span>
                <span className="font-bold text-amber-400">{activeProfileInCurrentSport.xpPoints} XP</span>
              </div>
              <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (activeProfileInCurrentSport.xpPoints % 500) / 5)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-stone-400 text-right">
                {isZh
                  ? `距离升级至下一阶还需 ${500 - (activeProfileInCurrentSport.xpPoints % 500)} XP`
                  : `${500 - (activeProfileInCurrentSport.xpPoints % 500)} XP needed for next tier`}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-800 grid grid-cols-2 gap-2 text-xs text-stone-300">
              <div className="p-2.5 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400 text-[10px] block">{isZh ? "球衣号码" : "Jersey"}</span>
                <strong className="text-sm text-stone-100 font-serif">#{activeProfileInCurrentSport.jerseyNumber}</strong>
              </div>
              <div className="p-2.5 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400 text-[10px] block">{isZh ? "战术位置组" : "Unit"}</span>
                <strong className="text-sm text-stone-100 truncate block">{activeProfileInCurrentSport.positionGroup || "主力组"}</strong>
              </div>
            </div>
          </div>

          {/* Honors & Duties Spotlight */}
          <div className="bg-[#121815] border border-stone-800 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{isZh ? "荣誉勋章与战术使命" : "Honors & Duties"}</span>
            </h3>

            {activeProfileInCurrentSport.honors ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 text-xs text-amber-200">
                <Star className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{activeProfileInCurrentSport.honors}</span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                {isZh ? "暂未录入赛事单项奖荣誉" : "No individual honors logged yet"}
              </p>
            )}

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed">
              <strong className="text-emerald-300 block mb-1">
                {isZh ? "教练战术寄语：" : "Coaching Focus:"}
              </strong>
              {isZh
                ? `保持赛后拉伸与自愈习惯，在每一次防守转换与进攻推进中担当基石！`
                : `Maintain recovery disciplines and anchor transitions with tactical rigor!`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
