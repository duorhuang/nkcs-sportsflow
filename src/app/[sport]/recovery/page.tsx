"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { SportChannel } from "@/types";
import InteractiveBodyVisualizer, { BodyPartKey } from "@/components/recovery/InteractiveBodyVisualizer";
import {
  Activity,
  ShieldCheck,
  Zap,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wind,
  Plus,
  Send,
  ThumbsUp,
  XCircle,
  Clock,
  Layers,
} from "lucide-react";

interface GuideItem {
  id: string;
  sport: string;
  bodyPartKey: string;
  modality: string;
  titleZh: string;
  titleEn: string;
  contentZh: string;
  contentEn: string;
  durationNotes?: string | null;
  equipmentNotes?: string | null;
  contraindications?: string | null;
  status: string;
  author: {
    id: string;
    nameZh: string;
    nameEn: string;
    role: string;
  };
}

export default function RecoveryPage() {
  const params = useParams();
  const sport = ((params.sport as string) || "FOOTBALL").toUpperCase() as SportChannel;
  const { user, locale } = useApp();
  const isZh = locale === "zh";

  const isCoachOrAdmin = user?.role === "COACH" || user?.role === "ADMIN";

  const [selectedPart, setSelectedPart] = useState<BodyPartKey>("calves");
  const [condition, setCondition] = useState<"DOMS" | "ACUTE" | "CHRONIC">("DOMS");
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UGC Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [ugcTitle, setUgcTitle] = useState("");
  const [ugcContent, setUgcContent] = useState("");
  const [ugcModality, setUgcModality] = useState("ZERO_COST_SUBSTITUTE");
  const [ugcEquipment, setUgcEquipment] = useState("");
  const [ugcDuration, setUgcDuration] = useState("");
  const [submittingUgc, setSubmittingUgc] = useState(false);

  // Default Clinical Knowledge Base
  const clinicalSpecs: Record<BodyPartKey, any> = {
    calves: {
      nameZh: "小腿腓肠肌 / 比目鱼肌 / 跟腱",
      nameEn: "Calves (Gastrocnemius, Soleus & Achilles)",
      risk: "频繁急停冲刺、高空起跳落地缓冲冲击、塑胶与硬地摩擦",
      peaceLove: "【PEACE & LOVE原则】前48小时抬高下肢高于心脏，避免过度冰敷抑制修复；72小时后进行无痛范围的主动背屈活动与温和血流刺激。",
      dynamic: "轻快脚尖点地连续弹跳 (20次 x 2组) + 支撑位踝关节主动多轴环绕",
      static: "斜板或推墙站立，前腿弯曲后腿伸直，脚后跟紧贴地面，保持35秒，换侧重复",
      gun: "平头或气垫头，顺着腓肠肌内外侧肌腹自下向上缓慢移动，2档中频，单次40秒，严禁击打跟腱骨突",
      scraper: "30度角度涂抹乳液顺向推刮跟腱上方结缔组织，每次5-7遍",
      zeroCost: "【宿舍零成本替代】：取一瓶冷冻结冰的500ml矿泉水瓶置于地面，足底及小腿下段在其上方缓慢来回滚压；双手大拇指指腹垂直按压酸痛承山穴30秒！",
      rtpChecks: ["单腿提踵30次无痛", "双脚连续纵跳20次无酸软", "踝关节全范围背屈角度对称 (膝盖触墙试验 > 10cm)"],
    },
    hamstrings: {
      nameZh: "大腿后侧腘绳肌群 (半腱肌/半膜肌/股二头肌)",
      nameEn: "Hamstrings Complex",
      risk: "高速冲刺极速离心收缩收步、急停变向撕裂高发区",
      peaceLove: "【现代拉伤分级】轻度拉伤切忌立即做暴力剧烈拉伸（会撕扯未愈纤维）；采用等长收缩（如仰卧脚跟踩地微屈膝抬臀静态维持）维持肌腱神经适应。",
      dynamic: "高踢腿行进前迈步 (左右各15次) + 单腿燕式前倾摆动",
      static: "坐姿双腿伸直，呼气时由髋关节前倾带动躯干向前，双手向脚尖方向延伸，保持40秒",
      gun: "大球形头，自坐骨结节向膝关节腘窝方向走形，中低频45秒",
      scraper: "由上至下长程轻推，切勿在腘窝血管神经密集区重刮",
      zeroCost: "【宿舍零成本替代】：坐在硬木椅边缘，将网球或硬质水杯垫在腘绳肌酸痛结节处，利用自身坐姿体重垂直下压并微动小腿，深层筋膜痛感释放！",
      rtpChecks: ["仰卧直腿抬高达到 80 度无阻抗痛", "单腿桥式臀推维持 30 秒无痉挛", "次最大速度冲刺 (85%) 跑动无牵扯痛感"],
    },
    quads: {
      nameZh: "大腿股四头肌群 (股直肌/股内外侧肌)",
      nameEn: "Quadriceps Femoris",
      risk: "重炮大力抽射、急停跳投制动、深蹲发力过度",
      peaceLove: "【离心超负荷】剧烈踢球后常发生延迟性酸痛(DOMS)，以泡沫轴轻度低压滚压促进微循环代谢乳酸与炎症介质。",
      dynamic: "行进间后踢腿折叠小腿贴近臀部 (快速交替 30 次)",
      static: "单腿站立，手握对侧脚踝向后上方提拉，保持骨盆后倾中立位，拉伸大腿前侧40秒",
      gun: "扁平头或大球头，沿股直肌走向从中段至髋骨下方推移，频率中等",
      scraper: "宽刃刀顺纤维走向由下向上轻推，避开髌骨上方肌腱连接点",
      zeroCost: "【宿舍零成本替代】：侧卧在床铺上，用长浴巾套住脚踝拉向臀部作为牵引器；用肘部在床上对股四头肌痛点进行5点深压！",
      rtpChecks: ["完全屈膝脚跟触碰臀部无锐痛", "单腿无负重深蹲至 90 度动作稳定", "双腿跳起落地缓冲无膝前压痛"],
    },
    knees: {
      nameZh: "膝关节髌腱 / 前后交叉韧带 / 半月板",
      nameEn: "Knee Joint, Patellar Tendon & ACL/MCL",
      risk: "急停变向旋转扭力、高空拦网与争顶落地不稳、草坪/硬木打滑",
      peaceLove: "【急性扭伤急救】若伴随关节弹响与迅速肿胀，必须立即离场制动加压包扎，转运校医诊断；若为常规髌腱劳损，执行等长靠墙静蹲。",
      dynamic: "原地轻度微屈膝半蹲提踵 + 直腿后撤步激活",
      static: "靠墙静蹲 45 度角保持 45 秒 (等长收缩镇痛黄金动作)",
      gun: "严禁直接击打髌骨及关节间隙！仅可松解股四头肌下段与髂胫束外侧",
      scraper: "仅在髌腱两侧脂肪垫边缘进行极轻柔微触点刮拭",
      zeroCost: "【宿舍零成本替代】：背靠宿舍门做靠墙静蹲，大腿之间夹一个厚枕头或水杯激活内收肌协同保护膝关节！",
      rtpChecks: ["膝关节完全屈伸角度与健侧一致", "单腿下台阶试验无打软腿与酸痛", "单腿侧向跳跃落地平稳无晃动"],
    },
    shoulders: {
      nameZh: "肩袖四肌 (冈上肌/冈下肌/小圆肌/肩胛下肌)",
      nameEn: "Rotator Cuff & Deltoids",
      risk: "排球扣杀发球大力挥臂、篮球长传抢断对抗、守门员扑救手腕肩部撞击",
      peaceLove: "【过头运动过劳】避免在高抬手臂受限时进行暴力甩肩；注重肩胛骨后缩下沉与后侧小圆肌的离心力量维护。",
      dynamic: "Y-T-W-L 肩胛神经激活操 (各10次) + 弹性阻力带水平外旋",
      static: "十字交叉跨胸拉伸 (手肘弯曲压住手臂向对侧胸前贴近，保持30秒)",
      gun: "小球头轻柔按压肩关节后侧冈下肌，避免震击肩峰骨头",
      scraper: "在肩胛冈下方区域涂抹润滑油，以45度角向外侧推刮",
      zeroCost: "【宿舍零成本替代】：背靠宿舍墙壁，将网球夹在肩胛骨与墙壁之间，微曲双腿上下蹲动寻找压痛点滚压！",
      rtpChecks: ["手臂高举过头贴耳无撞击痛", "徒手背手摸后背肩胛骨对称", "模拟扣杀/投篮挥臂动作无受阻感"],
    },
    groin: {
      nameZh: "腹股沟与大腿内收肌群",
      nameEn: "Groin & Hip Adductors",
      risk: "足球大脚传中跨步、内切防守横移、侧向大幅度滑步",
      peaceLove: "【腹股沟拉伤管理】急性期切忌劈叉强拉；采用哥本哈根平板支撑降阶动作（双膝着地支撑）进行等长神经肌肉刺激。",
      dynamic: "相扑深蹲侧步滑移 + 髋关节内外旋绕环",
      static: "蝴蝶式坐姿双脚脚心相对，双肘轻压膝关节下沉，保持45秒",
      gun: "气垫头，在大腿内侧肌腹由膝内上方往大腿根部缓慢推移，低频温和",
      scraper: "沿内收长肌走向轻刮，禁止高压刺激深层大血管区域",
      zeroCost: "【宿舍零成本替代】：平躺在床上，双膝夹紧卷紧的厚浴巾全力发力5秒放松5秒，重复10次激活内收肌群！",
      rtpChecks: ["平躺双腿夹枕头全力无锐痛", "侧向滑步 10 米来回测试无拉扯感", "原地单腿侧向支撑跳跃平稳"],
    },
    lower_back: {
      nameZh: "腰椎竖脊肌 / 腰方肌 / 臀中肌",
      nameEn: "Lower Back (Erector Spinae & QL)",
      risk: "躯干频繁扭转抽射、防守卡位碰撞、起跳腾空腰部反弓",
      peaceLove: "【非特异性腰痛】大多数为臀肌无力引起的腰肌代偿，重点在松解臀大肌与激活腹横肌腹压，切忌强行前屈硬弯腰。",
      dynamic: "猫牛式骨盆俯卧伸展 (缓慢呼吸 10 组) + 鸟狗式核心对角伸展",
      static: "仰卧屈膝单膝抱胸拉伸 + 仰卧扭转脊柱伸展 (各保持 30 秒)",
      gun: "双叉头，顺着脊柱两侧竖脊肌上下移动，绝对严禁直接击打脊椎骨突",
      scraper: "由外向内顺着肋骨下缘与骨盆上缘之间推刮腰方肌",
      zeroCost: "【宿舍零成本替代】：平躺在宿舍地板或硬床上，将两个网球装进袜子里做成花生球，垫在腰部两侧进行深度放松！",
      rtpChecks: ["弯腰前屈指尖碰地无腰痛放射", "平板支撑维持 45 秒无腰部塌陷", "跳起落地腰椎抗震无震动痛"],
    },
    ankles: {
      nameZh: "踝关节韧带 (距腓前韧带) 与距下关节",
      nameEn: "Ankles & Subtalar Joint",
      risk: "落地踩在他人脚背内翻扭伤 (崴脚)、变向踩空、人工草坪鞋钉卡死",
      peaceLove: "【崴脚急救黄金准则】现代医学推荐尽早无痛活动踝泵。若外踝剧痛无法负重超过4步，必须立即就医排查第5跖骨与外踝骨折！",
      dynamic: "坐姿踝泵练习 (足尖用力下踩与全力勾脚，30次) + 字母空中书写画圆",
      static: "毛巾套住脚掌前部双手拉向身体做被动背屈拉伸",
      gun: "禁止直接震击踝关节骨突与韧带撕裂处！仅用于放松小腿胫骨前肌",
      scraper: "微角度轻柔推刮外踝后方腓骨肌肌腱",
      zeroCost: "【宿舍零成本替代】：冰块放入保鲜袋加少量水排气，用弹性绷带将冰袋固定于外踝加压冷敷15分钟；之后做坐姿踩毛巾抓握练习！",
      rtpChecks: ["单腿闭眼站立维持 20 秒不晃动", "单脚原地向前跳跃落地不侧翻", "全身体重完全负重单腿慢跑无不适"],
    },
    neck: {
      nameZh: "颈椎与上斜方肌群",
      nameEn: "Cervical Spine & Upper Trapezius",
      risk: "争顶头球冲击、扑救摔倒撞击、比赛紧张耸肩",
      peaceLove: "【颈部保护】头球后轻微酸痛应进行温和颈部抗阻对抗，切勿暴力做快速甩头旋转动作。",
      dynamic: "收下巴做双下巴运动 (Chin Tuck 维持5秒 x 10次)",
      static: "一手固定在椅子边缘，另一手轻扶头部向对侧倾斜拉伸斜方肌 30 秒",
      gun: "低频气垫头轻触上斜方肌肌腹，避开颈前动脉窦",
      scraper: "从后脑发际线向肩膀外侧推刮",
      zeroCost: "【宿舍零成本替代】：双手抱头向后对抗手掌发力，头手互抗保持等长发力10秒！",
      rtpChecks: ["颈部向左右旋转各达 80 度无卡顿", "抬头仰望天花板无眩晕麻木", "双肩自然下沉无耸肩代偿"],
    },
    chest: {
      nameZh: "胸大肌与前锯肌",
      nameEn: "Pectoralis Major & Serratus Anterior",
      risk: "躯干对抗推搡、倒地撑地反作用力",
      peaceLove: "【胸廓活动度】通过门框拉伸打开胸椎与胸小肌，防止含胸驼背影响比赛呼吸深度。",
      dynamic: "站姿开合扩胸运动 (20次)",
      static: "小臂贴在宿舍门框上，身体向前弓步推移拉伸胸大肌 35 秒",
      gun: "大球头由胸骨向腋下方向缓慢推行，避开锁骨骨头",
      scraper: "沿胸肋关节向外侧呈放射状轻推",
      zeroCost: "【宿舍零成本替代】：趴在床上把网球垫在胸肌与肩膀连接处，利用体重轻微画圈松解激痛点！",
      rtpChecks: ["双手背后十指交叉上提无痛", "做 10 个标准俯卧撑无前肩压痛"],
    },
    core: {
      nameZh: "腹直肌 / 腹内斜肌 / 腹横肌",
      nameEn: "Core (Rectus & Obliques)",
      risk: "大幅度射门收腹、滞空腰腹发力",
      peaceLove: "【核心恢复】赛后通过腹式深呼吸降低交感神经兴奋度，促进胃肠消化与肌糖原再生。",
      dynamic: "眼镜蛇式温和俯卧伸展 (保持20秒)",
      static: "仰卧桥式骨盆上推维持与拉伸",
      gun: "不建议高频震动腹部内脏区",
      scraper: "腹直肌表面极轻柔由上向下轻刮",
      zeroCost: "【宿舍零成本替代】：平躺腹部放置一本厚字典，练习用深吸气顶起字典、慢呼气下沉的膈肌深呼吸！",
      rtpChecks: ["双腿抬离地面 30 度维持 20 秒无腰酸", "侧向平板支撑维持 30 秒动作稳固"],
    },
  };

  const currentSpec = clinicalSpecs[selectedPart] || clinicalSpecs.calves;

  // Load guides
  const loadGuides = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/recovery?sport=${sport}&bodyPart=${selectedPart}&includePending=${isCoachOrAdmin}`);
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides || []);
      }
    } catch (err) {
      console.error("Failed to load recovery guides:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuides();
  }, [sport, selectedPart, isCoachOrAdmin]);

  // Submit UGC Guide / Substitute
  const handleSubmitUgc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ugcTitle || !ugcContent) return;

    setSubmittingUgc(true);
    try {
      const res = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          bodyPartKey: selectedPart,
          modality: ugcModality,
          titleZh: ugcTitle,
          contentZh: ugcContent,
          equipmentNotes: ugcEquipment,
          durationNotes: ugcDuration,
        }),
      });

      if (res.ok) {
        setShowSubmitModal(false);
        setUgcTitle("");
        setUgcContent("");
        setUgcEquipment("");
        setUgcDuration("");
        await loadGuides();
      }
    } catch (err) {
      console.error("Failed to submit UGC guide:", err);
    } finally {
      setSubmittingUgc(false);
    }
  };

  // Review Guide (Coach / Admin)
  const handleReviewGuide = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/recovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await loadGuides();
      }
    } catch (err) {
      console.error("Failed to review guide:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 uppercase tracking-wider">
              {sport} ATHLETIC MEDICINE & RECOVERY
            </span>
            <span className="text-xs text-gray-400">
              现代运动医学标准 · 零成本校园替代
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white flex items-center space-x-2.5">
            <Activity className="w-7 h-7 text-rose-400" />
            <span>{isZh ? `${sport} 竞技康复与损伤自愈白皮书` : `${sport} Recovery & Rehab Hub`}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? "3D 解剖人机定位 · 肌肉激痛点精准松解 · 宿舍零成本器械替代 · 返场红绿灯测试 · 师生共建"
              : "Anatomical map · Trigger point release · Zero-cost dorm substitutes · RTP readiness · UGC review"}
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-rose-400" />
          <span>贡献宿舍零成本小妙招</span>
        </button>
      </div>

      {/* Main Split Workbench: Anatomical Visualizer on Left, Clinical Prescriptions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Body Map (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <InteractiveBodyVisualizer
            sport={sport}
            selectedPart={selectedPart}
            onSelectPart={(part) => setSelectedPart(part)}
          />

          {/* Quick Body Part Selector Pills */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              快速点击选择肌群部位
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(clinicalSpecs) as BodyPartKey[]).map((key) => {
                const isSelected = selectedPart === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPart(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-rose-600 text-white font-bold shadow-md"
                        : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
                    }`}
                  >
                    {clinicalSpecs[key].nameZh.split("/")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptions & Zero-Cost Protocols (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Part Overview Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-black/80 via-black/60 to-black/90 border border-rose-500/30 shadow-chiseled">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                  TARGET TARGET MUSCLE / JOINT
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {currentSpec.nameZh}
                </h2>
                <p className="text-xs text-gray-400">{currentSpec.nameEn}</p>
              </div>

              {/* Condition Switcher Tabs */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
                <button
                  onClick={() => setCondition("DOMS")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    condition === "DOMS"
                      ? "bg-amber-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  ⚡ 赛后酸痛 (DOMS)
                </button>
                <button
                  onClick={() => setCondition("ACUTE")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    condition === "ACUTE"
                      ? "bg-rose-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  ⚠️ 急性扭伤/拉伤
                </button>
                <button
                  onClick={() => setCondition("CHRONIC")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    condition === "CHRONIC"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  🔄 慢性劳损
                </button>
              </div>
            </div>

            {/* Sport Risk Factor */}
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">{sport} 常见损伤机制：</strong>
                <span> {currentSpec.risk}</span>
              </div>
            </div>

            {/* Clinical Evidence Directive */}
            <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
              <strong className="text-white block mb-1">
                现代运动医学处置黄金准则：
              </strong>
              <p className="leading-relaxed text-gray-300">{currentSpec.peaceLove}</p>
            </div>

            {/* Zero-Cost Campus / Dormitory Substitute Spotlight */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-black/60 border border-emerald-500/40">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-1 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>宿舍零成本简易自愈替代手法 (ZERO-COST DORM SUBSTITUTE)</span>
              </h4>
              <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                {currentSpec.zeroCost}
              </p>
            </div>

            {/* Action Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {/* Dynamic Stretch */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-xs font-bold text-sky-400 mb-1 flex items-center space-x-1.5">
                  <Wind className="w-3.5 h-3.5" />
                  <span>动态热身与神经激活</span>
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentSpec.dynamic}
                </p>
              </div>

              {/* Static Stretch */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-xs font-bold text-teal-400 mb-1 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>静态深度拉伸</span>
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentSpec.static}
                </p>
              </div>

              {/* Massage Gun */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-xs font-bold text-purple-400 mb-1 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>筋膜枪使用建议</span>
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentSpec.gun}
                </p>
              </div>

              {/* IASTM Scraper */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h5 className="text-xs font-bold text-amber-400 mb-1 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>筋膜刀技术要点</span>
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentSpec.scraper}
                </p>
              </div>
            </div>

            {/* Return to Play Safety Traffic Light Checklist */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-heritage-gold mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-heritage-gold" />
                <span>返场安全评估红绿灯 (RETURN-TO-PLAY READINESS TEST)</span>
              </h4>
              <p className="text-[11px] text-gray-400 mb-3">
                在重新穿上球鞋参加全队高强度合练前，运动员需自主完成以下全部3项达标测试：
              </p>
              <div className="space-y-2">
                {currentSpec.rtpChecks.map((check: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2.5 p-2 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Crowdsourced UGC Submissions & Peer Experience */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-black text-sm text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>校队师生共建经验库 ({guides.length} 条已归档)</span>
              </h3>
              <span className="text-xs text-gray-400">经队医与主教练核验</span>
            </div>

            {loading ? (
              <div className="text-center py-6 text-xs text-gray-500">
                正在检索共建数据库...
              </div>
            ) : guides.length === 0 ? (
              <div className="p-6 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-gray-400">
                该部位暂无运动员提交宿舍替代小妙招，欢迎点击上方按钮成为首位贡献者！
              </div>
            ) : (
              <div className="space-y-3">
                {guides.map((guide) => (
                  <div
                    key={guide.id}
                    className={`p-4 rounded-xl border transition-all ${
                      guide.status === "PENDING_REVIEW"
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{guide.titleZh}</span>
                        {guide.status === "PENDING_REVIEW" && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            待教练审核
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        贡献者：{guide.author.nameZh} ({guide.author.role})
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed mb-2">
                      {guide.contentZh}
                    </p>

                    {guide.equipmentNotes && (
                      <p className="text-[11px] text-emerald-400">
                        <strong>无器械替代工具：</strong> {guide.equipmentNotes}
                      </p>
                    )}

                    {/* Coach Review Actions */}
                    {isCoachOrAdmin && guide.status === "PENDING_REVIEW" && (
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-end space-x-2 text-xs">
                        <button
                          onClick={() => handleReviewGuide(guide.id, "REJECTED")}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>驳回修改</span>
                        </button>
                        <button
                          onClick={() => handleReviewGuide(guide.id, "APPROVED")}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1 shadow-md"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>核准并公开</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UGC Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/95 border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-black text-lg text-white">
              分享你的宿舍零成本康复小妙招
            </h3>
            <p className="text-xs text-gray-400">
              提交后将经由主教练或队医安全审核，确认动作符合运动医学规范后收录至全队白皮书。
            </p>

            <form onSubmit={handleSubmitUgc} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  妙招标题 *
                </label>
                <input
                  type="text"
                  required
                  value={ugcTitle}
                  onChange={(e) => setUgcTitle(e.target.value)}
                  placeholder="如：网球足底踩踏松解法、冷冻可乐罐冰敷"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  具体操作手法与步骤说明 *
                </label>
                <textarea
                  rows={4}
                  required
                  value={ugcContent}
                  onChange={(e) => setUgcContent(e.target.value)}
                  placeholder="详细写出你的姿势、用力程度、感觉酸痛还是舒适，以及注意事项..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    使用替代物品
                  </label>
                  <input
                    type="text"
                    value={ugcEquipment}
                    onChange={(e) => setUgcEquipment(e.target.value)}
                    placeholder="如：网球、500ml矿泉水瓶、浴巾"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    推荐单次时长
                  </label>
                  <input
                    type="text"
                    value={ugcDuration}
                    onChange={(e) => setUgcDuration(e.target.value)}
                    placeholder="如：两组 x 45秒"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingUgc}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingUgc ? "正在提交..." : "提交审核"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
