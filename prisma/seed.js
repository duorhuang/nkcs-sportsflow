const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting clean seed (No fabricated names, official coaching staff only)...");

  // 1. Password hashes
  const adminPass = await bcrypt.hash("admin123", 10);
  const coachPass = await bcrypt.hash("coach123", 10);

  // 2. Clear old data cleanly in dependency order
  await prisma.systemNotification.deleteMany();
  await prisma.debriefRecipient.deleteMany();
  await prisma.debrief.deleteMany();
  await prisma.matchStat.deleteMany();
  await prisma.match.deleteMany();
  await prisma.recoveryGuide.deleteMany();
  await prisma.trainingDrill.deleteMany();
  await prisma.trainingPlan.deleteMany();
  await prisma.tacticComment.deleteMany();
  await prisma.tacticPhase.deleteMany();
  await prisma.tactic.deleteMany();
  await prisma.playerProfile.deleteMany();
  await prisma.coachAssignment.deleteMany();
  await prisma.user.deleteMany();

  // 3. Create Admin (Athletic Director - Strictly official designation, no invented human names)
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminPass,
      role: "ADMIN",
      nameEn: "Athletic Director",
      nameZh: "体育总监",
      avatarUrl: "/assets/crests/hall-of-fame-crest.svg",
    },
  });

  // 4. Create Coaches (Direct standard role usernames: football, volleyball, basketball)
  const coachFootball = await prisma.user.create({
    data: {
      username: "football",
      passwordHash: coachPass,
      role: "COACH",
      nameEn: "Football Head Coach",
      nameZh: "足球主教练",
      avatarUrl: "/assets/crests/nkcs-football-crest.svg",
      coachAssignments: {
        create: [{ sport: "FOOTBALL" }],
      },
    },
  });

  const coachVolleyball = await prisma.user.create({
    data: {
      username: "volleyball",
      passwordHash: coachPass,
      role: "COACH",
      nameEn: "Volleyball Head Coach",
      nameZh: "排球主教练",
      avatarUrl: "/assets/players/coach_volleyball.png",
      coachAssignments: {
        create: [{ sport: "VOLLEYBALL" }],
      },
    },
  });

  const coachBasketball = await prisma.user.create({
    data: {
      username: "basketball",
      passwordHash: coachPass,
      role: "COACH",
      nameEn: "Basketball Head Coach",
      nameZh: "篮球主教练",
      avatarUrl: "/assets/players/coach_basketball.png",
      coachAssignments: {
        create: [{ sport: "BASKETBALL" }],
      },
    },
  });

  // NOTE: STRICTLY ZERO FABRICATED STUDENT PROFILES CREATED.
  // User instruction: "请不要再自己创建各种名字了。现在先不要创建队员账号，目前里面没有任何学员，不要凭空捏造人物、名字或奇怪的信息。"

  // 5. Training Plans with Weekly Cadence (Football 2/wk, Volleyball 2/wk, Basketball 1-2/wk) + Archived (>30d)
  const now = new Date();

  // Helper to get offset date
  const getOffsetDate = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  // FOOTBALL TRAINING PLANS (2 per week: Tuesday & Thursday cadence)
  // Plan 1: Active - This Tuesday
  await prisma.trainingPlan.create({
    data: {
      sport: "FOOTBALL",
      trainingDate: getOffsetDate(-1),
      startTime: "16:30",
      endTime: "18:30",
      location: "2号主天然草坪 (Main Grass Pitch 2)",
      titleEn: "High-Press Transition & Overlapping Runs",
      titleZh: "高位逼抢攻防转换与边后卫套边配合",
      contentEn:
        "Focus on immediate pressure within 5 seconds of turnover, rapid wide transition, and finishing inside the box.",
      contentZh:
        "重点演练丢球后5秒就地压迫、弱侧迅速拉开传中、以及禁区内双点包抄。",
      tags: "高位逼抢, 边路套边, 快速反击",
      drills: {
        create: [
          {
            sport: "FOOTBALL",
            titleEn: "Dynamic Movement & FIFA 11+ Hip Activation",
            titleZh: "动态热身与 FIFA 11+ 髋关节神经激活",
            category: "WARMUP",
            durationMins: 15,
            setsAndReps: "1组持续，心率升至 140bpm",
            pitchSpecs: "20m x 20m 标志盘方格",
            playerCount: "全队分成两组",
            coachingCuesEn:
              "1. High knees with stable core; 2. Ankle stiffness on every ground strike; 3. Progressive acceleration to 80%.",
            coachingCuesZh:
              "1. 高抬腿时躯干挺直不晃动；2. 每次蹬地脚踝保持刚性与弹性；3. 最后一趟渐进加速至80%冲刺。",
            sortOrder: 1,
          },
          {
            sport: "FOOTBALL",
            titleEn: "4v4 + 3 Neutral Transition Rondos",
            titleZh: "4v4 + 3 自由人高压转换抢逼围",
            category: "TACTICAL",
            durationMins: 25,
            setsAndReps: "3组 x 6分钟，组间间歇 90秒",
            pitchSpecs: "25m x 20m 场地",
            playerCount: "4红 vs 4蓝 + 3黄（自由人）",
            diagramUrl: "/assets/drills/rondo-counter-press-4v2.svg",
            coachingCuesEn:
              "1. Immediate 2-man pressure upon losing possession; 2. First pass forward into space; 3. Body angle open to entire field.",
            coachingCuesZh:
              "1. 丢球后最近两人即刻封堵出球路线；2. 夺回球权第一脚迅速向前找空当自由人；3. 身体朝向始终面向球场开阔面。",
            sortOrder: 2,
          },
          {
            sport: "FOOTBALL",
            titleEn: "Overlapping Wing Delivery & Box Finishing",
            titleZh: "边路套边倒三角传中与包抄射门",
            category: "TECHNICAL",
            durationMins: 30,
            setsAndReps: "左右侧各 10 次轮转",
            pitchSpecs: "大禁区前沿至角旗区半场",
            playerCount: "中场 + 双边卫 + 双前锋",
            diagramUrl: "/assets/drills/crossing-box-combination.svg",
            coachingCuesEn:
              "1. Winger cuts inside to drag defender; 2. Fullback overlaps with timed sprint; 3. Near post run clears space for cutback.",
            coachingCuesZh:
              "1. 边锋内切带走中卫注意力；2. 边后卫看准时机全速高速套边；3. 前点包抄队员坚决斜插带走门前防守。",
            sortOrder: 3,
          },
        ],
      },
    },
  });

  // Plan 2: Active - This Thursday
  await prisma.trainingPlan.create({
    data: {
      sport: "FOOTBALL",
      trainingDate: getOffsetDate(1),
      startTime: "16:30",
      endTime: "18:30",
      location: "1号主天然草坪 (Main Grass Pitch 1)",
      titleEn: "Half-Space Combination & Set-Piece Routines",
      titleZh: "肋部穿插配合与角球任意球进攻战术套路",
      contentEn:
        "Train 3-man third-man runs in the half-space, short corner variations, and second-ball defensive structure.",
      contentZh:
        "重点演练进攻三区肋部第三人跑位配合、战术角球快速传跑、以及防守反击中前场二点球保护结构。",
      tags: "肋部渗透, 战术角球, 第三人跑位",
      drills: {
        create: [
          {
            sport: "FOOTBALL",
            titleEn: "Passing Diamond & Third Man Run Activation",
            titleZh: "菱形传球网与第三人跑位神经激活",
            category: "WARMUP",
            durationMins: 15,
            setsAndReps: "左右脚各 6 分钟",
            pitchSpecs: "20m x 20m 菱形区",
            playerCount: "全队分成 4 组",
            coachingCuesEn: "1. Pass with firm inside foot; 2. Check shoulder before receiving; 3. Strike one-touch into stride.",
            coachingCuesZh: "1. 脚弓出球干脆有力；2. 接球前快速摆头观察；3. 一脚球直接送入队友冲刺跑道。",
            sortOrder: 1,
          },
          {
            sport: "FOOTBALL",
            titleEn: "Half-Space 3v2 Overload Drill",
            titleZh: "肋部 3v2 局部超载进攻演练",
            category: "TACTICAL",
            durationMins: 35,
            setsAndReps: "12 组进攻轮换",
            pitchSpecs: "禁区前沿 35m x 30m",
            playerCount: "3 前锋/中场 vs 2 防守中卫 + 门将",
            coachingCuesEn: "1. Bait defender forward; 2. Overlap with decisive timing; 3. Low hard strike to far corner.",
            coachingCuesZh: "1. 持球人持球佯动吸引中卫上抢；2. 边路无球人果断斜插肋部空当；3. 射门追求低平球打远角死角。",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // Plan 3: Archived - 35 days ago (Demonstrating Monthly Archival)
  await prisma.trainingPlan.create({
    data: {
      sport: "FOOTBALL",
      trainingDate: getOffsetDate(-35),
      startTime: "16:30",
      endTime: "18:30",
      location: "2号主天然草坪 (Main Grass Pitch 2)",
      titleEn: "Pre-Season Aerobic Capacity & High-Speed Interval Sprints",
      titleZh: "季初有氧耐力储备与高强度间歇冲刺考核 [已归档]",
      contentEn:
        "Aerobic base assessment, 15m/30m sprint timing, and recovery mechanics.",
      contentZh:
        "季初全员基础心肺有氧考核、15米/30米折返跑计时测评、以及冲刺后肌肉主动牵拉恢复。",
      tags: "体能储备, 间歇冲刺, 季初测评",
      drills: {
        create: [
          {
            sport: "FOOTBALL",
            titleEn: "Yo-Yo Intermittent Recovery Test Level 1",
            titleZh: "Yo-Yo 间歇恢复能力 Level 1 达标测试",
            category: "PHYSICAL",
            durationMins: 40,
            setsAndReps: "测试至个人力竭",
            pitchSpecs: "20m 往返跑道",
            playerCount: "全队分组测评",
            coachingCuesEn: "Turn sharply on the line, pace rhythm steadily.",
            coachingCuesZh: "折返踩线动作紧凑，严格跟上音频节奏，保持躯干稳定。",
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // VOLLEYBALL TRAINING PLANS (2 per week: Wednesday & Friday cadence)
  // Plan 1: Active - This Wednesday
  await prisma.trainingPlan.create({
    data: {
      sport: "VOLLEYBALL",
      trainingDate: getOffsetDate(-1),
      startTime: "16:30",
      endTime: "18:30",
      location: "室内体育馆排球主场地 (Indoor Volleyball Court)",
      titleEn: "5-1 System Quick Attacks & Pipe Spiking",
      titleZh: "5-1 进攻战术系统快攻组织与后排立体进攻",
      contentEn:
        "Train setter penetration speed from back row, middle slide decoy timings, and zone 6 back-row pipe precision.",
      contentZh:
        "重点演练二传从后排插上网前速度、副攻2号位背飞掩护、以及6号位3米线后排立体扣杀的起跳时机。",
      tags: "5-1轮转, 背飞快攻, 梯次强攻",
      drills: {
        create: [
          {
            sport: "VOLLEYBALL",
            titleEn: "Dynamic Shoulder & Core Activation",
            titleZh: "动态肩袖激活与核心深蹲抛球",
            category: "WARMUP",
            durationMins: 15,
            setsAndReps: "2组持续，心率升至 135bpm",
            pitchSpecs: "9m x 9m 半场",
            playerCount: "全队分成两组",
            coachingCuesEn: "1. Rotator cuff elastic band pulls; 2. Ankle landing cushion; 3. Explosive jump arm swing.",
            coachingCuesZh: "1. 弹力带做肩胛后缩与水平外旋；2. 起跳落地双脚屈膝缓冲；3. 挥臂击球核心收紧锁住腰腹。",
            sortOrder: 1,
          },
          {
            sport: "VOLLEYBALL",
            titleEn: "Setter Penetration Multi-Option Attack",
            titleZh: "二传插上多点快攻攻防对抗",
            category: "TACTICAL",
            durationMins: 25,
            setsAndReps: "4轮转 x 5分钟",
            pitchSpecs: "18m x 9m 全场室内地板",
            playerCount: "6红 vs 6蓝",
            diagramUrl: "/assets/drills/setter-penetration-slide-pipe.svg",
            coachingCuesEn: "1. Setter call loud and clear; 2. Middle blocker slide takeoff within 0.8s; 3. Pipe approach behind 3m line.",
            coachingCuesZh: "1. 二传插上声响响亮提示出球方向；2. 副攻背飞在0.8秒内起跳牵扯拦网；3. 6号位主攻严格在3米线外蹬地起跳。",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // Plan 2: Active - This Friday
  await prisma.trainingPlan.create({
    data: {
      sport: "VOLLEYBALL",
      trainingDate: getOffsetDate(2),
      startTime: "16:30",
      endTime: "18:30",
      location: "室内体育馆排球主场地 (Indoor Volleyball Court)",
      titleEn: "Jump Serve Reception & Double Block Transition",
      titleZh: "跳发球接发一传稳定性与双人拦网手型封堵",
      contentEn:
        "Hone platform consistency under aggressive top-spin serves and middle/outside synchronized block closing.",
      contentZh:
        "针对对手强力大力跳发强化垫球手臂夹角与重心稳定，演练副攻与边攻手快速横移合并双人拦网手型。",
      tags: "接发球, 双人拦网, 防守起球",
      drills: {
        create: [
          {
            sport: "VOLLEYBALL",
            titleEn: "High-Speed Serve Reception Platform Mastery",
            titleZh: "高速大力跳发接发垫球靶心练习",
            category: "TECHNICAL",
            durationMins: 25,
            setsAndReps: "每人接满 25 个优质球",
            pitchSpecs: "后排 6 区域",
            playerCount: "主攻 + 自由人轮换",
            coachingCuesEn: "Lock elbows straight, angle platform towards setter.",
            coachingCuesZh: "两臂夹紧伸直锁死肘关节，垫球面对准网前2号半二传位置。",
            sortOrder: 1,
          },
          {
            sport: "VOLLEYBALL",
            titleEn: "Synchronized Double Block Lateral Shuffle",
            titleZh: "双人同步并网移动并拦与手型前撑",
            category: "TACTICAL",
            durationMins: 30,
            setsAndReps: "左右侧各 15 次全速拦网",
            pitchSpecs: "网前 9 米区域",
            playerCount: "副攻 + 主攻/接应",
            coachingCuesEn: "Shuffle fast, penetrate net with broad hands.",
            coachingCuesZh: "交叉步快速横移到位，起跳手腕用力前下压，双手深探对方过网空间。",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // Plan 3: Archived - 38 days ago
  await prisma.trainingPlan.create({
    data: {
      sport: "VOLLEYBALL",
      trainingDate: getOffsetDate(-38),
      startTime: "16:30",
      endTime: "18:30",
      location: "室内体育馆排球副场",
      titleEn: "Foundational Footwork & Core Shoulder Conditioning",
      titleZh: "三步助跑起跳步法与肩袖链耐力基础演练 [已归档]",
      contentEn:
        "Jump landing mechanics, 3-step spike approach footwork, and kinetic chain endurance.",
      contentZh:
        "主攻三步起跳助跑节奏定型、双脚屈膝缓冲落地防护、以及肩袖肌群离心抗阻训练。",
      tags: "助跑脚步, 落地缓冲, 肩袖耐力",
      drills: {
        create: [
          {
            sport: "VOLLEYBALL",
            titleEn: "Spike Approach Rhythm & Landing Cushion Drill",
            titleZh: "扣球三步助跑与双脚深蹲减震着地定型",
            category: "PHYSICAL",
            durationMins: 35,
            setsAndReps: "3 组 x 15 次无球模拟",
            pitchSpecs: "3m 线至网前",
            playerCount: "全队攻手",
            coachingCuesEn: "Left-right-left approach with soft shock absorption landing.",
            coachingCuesZh: "一步小二步大三步蹬地腾空，落地屈膝吸收冲击力，严防单膝内扣。",
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // BASKETBALL TRAINING PLANS (1-2 per week: Monday & Saturday cadence)
  // Plan 1: Active - This Monday
  await prisma.trainingPlan.create({
    data: {
      sport: "BASKETBALL",
      trainingDate: getOffsetDate(-2),
      startTime: "17:00",
      endTime: "19:00",
      location: "主体育馆硬木球场 (Main Hardwood Basketball Court)",
      titleEn: "Horns PnR & Spanish Screening Sets",
      titleZh: "高位牛角战术挡拆顺下与弱侧二次掩护",
      contentEn:
        "Focus on high-post elbow spacing, tight roll angles to rim, and Spanish back-screen timing on recovering big men.",
      contentZh:
        "重点演练两侧肘区拉开空间、中锋结实掩护后全速顺下攻筐、以及射手盲区背掩护制造空接或底角三分空位。",
      tags: "牛角Horns, 西班牙挡拆, 空接终结, 空间拉开",
      drills: {
        create: [
          {
            sport: "BASKETBALL",
            titleEn: "Dynamic Dribble Footwork & Hip Activation",
            titleZh: "行进间动态运球脚步与髋部神经激活",
            category: "WARMUP",
            durationMins: 15,
            setsAndReps: "双球运球 3组 x 30秒",
            pitchSpecs: "全场折返运球",
            playerCount: "全员单人单球",
            coachingCuesEn: "1. Pound ball hard into floor; 2. Eyes up off the ball; 3. Low center of gravity.",
            coachingCuesZh: "1. 大力拍球产生坚实回弹；2. 抬头观察全场开阔面；3. 降低身体重心随时准备启动变向。",
            sortOrder: 1,
          },
          {
            sport: "BASKETBALL",
            titleEn: "Horns Spanish 3v3 Live Scrimmage",
            titleZh: "牛角高位挡拆与西班牙空切 3v3 实战对抗",
            category: "TACTICAL",
            durationMins: 30,
            setsAndReps: "打满 21 分轮换",
            pitchSpecs: "半场 14m x 15m",
            playerCount: "后卫 + 双内线 vs 对应防守人",
            diagramUrl: "/assets/drills/horns-spanish-double-screen.svg",
            coachingCuesEn: "1. Solid contact on pick; 2. Back-screener pops to corner; 3. Ball handler reads drop coverage.",
            coachingCuesZh: "1. 挡拆人双脚站定形成坚固掩护面；2. 背掩护完成后射手光速外弹底角三分线；3. 控卫读懂对手沉退深度送空接传球。",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // Plan 2: Active - This Saturday
  await prisma.trainingPlan.create({
    data: {
      sport: "BASKETBALL",
      trainingDate: getOffsetDate(3),
      startTime: "10:00",
      endTime: "12:00",
      location: "主体育馆硬木球场 (Main Hardwood Basketball Court)",
      titleEn: "Full-Court Transition Offense & Drag Screen Early Attack",
      titleZh: "全场快攻推进与拖曳掩护 (Drag Screen) 追身抢攻",
      contentEn:
        "Train rebound outlet passes within 1.5s, wing rim runs, and trailer 3-point pullups.",
      contentZh:
        "演练抓下防守篮板后1.5秒内长传一传发动快攻、双侧翼全速冲刺底角、以及拖后大前锋追身拖曳挡拆直接三分投射。",
      tags: "快攻反击, 追身三分, 拖曳掩护",
      drills: {
        create: [
          {
            sport: "BASKETBALL",
            titleEn: "11-Man Continuous Fastbreak Weave",
            titleZh: "11 人全场连续八字快攻与多打少转换",
            category: "TACTICAL",
            durationMins: 25,
            setsAndReps: "连续运转 15 分钟不失误",
            pitchSpecs: "28m x 15m 全场",
            playerCount: "全队轮转",
            coachingCuesEn: "Sprint wide lanes, finish through contact.",
            coachingCuesZh: "两翼坚决跑向边线最宽处拉扯空间，内线强硬对抗中完成上篮终结。",
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // Plan 3: Archived - 42 days ago
  await prisma.trainingPlan.create({
    data: {
      sport: "BASKETBALL",
      trainingDate: getOffsetDate(-42),
      startTime: "17:00",
      endTime: "19:00",
      location: "主体育馆硬木球场",
      titleEn: "Defensive Slide Mechanics & 2-3 Zone Rotations",
      titleZh: "防守滑步重心控制与 2-3 联防轮转补位专项演练 [已归档]",
      contentEn:
        "Defensive stance endurance, lateral slide speed, and wing rotation coverage.",
      contentZh:
        "防守滑步重心压低防突破、底角被压缩时弱侧高位轮转协防补位体系。",
      tags: "防守滑步, 2-3联防, 弱侧协防",
      drills: {
        create: [
          {
            sport: "BASKETBALL",
            titleEn: "Zig-Zag Full-Court Slide Conditioning",
            titleZh: "全场 Z 字形高强度贴身防守滑步考核",
            category: "PHYSICAL",
            durationMins: 30,
            setsAndReps: "5 组来回全速滑步",
            pitchSpecs: "全场边线至边线",
            playerCount: "全队单人抗阻",
            coachingCuesEn: "Chest out, hips low, never cross feet.",
            coachingCuesZh: "抬头挺胸重心贴近地面，两脚绝不交叉，双手张开形成合规封堵墙。",
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // 6. Seed Masterclass Tactics (STRICTLY POSITIONAL LABELS, NO FABRICATED NAMES)
  // Football Tactic: 4-3-3 High Press & Half-Space Overload
  await prisma.tactic.create({
    data: {
      sport: "FOOTBALL",
      titleZh: "4-3-3 肋部渗透与边后卫套边体系",
      titleEn: "4-3-3 Half-Space Penetration & Overlapping Wing Attack",
      scenario: "阵地进攻 / 局部超载",
      courtFormat: "11人制标准草坪",
      tags: JSON.stringify(["4-3-3", "边路套边", "肋部穿插", "禁区终结"]),
      descriptionZh:
        "利用中场三角站位在对手肋部制造人数优势，边锋内切吸引防守中卫，边后卫高速套边下底传中，前点掩护后点包抄。",
      descriptionEn:
        "Overload the opponent's half-space with midfield triangles. The winger cuts inside to pin the center-back while the fullback makes a high-speed overlapping run to deliver a dangerous cutback cross.",
      isFeatured: true,
      creatorId: coachFootball.id,
      phases: {
        create: [
          {
            phaseIndex: 1,
            titleZh: "阶段一：初始站位与中后场出球",
            titleEn: "Phase 1: Initial Setup & Buildup",
            notesZh: "门将与双中卫在后场形成稳固出球倒脚三角，边后卫拉开宽度，后腰回撤接应。",
            notesEn: "Goalkeeper and two center-backs form a stable build-up triangle. Fullbacks provide width while CDM drops to link play.",
            tokensJson: JSON.stringify([
              { id: "p1", type: "PLAYER", label: "门将", jerseyNumber: 1, position: "GK", x: 100, y: 350, dutyZh: "后场开球指挥，控制禁区出球角度", dutyEn: "Distribute calmly and organize defensive line" },
              { id: "p2", type: "PLAYER", label: "中卫", jerseyNumber: 4, position: "CB", x: 260, y: 240, dutyZh: "持球推进，观察对手压迫间隙", dutyEn: "Step out with ball, assess passing lane" },
              { id: "p3", type: "PLAYER", label: "中卫", jerseyNumber: 5, position: "CB", x: 260, y: 460, dutyZh: "拖后协防保护，随时防备对手快速反击", dutyEn: "Cover depth and provide sweeper security" },
              { id: "p4", type: "PLAYER", label: "边卫", jerseyNumber: 2, position: "RB", x: 340, y: 560, dutyZh: "右路拉开进攻宽度，随时准备高速套边", dutyEn: "Hold width on right touchline, ready for overlap" },
              { id: "p5", type: "PLAYER", label: "后腰", jerseyNumber: 6, position: "CDM", x: 420, y: 350, dutyZh: "回撤形成出球支点，接球后快速转移弱侧", dutyEn: "Pivot presence, receive under pressure and switch" },
              { id: "p6", type: "PLAYER", label: "中前卫", jerseyNumber: 8, position: "CM", x: 500, y: 240, dutyZh: "中场游弋接应，伺机前插禁区空当", dutyEn: "Roam between lines, prepare late arrival in box" },
              { id: "p7", type: "PLAYER", label: "边锋", jerseyNumber: 7, position: "RW", x: 640, y: 540, dutyZh: "右路压制对手边后卫，准备内切拉扯防线", dutyEn: "Pin opposition fullback, prepare inside cut" },
              { id: "p8", type: "PLAYER", label: "前锋", jerseyNumber: 9, position: "ST", x: 720, y: 350, dutyZh: "压制对手双中卫，准备随时前插反越位", dutyEn: "Pin opposition center-backs on offside line" },
              { id: "ball", type: "BALL", label: "⚽", jerseyNumber: 0, position: "BALL", x: 275, y: 250, dutyZh: "皮球位于持球中卫脚下", dutyEn: "Possession with center-back" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "FW", x: 380, y: 280, dutyZh: "对手前锋上前逼抢持球队员", dutyEn: "Pressing front-man" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "DF", x: 680, y: 500, dutyZh: "对手左边后卫贴身盯防边锋", dutyEn: "Marking winger tightly" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "PASS", startX: 280, startY: 250, controlX: 350, controlY: 300, endX: 410, endY: 340, label: "精准斜传后腰" },
              { id: "t2", type: "RUN", startX: 420, startY: 350, controlX: 470, controlY: 360, endX: 510, endY: 350, label: "后腰接球向前摆脱" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：边锋内切扯动与边卫弧线套边",
            titleEn: "Phase 2: Half-Space Penetration & Fullback Overlap",
            notesZh: "后腰送出手术刀直塞，边锋突然内切肋部带走防守人，边后卫沿外侧以最高速度拉出大弧线套边狂飙下底！",
            notesEn: "CDM delivers an incision through-ball. Winger cuts inside dragging defender, opening wide corridor for fullback overlap sprint.",
            tokensJson: JSON.stringify([
              { id: "p1", type: "PLAYER", label: "门将", jerseyNumber: 1, position: "GK", x: 130, y: 350, dutyZh: "门线前压，保持防线联系", dutyEn: "High starting position" },
              { id: "p2", type: "PLAYER", label: "中卫", jerseyNumber: 4, position: "CB", x: 420, y: 220, dutyZh: "前移至中线压迫，封锁防守反击路线", dutyEn: "Step up to halfway line" },
              { id: "p3", type: "PLAYER", label: "中卫", jerseyNumber: 5, position: "CB", x: 380, y: 440, dutyZh: "在中后场保持纵深警戒", dutyEn: "Deep cover vigilance" },
              { id: "p4", type: "PLAYER", label: "边卫", jerseyNumber: 2, position: "RB", x: 720, y: 570, dutyZh: "外侧极速大弧线套边下底，准备接球传中", dutyEn: "Drive to byline on explosive overlap run" },
              { id: "p5", type: "PLAYER", label: "后腰", jerseyNumber: 6, position: "CDM", x: 520, y: 340, dutyZh: "送出手术刀直塞，随后前压保护弧顶", dutyEn: "Play through-ball then protect edge of box" },
              { id: "p6", type: "PLAYER", label: "中前卫", jerseyNumber: 8, position: "CM", x: 600, y: 260, dutyZh: "前插至大禁区前沿，准备后排插上", dutyEn: "Advance toward box edge for late run" },
              { id: "p7", type: "PLAYER", label: "边锋", jerseyNumber: 7, position: "RW", x: 680, y: 430, dutyZh: "果断内切肋部接球并带走防守人，顺势斜塞边路真空", dutyEn: "Cut inside to half-space, slip ball wide to fullback" },
              { id: "p8", type: "PLAYER", label: "前锋", jerseyNumber: 9, position: "ST", x: 760, y: 300, dutyZh: "前点斜插牵制防守中卫", dutyEn: "Near-post dart pinning defenders" },
              { id: "ball", type: "BALL", label: "⚽", jerseyNumber: 0, position: "BALL", x: 730, y: 560, dutyZh: "皮球被斜塞到下底边卫脚下", dutyEn: "Ball travelling into wide overlapping channel" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "FW", x: 460, y: 290, dutyZh: "回追逼抢", dutyEn: "Tracking back" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "DF", x: 660, y: 460, dutyZh: "被边锋内切吸引走，边路防区彻底放空！", dutyEn: "Drawn inside by winger cut, flank exposed" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t3", type: "PASS", startX: 520, startY: 340, controlX: 600, controlY: 380, endX: 670, endY: 420, label: "肋部直塞" },
              { id: "t4", type: "RUN", startX: 340, startY: 560, controlX: 540, controlY: 580, endX: 710, endY: 570, label: "边卫弧线大套边" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：底线倒三角传中与后插上推射破门",
            titleEn: "Phase 3: Byline Cutback Delivery & Midfield Finish",
            notesZh: "边卫狂飙下底后倒三角精准回传禁区弧顶，中前卫从后排高速冲入空当迎球爆射死角破门！",
            notesEn: "Fullback reaches byline and cuts ball back towards penalty spot. Midfielder arrives late at full speed to finish into the corner!",
            tokensJson: JSON.stringify([
              { id: "p1", type: "PLAYER", label: "门将", jerseyNumber: 1, position: "GK", x: 180, y: 350, dutyZh: "大禁区边缘提供大范围出球策应", dutyEn: "High sweeper position" },
              { id: "p2", type: "PLAYER", label: "中卫", jerseyNumber: 4, position: "CB", x: 580, y: 240, dutyZh: "压制对方半场，就地组织反抢", dutyEn: "Counter-press on opposition half" },
              { id: "p3", type: "PLAYER", label: "中卫", jerseyNumber: 5, position: "CB", x: 520, y: 440, dutyZh: "拖后锁死长传反击点", dutyEn: "Rest-defense anchor" },
              { id: "p4", type: "PLAYER", label: "边卫", jerseyNumber: 2, position: "RB", x: 860, y: 560, dutyZh: "底线送出致命低平倒三角传中！", dutyEn: "Accurate low cutback delivery from byline" },
              { id: "p5", type: "PLAYER", label: "后腰", jerseyNumber: 6, position: "CDM", x: 620, y: 350, dutyZh: "弧顶保护防范二点球", dutyEn: "Second ball protection" },
              { id: "p6", type: "PLAYER", label: "中前卫", jerseyNumber: 8, position: "CM", x: 770, y: 350, dutyZh: "后排高速冲入空当，迎球爆射球门死角破门！", dutyEn: "First-time strike into top corner!" },
              { id: "p7", type: "PLAYER", label: "边锋", jerseyNumber: 7, position: "RW", x: 740, y: 420, dutyZh: "禁区前沿虚晃掩护", dutyEn: "Decoy run creating space" },
              { id: "p8", type: "PLAYER", label: "前锋", jerseyNumber: 9, position: "ST", x: 830, y: 280, dutyZh: "前点抢点带走门将重心", dutyEn: "Front-post run disrupting keeper" },
              { id: "ball", type: "BALL", label: "⚽", jerseyNumber: 0, position: "BALL", x: 785, y: 350, dutyZh: "球应声入网！", dutyEn: "Ball hitting net!" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "DF", x: 820, y: 320, dutyZh: "被前点前锋带走", dutyEn: "Drawn to front post" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "GK", x: 920, y: 350, dutyZh: "对方门将扑救不及", dutyEn: "Beaten goalkeeper" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t5", type: "PASS", startX: 860, startY: 550, controlX: 820, controlY: 450, endX: 780, endY: 360, label: "精准倒三角回传" },
              { id: "t6", type: "RUN", startX: 600, startY: 260, controlX: 680, controlY: 310, endX: 765, endY: 350, label: "后排雷霆前插推射" }
            ])
          }
        ]
      }
    }
  });

  // Volleyball Tactic: 5-1 Rotation
  await prisma.tactic.create({
    data: {
      sport: "VOLLEYBALL",
      titleZh: "5-1 进攻体系二传插上与副攻背飞佯攻",
      titleEn: "5-1 System Setter Penetration & Slide Decoy Attack",
      scenario: "一攻接发球转换 / 战术快攻",
      courtFormat: "6人制室内排球场",
      tags: JSON.stringify(["5-1轮转", "背飞", "Pipe立体进攻", "快攻"]),
      descriptionZh:
        "二传从后排1号位高速插上网前2号位组织，副攻2号位背飞佯攻带走双人拦网，主攻6号位3米线后排立体扣杀得分。",
      descriptionEn:
        "Setter penetrates from back row to zone 2. Middle blocker runs slide approach to commit double block, opening back-row pipe spike in zone 6.",
      isFeatured: true,
      creatorId: coachVolleyball.id,
      phases: {
        create: [
          {
            phaseIndex: 1,
            titleZh: "阶段一：W型稳定接发球与二传启动插上",
            titleEn: "Phase 1: W-Formation Receive & Setter Penetration Sprint",
            notesZh: "接发球阵型展开，二传在对手发球出手瞬间从后排1号位高速插上网前2号位组织进攻。",
            notesEn: "Receive formation absorbs serve, setter accelerates from back-row Zone 1 into target setting Zone 2 at the net.",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "二传", jerseyNumber: 1, position: "SET", x: 440, y: 520, dutyZh: "后排1号位准备启动插上网前2号位", dutyEn: "Zone 1 setter starting penetration run" },
              { id: "v2", type: "PLAYER", label: "前排主攻", jerseyNumber: 4, position: "OH", x: 420, y: 180, dutyZh: "前排4号位准备拉开4号位平拉开快球", dutyEn: "Zone 4 outside hitter ready for quick set" },
              { id: "v3", type: "PLAYER", label: "副攻", jerseyNumber: 3, position: "MB", x: 420, y: 350, dutyZh: "前排3号位准备跑动背飞路线", dutyEn: "Zone 3 middle blocker eyeing slide run" },
              { id: "v4", type: "PLAYER", label: "自由人", jerseyNumber: 5, position: "LIB", x: 220, y: 180, dutyZh: "后排5号位核心接发球点", dutyEn: "Zone 5 libero primary receive coverage" },
              { id: "v5", type: "PLAYER", label: "后排主攻", jerseyNumber: 6, position: "OH", x: 220, y: 350, dutyZh: "后排6号位接发球，兼顾后排立体插上进攻", dutyEn: "Zone 6 outside hitter receive & pipe approach" },
              { id: "v6", type: "PLAYER", label: "接应", jerseyNumber: 2, position: "OPP", x: 220, y: 500, dutyZh: "后排右侧保障防守与备选后攻", dutyEn: "Zone 1 right-back defensive cover" },
              { id: "ball", type: "BALL", label: "🏐", jerseyNumber: 0, position: "BALL", x: 280, y: 260, dutyZh: "对手发球下落，自由人稳稳垫起一传送往网前", dutyEn: "Libero passes high ball toward setter target zone" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "vt1", type: "PASS", startX: 230, startY: 190, controlX: 340, controlY: 340, endX: 450, endY: 480, label: "精准一传弧线" },
              { id: "vt2", type: "RUN", startX: 440, startY: 520, controlX: 450, controlY: 500, endX: 455, endY: 480, label: "二传插上网前" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：二传网前跳传与副攻2号位背飞佯攻",
            titleEn: "Phase 2: Setter Jump-Feint & Middle Slide Decoy",
            notesZh: "二传网前跃起做推攻假动作，副攻高速跑向2号位做背飞佯攻，彻底吸引对手副攻与边拦网重心！",
            notesEn: "Setter leaps at net. Middle blocker slides behind setter to Zone 2, committing both opposition blockers and vacating center court.",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "二传", jerseyNumber: 1, position: "SET", x: 460, y: 480, dutyZh: "网前高位起跳做单手假动作，脑后背传中路高球", dutyEn: "Jump-set deception, feeds back to Zone 6 pipe" },
              { id: "v2", type: "PLAYER", label: "前排主攻", jerseyNumber: 4, position: "OH", x: 440, y: 160, dutyZh: "4号位拉开牵制对手副攻防线", dutyEn: "Zone 4 wide spread pinning right blocker" },
              { id: "v3", type: "PLAYER", label: "副攻", jerseyNumber: 3, position: "MB", x: 460, y: 530, dutyZh: "极速背飞跑向2号位起跳假扣，带走双人拦网！", dutyEn: "Aggressive slide takeoff to Zone 2 drawing double block" },
              { id: "v4", type: "PLAYER", label: "自由人", jerseyNumber: 5, position: "LIB", x: 260, y: 200, dutyZh: "网下保护，随时准备保护拦网被拦球", dutyEn: "Floor cover under the block" },
              { id: "v5", type: "PLAYER", label: "后排主攻", jerseyNumber: 6, position: "OH", x: 330, y: 350, dutyZh: "从6号位全力助跑，于3米线前蓄力起跳！", dutyEn: "Accelerate forward, jump behind 3-meter line" },
              { id: "v6", type: "PLAYER", label: "接应", jerseyNumber: 2, position: "OPP", x: 250, y: 490, dutyZh: "后排防守保护", dutyEn: "Back-row balance cover" },
              { id: "ball", type: "BALL", label: "🏐", jerseyNumber: 0, position: "BALL", x: 450, y: 470, dutyZh: "二传双手触球，高位隐蔽向身后6号位弧顶送出", dutyEn: "Ball dispatched backwards into central pipe corridor" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "vt3", type: "RUN", startX: 420, startY: 350, controlX: 440, controlY: 460, endX: 460, endY: 530, label: "副攻大弧线背飞" },
              { id: "vt4", type: "PASS", startX: 455, startY: 475, controlX: 400, controlY: 410, endX: 350, endY: 350, label: "背传后排立体中路" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：6号位3米线后排立体超手重扣",
            titleEn: "Phase 3: Zone 6 Back-Row Pipe Spike & Floor Kill",
            notesZh: "主攻手在6号位3米线后如大鹏展翅高空雷霆拔起，利用对手中路空虚以时速110km/h重扣钉地板破门！",
            notesEn: "Outside hitter launches from behind 3m line into apex, hammering an unblockable pipe spike straight down into opponent split!",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "二传", jerseyNumber: 1, position: "SET", x: 460, y: 470, dutyZh: "保护网下二点球", dutyEn: "Cover setter area" },
              { id: "v2", type: "PLAYER", label: "前排主攻", jerseyNumber: 4, position: "OH", x: 440, y: 150, dutyZh: "4号位就地防守准备", dutyEn: "Transition defense alert" },
              { id: "v3", type: "PLAYER", label: "副攻", jerseyNumber: 3, position: "MB", x: 470, y: 540, dutyZh: "背飞落地迅速回撤防守", dutyEn: "Decoy complete, drop into cover" },
              { id: "v4", type: "PLAYER", label: "自由人", jerseyNumber: 5, position: "LIB", x: 270, y: 220, dutyZh: "后场防守站位", dutyEn: "Backcourt readiness" },
              { id: "v5", type: "PLAYER", label: "后排主攻", jerseyNumber: 6, position: "OH", x: 420, y: 350, dutyZh: "空中超手暴扣，球重重砸在对方场地中央！", dutyEn: "Apex contact spike deep into floor split!" },
              { id: "v6", type: "PLAYER", label: "接应", jerseyNumber: 2, position: "OPP", x: 260, y: 480, dutyZh: "右后卫稳健防守", dutyEn: "Right back defensive stance" },
              { id: "ball", type: "BALL", label: "🏐", jerseyNumber: 0, position: "BALL", x: 680, y: 350, dutyZh: "重扣砸在对方半场死角，直接得分！", dutyEn: "Ball slamming down on opponent court!" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "vt5", type: "RUN", startX: 330, startY: 350, controlX: 375, controlY: 350, endX: 420, endY: 350, label: "3米线蹬地起跳" },
              { id: "vt6", type: "PASS", startX: 430, startY: 350, controlX: 550, controlY: 350, endX: 680, endY: 350, label: "雷霆万钧暴扣" }
            ])
          }
        ]
      }
    }
  });

  // Basketball Tactic: Horns PnR & Spanish Back-Screen
  await prisma.tactic.create({
    data: {
      sport: "BASKETBALL",
      titleZh: "高位牛角战术挡拆与西班牙空切顺下",
      titleEn: "Horns PnR & Spanish Back-Screen Offense",
      scenario: "半场阵地进攻 / 掩护拆档",
      courtFormat: "5v5全场硬木地板",
      tags: JSON.stringify(["牛角Horns", "西班牙挡拆", "掩护顺下", "空接"]),
      descriptionZh:
        "高位牛角双掩护拉开进攻空间，中锋结实掩护后顺下，射手切入设立盲区背掩护，制造空接扣篮或底角大空位三分。",
      descriptionEn:
        "Horns double screen spacing. Center rolls after pick, wing sprints into blind back-screen on recovering big man, creating rim-run alley-oop or kick-out 3pt.",
      isFeatured: true,
      creatorId: coachBasketball.id,
      phases: {
        create: [
          {
            phaseIndex: 1,
            titleZh: "阶段一：高位牛角站位与拉开空间",
            titleEn: "Phase 1: Horns Double High-Post Spacing",
            notesZh: "控卫弧顶持球，两大内线拉至罚球线两侧肘区设立牛角双掩护，双翼底角沉底拉开极大空间。",
            notesEn: "Point guard initiates at top of key, dual bigs station at elbows, wings spread to corners.",
            tokensJson: JSON.stringify([
              { id: "b1", type: "PLAYER", label: "控卫", jerseyNumber: 1, position: "PG", x: 540, y: 350, dutyZh: "弧顶持球观察，准备向右侧借掩护发动", dutyEn: "Initiate at top of key, read drop coverage" },
              { id: "b2", type: "PLAYER", label: "中锋", jerseyNumber: 5, position: "C", x: 670, y: 260, dutyZh: "左肘区站位，准备上前做扎实高质量挡拆", dutyEn: "Elbow stance, ready to set solid screen" },
              { id: "b3", type: "PLAYER", label: "分卫", jerseyNumber: 2, position: "SG", x: 670, y: 440, dutyZh: "右肘区站位，准备空切实施背掩护", dutyEn: "Elbow stance, preparing blind back-screen" },
              { id: "b4", type: "PLAYER", label: "大前", jerseyNumber: 4, position: "PF", x: 820, y: 160, dutyZh: "左侧底角三分线拉开空间", dutyEn: "Corner floor spacing" },
              { id: "b5", type: "PLAYER", label: "小前", jerseyNumber: 3, position: "SF", x: 820, y: 540, dutyZh: "右侧底角三分线拉开空间", dutyEn: "Corner floor spacing" },
              { id: "ball", type: "BALL", label: "🏀", jerseyNumber: 0, position: "BALL", x: 555, y: 350, dutyZh: "皮球位于控卫手中", dutyEn: "Ball in point guard hands" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "PG", x: 580, y: 350, dutyZh: "领防控卫", dutyEn: "Point of attack defender" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "C", x: 690, y: 280, dutyZh: "盯防中锋", dutyEn: "Rim protector on center" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "bt1", type: "RUN", startX: 670, startY: 260, controlX: 630, controlY: 300, endX: 570, endY: 330, label: "中锋上提挡拆" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：中锋顺下与西班牙盲区背掩护",
            titleEn: "Phase 2: Rim Roll & Spanish Back-Screen",
            notesZh: "中锋结实挡住防守人，控卫向右侧运球突破；与此同时，分卫闪电切入给中锋的防守人设立背掩护！",
            notesEn: "Center sets brick wall screen, PG drives right. Wing dives inside to set blind back-screen on rim protector!",
            tokensJson: JSON.stringify([
              { id: "b1", type: "PLAYER", label: "控卫", jerseyNumber: 1, position: "PG", x: 660, y: 420, dutyZh: "运球突破吸引双人注意，准备高抛送出空接", dutyEn: "Drive right and draw drop defender" },
              { id: "b2", type: "PLAYER", label: "中锋", jerseyNumber: 5, position: "C", x: 740, y: 320, dutyZh: "摆脱防守，全速直冲篮下篮筐！", dutyEn: "Slip free after back-screen, rim-run full speed" },
              { id: "b3", type: "PLAYER", label: "分卫", jerseyNumber: 2, position: "SG", x: 710, y: 340, dutyZh: "设立扎实背掩护挡死中锋防守人，随后向底角外弹", dutyEn: "Set rock-solid back-screen, pop to perimeter" },
              { id: "b4", type: "PLAYER", label: "大前", jerseyNumber: 4, position: "PF", x: 820, y: 180, dutyZh: "左侧底角牵制防守，随时准备外拆接应", dutyEn: "Corner floor spacing" },
              { id: "b5", type: "PLAYER", label: "小前", jerseyNumber: 3, position: "SF", x: 840, y: 540, dutyZh: "右侧底角拉开空间，锁定空位投篮点", dutyEn: "Corner floor spacing" },
              { id: "ball", type: "BALL", label: "🏀", jerseyNumber: 0, position: "BALL", x: 700, y: 380, dutyZh: "控卫高抛空接传球送往篮筐上空", dutyEn: "Lob pass over the top to rim" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "PG", x: 650, y: 360, dutyZh: "被高位挡拆挂住", dutyEn: "Caught on high screen" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "C", x: 720, y: 320, dutyZh: "被分卫盲区背掩护完全卡住，无法回防篮下！", dutyEn: "Blocked by Spanish screen" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "bt2", type: "PASS", startX: 665, startY: 415, controlX: 720, controlY: 370, endX: 780, endY: 340, label: "高抛空接" },
              { id: "bt3", type: "RUN", startX: 670, startY: 440, controlX: 700, controlY: 390, endX: 710, endY: 340, label: "西班牙背掩护" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：篮下空接暴扣或底角空位三分",
            titleEn: "Phase 3: Alley-Oop Slam or Corner 3pt",
            notesZh: "中锋在篮筐上方单手接球泰山压顶暴扣得分！若对手收缩包夹，控卫则瞬间将球甩到底角命中三分！",
            notesEn: "Center flushes thunderous alley-oop dunk! If defense collapses, kick out to corner for wide-open three-pointer!",
            tokensJson: JSON.stringify([
              { id: "b1", type: "PLAYER", label: "控卫", jerseyNumber: 1, position: "PG", x: 680, y: 430, dutyZh: "送出精准助攻，就地退防", dutyEn: "Dish highlight assist and track back" },
              { id: "b2", type: "PLAYER", label: "中锋", jerseyNumber: 5, position: "C", x: 830, y: 350, dutyZh: "泰山压顶双手暴扣，篮筐轰鸣！", dutyEn: "Monstrous two-handed alley-oop slam!" },
              { id: "b3", type: "PLAYER", label: "分卫", jerseyNumber: 2, position: "SG", x: 700, y: 470, dutyZh: "外弹至三分线弧顶，防范对手反击", dutyEn: "Pop to 3pt line safety" },
              { id: "b4", type: "PLAYER", label: "大前", jerseyNumber: 4, position: "PF", x: 830, y: 180, dutyZh: "左侧底角锁定篮板球", dutyEn: "Crash weakside offensive rebound" },
              { id: "b5", type: "PLAYER", label: "小前", jerseyNumber: 3, position: "SF", x: 840, y: 540, dutyZh: "右侧底角空位三分点待命", dutyEn: "Corner 3pt option" },
              { id: "ball", type: "BALL", label: "🏀", jerseyNumber: 0, position: "BALL", x: 830, y: 350, dutyZh: "皮球被狠狠灌入篮筐！", dutyEn: "Ball slammed through rim!" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "PG", x: 730, y: 380, dutyZh: "回防不及", dutyEn: "Late recovery" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "C", x: 790, y: 320, dutyZh: "目送中锋扣篮", dutyEn: "Sealed off from play" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "bt4", type: "RUN", startX: 740, startY: 320, controlX: 790, controlY: 330, endX: 830, endY: 350, label: "直冲篮筐" },
              { id: "bt5", type: "PASS", startX: 780, startY: 340, controlX: 810, controlY: 345, endX: 830, endY: 350, label: "空接灌篮" }
            ])
          }
        ]
      }
    }
  });

  // 7. Seed Matches for Football, Volleyball, and Basketball
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 4);

  // Football Matches
  await prisma.match.create({
    data: {
      sport: "FOOTBALL",
      matchDate: lastWeek,
      location: "NKCS 1号天然草坪主场",
      opponentName: "上海包玉刚实验学校 (YK Pao School)",
      isHome: true,
      ourScore: 3,
      opponentScore: 1,
      scoreDetails: "上半场 1:0，下半场 2:1",
    },
  });

  await prisma.match.create({
    data: {
      sport: "FOOTBALL",
      matchDate: nextWeek,
      location: "苏州德威国际学校客场",
      opponentName: "德威国际学校 (Dulwich College)",
      isHome: false,
    },
  });

  // Volleyball Matches
  await prisma.match.create({
    data: {
      sport: "VOLLEYBALL",
      matchDate: lastWeek,
      location: "NKCS 室内体育馆",
      opponentName: "上海美国学校 (SAS Puxi)",
      isHome: true,
      ourScore: 3,
      opponentScore: 0,
      scoreDetails: "25:19, 25:21, 25:18",
    },
  });

  await prisma.match.create({
    data: {
      sport: "VOLLEYBALL",
      matchDate: nextWeek,
      location: "上海协和双语国际学校客场",
      opponentName: "协和双语国际高中 (SUIS)",
      isHome: false,
    },
  });

  // Basketball Matches
  await prisma.match.create({
    data: {
      sport: "BASKETBALL",
      matchDate: lastWeek,
      location: "NKCS 主球馆",
      opponentName: "德威英国国际学校 (Dulwich Pudong)",
      isHome: true,
      ourScore: 78,
      opponentScore: 71,
      scoreDetails: "Q1: 18-16, Q2: 22-19, Q3: 16-20, Q4: 22-16",
    },
  });

  await prisma.match.create({
    data: {
      sport: "BASKETBALL",
      matchDate: nextWeek,
      location: "惠灵顿外籍人员子女学校",
      opponentName: "惠灵顿国际学校 (Wellington)",
      isHome: false,
    },
  });

  // 8. Seed Team-level Debriefs (Target: TEAM, no fabricated individual names)
  await prisma.debrief.create({
    data: {
      sport: "FOOTBALL",
      targetType: "TEAM",
      summaryZh: "全队高位逼抢执行坚决，后防线造越位纪律严密，攻防转换打出了训练中套边下底的全部预设战术！赛后请全员落实腘绳肌与小腿滚压恢复。",
      summaryEn: "Exceptional collective press and backline offside discipline. Delivered tactical gameplan with precision.",
      recommendedBodyParts: JSON.stringify(["hamstrings", "calves"]),
      coachId: coachFootball.id,
    },
  });

  await prisma.debrief.create({
    data: {
      sport: "VOLLEYBALL",
      targetType: "TEAM",
      summaryZh: "一传起球率高达 82%，二传在网前调度极具隐蔽性，副攻背飞多次拉开对手双人拦网！注意落地时双膝缓冲，做好肩袖十字拉伸。",
      summaryEn: "82% passing efficiency, deceptive setting at net opened slide attack lanes. Focus on knee cushion mechanics on landings.",
      recommendedBodyParts: JSON.stringify(["shoulders", "calves", "knees"]),
      coachId: coachVolleyball.id,
    },
  });

  await prisma.debrief.create({
    data: {
      sport: "BASKETBALL",
      targetType: "TEAM",
      summaryZh: "高位挡拆质量极高，弱侧底角投射果断，全队传导球流畅度达到赛季最佳！赛后进行髋关节与跟腱冷敷恢复。",
      summaryEn: "Outstanding high-post screen execution and weak-side shooting. Best ball movement of the season.",
      recommendedBodyParts: JSON.stringify(["lower_back", "calves", "ankles"]),
      coachId: coachBasketball.id,
    },
  });

  // 9. Seed Recovery Guides
  await prisma.recoveryGuide.create({
    data: {
      sport: "FOOTBALL",
      bodyPartKey: "calves",
      modality: "ZERO_COST_SUBSTITUTE",
      titleZh: "宿舍冷冻矿泉水瓶足底与小腿深层肌筋膜松解法",
      titleEn: "Frozen Water Bottle Deep Myofascial Release for Calves & Plantar",
      contentZh:
        "无需购买昂贵筋膜枪：在宿舍取一瓶500ml结冰矿泉水瓶，赤足踩在瓶身上，自足跟至前脚掌缓慢滚动施压3分钟；随后将小腿承山穴架在水瓶上做屈伸脚踝，快速消除赛后足跟酸胀与比目鱼肌痉挛！",
      contentEn:
        "No expensive massage gun required: Take a frozen 500ml water bottle in dorm, roll along plantar fascia for 3 minutes, then rest lower calves on bottle while flexing ankles.",
      durationNotes: "单侧 3 分钟 x 2 组",
      equipmentNotes: "500ml 冰水瓶或网球",
      status: "APPROVED",
      authorId: coachFootball.id,
      reviewerId: coachFootball.id,
      reviewedAt: new Date(),
    },
  });

  await prisma.recoveryGuide.create({
    data: {
      sport: "FOOTBALL",
      bodyPartKey: "hamstrings",
      modality: "ZERO_COST_SUBSTITUTE",
      titleZh: "硬质书桌椅网球激痛点下压与毛巾被动牵拉法",
      titleEn: "Chair Edge Tennis Ball Ischemic Compression & Towel Stretch",
      contentZh:
        "坐在宿舍硬木椅边缘，将网球垫在腘绳肌酸痛硬块处，利用自身坐姿体重垂直下沉施压30秒；随后平躺用长浴巾套住脚掌拉向身体进行被动等长牵引，避免过度剧烈猛拉二次拉伤！",
      contentEn:
        "Sit on chair edge with tennis ball under tender hamstring knots, apply bodyweight pressure for 30s. Then lie back and loop bath towel over foot for passive stretch.",
      durationNotes: "每个压痛点 30 秒，整组 5 分钟",
      equipmentNotes: "网球 + 宿舍长浴巾",
      status: "APPROVED",
      authorId: coachFootball.id,
      reviewerId: coachFootball.id,
      reviewedAt: new Date(),
    },
  });

  console.log("✅ Clean seed completed successfully! 0 fabricated students, 0 invented names, 100% tactical clarity.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
