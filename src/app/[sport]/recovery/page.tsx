"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Activity, ShieldCheck, Zap, Sparkles, HelpCircle, CheckCircle2 } from "lucide-react";

export default function RecoveryPage() {
  const params = useParams();
  const sport = (params.sport as string)?.toUpperCase();
  const { locale } = useApp();
  const isZh = locale === "zh";

  const [selectedMuscle, setSelectedMuscle] = useState<string>("calves");

  const muscleData: Record<string, any> = {
    calves: {
      nameZh: "小腿腓肠肌 / 比目鱼肌",
      nameEn: "Calves (Gastrocnemius & Soleus)",
      sportRisk: "长途折返跑冲刺、起跳落地缓冲",
      dynamic: "脚尖点地轻弹跳 + 踝关节环绕 (2组 x 30秒)",
      static: "推墙弓步小腿后侧深度牵拉，脚后跟紧贴地面保持30秒",
      gun: "平头或球形头，顺着肌腹从下向上缓慢走形，低频40秒",
      scraper: "30度角刮拭跟腱上方浅层筋膜，涂抹润肤乳",
      substitute: "【无器械替代】双手拇指垂直按压酸痛点30秒；或使用硬质水瓶踩在足底/小腿下方来回缓慢滚压！",
    },
    quads: {
      nameZh: "大腿股四头肌群",
      nameEn: "Quadriceps Femoris",
      sportRisk: "大力射门、急停变向、高频冲刺",
      dynamic: "行进间后踢腿折叠膝关节 (20次 x 2组)",
      static: "单腿站立手握脚踝向后贴近臀部，保持骨盆中立35秒",
      gun: "大球形头，沿股直肌由膝上至髋部走形，中频45秒",
      scraper: "宽面刀由下向上顺向轻刮，避开髌骨关节面",
      substitute: "【无器械替代】用长毛巾套住脚面辅助后拉拉伸；在床上用手臂手肘垂直按压大腿中段激痛点！",
    },
    hamstrings: {
      nameZh: "大腿后侧腘绳肌群",
      nameEn: "Hamstrings",
      sportRisk: "高速冲刺撕扯、急停制动拉伤高发区",
      dynamic: "直腿踢高踢腿 + 燕式平衡摆动 (15次/侧)",
      static: "坐姿前屈或单腿搭在栏杆上，呼气屈髋向前倾保持40秒",
      gun: "气垫头或平头，重点松解肌腱连接处，切忌高频重压",
      scraper: "由坐骨结节向腘窝方向长程刮拭",
      substitute: "【无器械替代】坐在硬椅子边缘，将网球/棒球垫在大腿后侧酸痛处，用自身体重下压松解！",
    },
  };

  const current = muscleData[selectedMuscle] || muscleData.calves;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <Activity className="w-7 h-7 text-blue-400" />
            <span>{isZh ? `${sport} 身体恢复与筋膜松解白皮书` : `${sport} Stretching & Recovery Guide`}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "3D 精细人体解剖可视化模型 · 静态/动态拉伸 · 筋膜枪/刀 · 宿舍零成本简易替代手法 · 师生共建"
              : "3D interactive body visualizer · Dynamic/static stretches · Zero-cost bedroom substitutes · UGC"}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/30">
            阶段三 3D R3F 渲染引擎待接入
          </span>
        </div>
      </div>

      {/* Interactive Muscle Switcher Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedMuscle("calves")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedMuscle === "calves"
              ? "bg-blue-600 text-white shadow-md border border-blue-400"
              : "bg-black/40 text-gray-400 hover:text-white border border-white/10"
          }`}
        >
          {isZh ? "小腿腓肠肌 / 跟腱" : "Calves & Achilles"}
        </button>
        <button
          onClick={() => setSelectedMuscle("quads")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedMuscle === "quads"
              ? "bg-blue-600 text-white shadow-md border border-blue-400"
              : "bg-black/40 text-gray-400 hover:text-white border border-white/10"
          }`}
        >
          {isZh ? "大腿股四头肌 (前侧)" : "Quadriceps (Front)"}
        </button>
        <button
          onClick={() => setSelectedMuscle("hamstrings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedMuscle === "hamstrings"
              ? "bg-blue-600 text-white shadow-md border border-blue-400"
              : "bg-black/40 text-gray-400 hover:text-white border border-white/10"
          }`}
        >
          {isZh ? "大腿后侧腘绳肌 (后侧)" : "Hamstrings (Back)"}
        </button>
      </div>

      {/* Muscle Detail Guide Card */}
      <div className="bg-black/60 border border-white/15 rounded-2xl p-6 shadow-chiseled space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {isZh ? current.nameZh : current.nameEn}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isZh ? current.nameEn : current.nameZh}
            </p>
          </div>
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5" />
            <span>{isZh ? `高发运动风险：${current.sportRisk}` : `Risk: ${current.sportRisk}`}</span>
          </div>
        </div>

        {/* 5 Recovery Modalities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Dynamic Warmup */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
            <strong className="text-emerald-400 font-bold block text-sm">
              🏃 训前动态激活 (Dynamic Warmup)
            </strong>
            <p className="text-gray-300 leading-relaxed">{current.dynamic}</p>
          </div>

          {/* Static Stretch */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
            <strong className="text-teal-400 font-bold block text-sm">
              🧘 赛后静态拉伸 (Static Stretch)
            </strong>
            <p className="text-gray-300 leading-relaxed">{current.static}</p>
          </div>

          {/* Massage Gun */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
            <strong className="text-amber-400 font-bold block text-sm">
              🔫 筋膜枪冲击松解 (Massage Gun)
            </strong>
            <p className="text-gray-300 leading-relaxed">{current.gun}</p>
          </div>

          {/* IASTM Scraper */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
            <strong className="text-purple-400 font-bold block text-sm">
              🔪 筋膜刀肌膜解离 (IASTM Scraper)
            </strong>
            <p className="text-gray-300 leading-relaxed">{current.scraper}</p>
          </div>

          {/* Zero-Cost Bedroom Substitutes (Key user requirement) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-black/40 to-black/60 border border-amber-500/30 col-span-1 md:col-span-2 space-y-1.5">
            <strong className="text-heritage-gold font-bold block text-sm flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-heritage-gold" />
              <span>{isZh ? "零器械 / 宿舍日常物品替代方案 (Zero-Cost Substitutes)" : "Zero-Cost Bedroom Substitutes"}</span>
            </strong>
            <p className="text-amber-100/90 leading-relaxed text-xs">
              {current.substitute}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
