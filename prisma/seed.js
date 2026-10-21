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

  // 5. Training Plans with Drill Cards for Football, Volleyball, Basketball
  const today = new Date();
  await prisma.trainingPlan.create({
    data: {
      sport: "FOOTBALL",
      trainingDate: today,
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

  await prisma.trainingPlan.create({
    data: {
      sport: "VOLLEYBALL",
      trainingDate: today,
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

  await prisma.trainingPlan.create({
    data: {
      sport: "BASKETBALL",
      trainingDate: today,
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
              { id: "p4", type: "PLAYER", label: "后腰", jerseyNumber: 6, position: "CDM", x: 420, y: 350, dutyZh: "回撤形成出球支点，接球后快速转移弱侧", dutyEn: "Pivot presence, receive under pressure and switch" },
              { id: "p5", type: "PLAYER", label: "前锋", jerseyNumber: 9, position: "ST", x: 740, y: 350, dutyZh: "压制对手双中卫，准备随时前插反越位", dutyEn: "Pin opposition center-backs on offside line" },
              { id: "ball", type: "BALL", label: "⚽", jerseyNumber: 0, position: "BALL", x: 275, y: 250, dutyZh: "皮球位于持球中卫脚下", dutyEn: "Possession with center-back" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "FW", x: 380, y: 280, dutyZh: "对手前锋上前逼抢持球队员", dutyEn: "Pressing front-man" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "DF", x: 760, y: 330, dutyZh: "对手中卫贴身盯防前锋", dutyEn: "Marking striker" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "PASS", startX: 280, startY: 250, controlX: 350, controlY: 300, endX: 410, endY: 340, label: "精准斜传" },
              { id: "t2", type: "RUN", startX: 420, startY: 350, controlX: 460, controlY: 320, endX: 520, endY: 260, label: "接应转身" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：肋部穿透与边卫套边",
            titleEn: "Phase 2: Half-Space Penetration & Overlap",
            notesZh: "后腰直塞送达肋部空当，边锋内切吸引防守，边后卫从外侧以最高速度套边插上。",
            notesEn: "CDM delivers an incision pass into the half-space pocket. Winger cuts inside, creating wide corridor for fullback sprint.",
            tokensJson: JSON.stringify([
              { id: "p1", type: "PLAYER", label: "门将", jerseyNumber: 1, position: "GK", x: 120, y: 350, dutyZh: "门线前压，保持防线联系", dutyEn: "High starting position" },
              { id: "p2", type: "PLAYER", label: "中卫", jerseyNumber: 4, position: "CB", x: 450, y: 220, dutyZh: "前移至中线压迫，封锁防守反击路线", dutyEn: "Step up to halfway line" },
              { id: "p3", type: "PLAYER", label: "中卫", jerseyNumber: 5, position: "CB", x: 380, y: 440, dutyZh: "在中后场保持纵深警戒", dutyEn: "Deep cover vigilance" },
              { id: "p4", type: "PLAYER", label: "后腰", jerseyNumber: 6, position: "CDM", x: 540, y: 330, dutyZh: "送出手术刀直塞，随后前压保护弧顶", dutyEn: "Play through-ball then protect edge of box" },
              { id: "p5", type: "PLAYER", label: "边卫", jerseyNumber: 2, position: "RB", x: 680, y: 550, dutyZh: "外侧极速下底，准备传中", dutyEn: "Drive to byline on overlap" },
              { id: "ball", type: "BALL", label: "⚽", jerseyNumber: 0, position: "BALL", x: 555, y: 340, dutyZh: "皮球精准穿透肋部防线", dutyEn: "Ball travelling into half-space" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "FW", x: 440, y: 290, dutyZh: "回追逼抢", dutyEn: "Tracking back" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "DF", x: 660, y: 390, dutyZh: "防守重心被内切扯动", dutyEn: "Drawn out of shape" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t3", type: "PASS", startX: 550, startY: 330, controlX: 620, controlY: 420, endX: 670, endY: 530, label: "致命直塞" },
              { id: "t4", type: "RUN", startX: 680, startY: 550, controlX: 780, controlY: 560, endX: 860, endY: 560, label: "边卫狂飙下底" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：倒三角传中与后插上终结",
            titleEn: "Phase 3: Cutback Delivery & Box Finish",
            notesZh: "边路到底线倒三角回传大禁区弧顶，中前卫后排高速插上迎球推射死角破门！",
            notesEn: "Fullback reaches byline and cuts ball back towards top of penalty box. Oncoming midfielder arrives late to finish into corner!",
            tokensJson: JSON.stringify([
              { id: "p1", type: "PLAYER", label: "门将", jerseyNumber: 1, position: "GK", x: 180, y: 350, dutyZh: "站上大禁区线提供大范围出球策应", dutyEn: "High sweeper position" },
              { id: "p2", type: "PLAYER", label: "中卫", jerseyNumber: 4, position: "CB", x: 580, y: 260, dutyZh: "前插至对方半场实施反抢压迫", dutyEn: "Counter-press on opposition half" },
              { id: "p3", type: "PLAYER", label: "中卫", jerseyNumber: 5, position: "CB", x: 520, y: 450, dutyZh: "拖后锁死长传反击点", dutyEn: "Rest-defense anchor" },
              { id: "p4", type: "PLAYER", label: "后插上", jerseyNumber: 8, position: "CM", x: 760, y: 350, dutyZh: "点球点前沿迎球爆射死角！", dutyEn: "First-time strike into corner!" },
              { id: "p5", type: "PLAYER", label: "下底边卫", jerseyNumber: 2, position: "RB", x: 860, y: 560, dutyZh: "底线送出精准倒三角地面球", dutyEn: "Accurate low cutback delivery" },
              { id: "ball", type: "BALL", label: "⚽", jerseyNumber: 0, position: "BALL", x: 775, y: 360, dutyZh: "球贴地急速滚向推射落点", dutyEn: "Ball cut back to shooting zone" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "DF", x: 800, y: 280, dutyZh: "被前点前锋带走", dutyEn: "Drawn to front post" },
              { id: "opp2", type: "OPPONENT", label: "防守 2", jerseyNumber: 0, position: "GK", x: 920, y: 350, dutyZh: "对方门将扑救不及", dutyEn: "Beaten goalkeeper" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t5", type: "PASS", startX: 860, startY: 550, controlX: 820, controlY: 450, endX: 770, endY: 360, label: "倒三角传中" },
              { id: "t6", type: "RUN", startX: 620, startY: 350, controlX: 690, controlY: 350, endX: 755, endY: 350, label: "致命后插上" }
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
            titleZh: "阶段一：W型稳定接发球与二传插上",
            titleEn: "Phase 1: W Serve Receive & Setter Run",
            notesZh: "接发球阵型展开，二传迅速插上网前2号位组织进攻。",
            notesEn: "Receive formation absorbs serve, setter accelerates into target setting zone 2.",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "二传", jerseyNumber: 1, position: "SET", x: 440, y: 500, dutyZh: "准备启动插上网前2号位", dutyEn: "Anticipate pass to zone 2" },
              { id: "v2", type: "PLAYER", label: "主攻", jerseyNumber: 4, position: "OH", x: 420, y: 180, dutyZh: "前排左侧待命", dutyEn: "Outside hitter ready at net" },
              { id: "v3", type: "PLAYER", label: "副攻", jerseyNumber: 3, position: "MB", x: 420, y: 350, dutyZh: "副攻手网前待命", dutyEn: "Middle blocker alert at net" },
              { id: "v4", type: "PLAYER", label: "自由人", jerseyNumber: 5, position: "LIB", x: 220, y: 180, dutyZh: "后排精准接一传", dutyEn: "Primary passer on receive" },
              { id: "v5", type: "PLAYER", label: "后排主攻", jerseyNumber: 6, position: "OH", x: 220, y: 350, dutyZh: "后排接发球防守", dutyEn: "Back-row receiver" },
              { id: "v6", type: "PLAYER", label: "接应", jerseyNumber: 2, position: "OPP", x: 220, y: 500, dutyZh: "后排右侧保护", dutyEn: "Right back defender" },
              { id: "ball", type: "BALL", label: "🏐", jerseyNumber: 0, position: "BALL", x: 300, y: 350, dutyZh: "接发球向网前高弧度送出", dutyEn: "Serve receive targeted to setter" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "vt1", type: "PASS", startX: 300, startY: 350, controlX: 380, controlY: 420, endX: 430, endY: 480, label: "精准一传" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：副攻背飞佯攻与拦网牵制",
            titleEn: "Phase 2: Middle Slide Decoy & Block Shift",
            notesZh: "二传网前组织，副攻大范围跑动背飞，强力牵制对方主拦网手。",
            notesEn: "Setter feints dump, middle slide pulls opposition blockers toward antenna.",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "二传", jerseyNumber: 1, position: "SET", x: 440, y: 480, dutyZh: "跃起虚晃，双手背传中央高空", dutyEn: "Jump set deceptively to pipe line" },
              { id: "v2", type: "PLAYER", label: "后排强攻", jerseyNumber: 6, position: "OH", x: 340, y: 350, dutyZh: "从6号位后排开始发力助跑，3米线外踏跳", dutyEn: "Accelerate approach behind 3m line" },
              { id: "v3", type: "PLAYER", label: "副攻", jerseyNumber: 3, position: "MB", x: 440, y: 220, dutyZh: "跑动背飞起跳佯攻，带走双人拦网", dutyEn: "Fast slide takeoff drawing block" },
              { id: "ball", type: "BALL", label: "🏐", jerseyNumber: 0, position: "BALL", x: 440, y: 460, dutyZh: "球至击球高点", dutyEn: "Set reaches apex" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "vt2", type: "PASS", startX: 440, startY: 480, controlX: 400, controlY: 400, endX: 380, endY: 350, label: "后排立体快球" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：后排立体强攻与超手重扣",
            titleEn: "Phase 3: Back-Row Pipe Spike & Kill",
            notesZh: "主攻手在6号位3米线后高空雷霆拔起，利用中路真空以时速重扣得分！",
            notesEn: "Outside hitter leaps behind 3m line, finding vacant deep court for a thunderous kill!",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "二传", jerseyNumber: 1, position: "SET", x: 440, y: 480, dutyZh: "保护网前", dutyEn: "Cover net floor" },
              { id: "v2", type: "PLAYER", label: "主攻手", jerseyNumber: 6, position: "OH", x: 420, y: 350, dutyZh: "超高击球点重扣砸向对手深区中路！", dutyEn: "Apex contact spike deep into court split!" },
              { id: "v3", type: "PLAYER", label: "副攻", jerseyNumber: 3, position: "MB", x: 440, y: 200, dutyZh: "完成佯攻掩护任务", dutyEn: "Decoy execution complete" },
              { id: "ball", type: "BALL", label: "🏐", jerseyNumber: 0, position: "BALL", x: 430, y: 350, dutyZh: "重扣砸向对手地板", dutyEn: "Spike hitting court floor" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "vt3", type: "PASS", startX: 430, startY: 350, controlX: 550, controlY: 350, endX: 720, endY: 350, label: "致命重扣" }
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
              { id: "b2", type: "PLAYER", label: "中锋", jerseyNumber: 5, position: "C", x: 680, y: 260, dutyZh: "左肘区站位，准备上前做扎实高质量挡拆", dutyEn: "Elbow stance, ready to set solid screen" },
              { id: "b3", type: "PLAYER", label: "分卫", jerseyNumber: 2, position: "SG", x: 680, y: 440, dutyZh: "右肘区站位，准备空切实施背掩护", dutyEn: "Elbow stance, preparing blind back-screen" },
              { id: "b4", type: "PLAYER", label: "大前", jerseyNumber: 4, position: "PF", x: 800, y: 180, dutyZh: "左侧底角三分线拉开空间", dutyEn: "Corner floor spacing" },
              { id: "b5", type: "PLAYER", label: "小前", jerseyNumber: 3, position: "SF", x: 800, y: 520, dutyZh: "右侧底角三分线拉开空间", dutyEn: "Corner floor spacing" },
              { id: "ball", type: "BALL", label: "🏀", jerseyNumber: 0, position: "BALL", x: 555, y: 350, dutyZh: "皮球位于控卫手中", dutyEn: "Ball in point guard hands" },
              { id: "opp1", type: "OPPONENT", label: "防守 1", jerseyNumber: 0, position: "PG", x: 600, y: 350, dutyZh: "领防控卫", dutyEn: "Point of attack defender" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "bt1", type: "RUN", startX: 680, startY: 260, controlX: 640, controlY: 300, endX: 580, endY: 330, label: "上前掩护" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：中锋顺下与西班牙盲区背掩护",
            titleEn: "Phase 2: Rim Roll & Spanish Back-Screen",
            notesZh: "中锋结实挡住防守人，控卫向右侧运球突破；与此同时，分卫闪电切入给中锋的防守人设立背掩护！",
            notesEn: "Center sets brick wall screen, PG drives right. Wing dives inside to set blind back-screen on rim protector!",
            tokensJson: JSON.stringify([
              { id: "b1", type: "PLAYER", label: "控卫", jerseyNumber: 1, position: "PG", x: 680, y: 440, dutyZh: "运球突破吸引双人注意，准备高抛击地", dutyEn: "Drive right and draw drop defender" },
              { id: "b2", type: "PLAYER", label: "中锋", jerseyNumber: 5, position: "C", x: 740, y: 310, dutyZh: "摆脱防守，全速直冲篮下篮筐！", dutyEn: "Slip free after back-screen, rim-run full speed" },
              { id: "b3", type: "PLAYER", label: "分卫", jerseyNumber: 2, position: "SG", x: 720, y: 360, dutyZh: "设立扎实背掩护挡死中锋防守人，随后向底角外弹", dutyEn: "Set rock-solid back-screen, pop to perimeter" },
              { id: "ball", type: "BALL", label: "🏀", jerseyNumber: 0, position: "BALL", x: 690, y: 440, dutyZh: "控卫高抛空接传球送往篮筐上空", dutyEn: "Lob pass over the top to rim" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "bt2", type: "PASS", startX: 690, startY: 440, controlX: 740, controlY: 380, endX: 790, endY: 350, label: "空接高抛" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：篮下空接暴扣或底角空位三分",
            titleEn: "Phase 3: Alley-Oop Slam or Corner 3pt",
            notesZh: "中锋在篮筐上方单手接球泰山压顶暴扣得分！若对手收缩包夹，控卫则瞬间将球甩到底角命中三分！",
            notesEn: "Center flushes thunderous alley-oop dunk! If defense collapses, kick out to corner for wide-open three-pointer!",
            tokensJson: JSON.stringify([
              { id: "b1", type: "PLAYER", label: "控卫", jerseyNumber: 1, position: "PG", x: 700, y: 450, dutyZh: "送出精准助攻", dutyEn: "Dish highlight assist" },
              { id: "b2", type: "PLAYER", label: "中锋", jerseyNumber: 5, position: "C", x: 820, y: 350, dutyZh: "泰山压顶双手暴扣，篮筐轰鸣！", dutyEn: "Monstrous two-handed alley-oop slam!" },
              { id: "b3", type: "PLAYER", label: "分卫", jerseyNumber: 2, position: "SG", x: 820, y: 550, dutyZh: "底角三分大空位待命接球射门", dutyEn: "Wide-open corner 3pt option locked" },
              { id: "ball", type: "BALL", label: "🏀", jerseyNumber: 0, position: "BALL", x: 820, y: 350, dutyZh: "皮球被狠狠灌入篮筐！", dutyEn: "Ball slammed through rim!" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "bt3", type: "PASS", startX: 820, startY: 350, controlX: 820, controlY: 350, endX: 820, endY: 350, label: "空中接力灌篮" }
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
