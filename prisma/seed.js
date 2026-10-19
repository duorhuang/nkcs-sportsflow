const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Password hashes
  const adminPass = await bcrypt.hash("admin123", 10);
  const coachPass = await bcrypt.hash("coach123", 10);
  const playerPass = await bcrypt.hash("player123", 10);

  // 2. Clear old data cleanly
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

  // 3. Create Admin
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminPass,
      role: "ADMIN",
      nameEn: "Director Alexander Vance",
      nameZh: "亚历山大·凡斯 总监",
    },
  });

  // 4. Create Coaches
  const coachFootball = await prisma.user.create({
    data: {
      username: "football",
      passwordHash: coachPass,
      role: "COACH",
      nameEn: "Coach Marcus Evans",
      nameZh: "马库斯·埃文斯 教练",
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
      nameEn: "Coach Kenji Takahashi",
      nameZh: "高桥健司 教练",
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
      nameEn: "Coach David Sterling",
      nameZh: "大卫·斯特林 教练",
      coachAssignments: {
        create: [{ sport: "BASKETBALL" }],
      },
    },
  });

  // 5. Create Multi-sport Athlete (Zhang Wei - Football & Volleyball)
  const zhangWei = await prisma.user.create({
    data: {
      username: "zhangwei",
      passwordHash: playerPass,
      role: "PLAYER",
      nameEn: "Zhang Wei",
      nameZh: "张伟",
      playerProfiles: {
        create: [
          {
            sport: "FOOTBALL",
            jerseyNumber: 4,
            primaryPosition: "CB",
            secondaryPositions: JSON.stringify(["CDM", "RB"]),
            positionGroup: "Backline (护卫组)",
            honors: "2024 Cup MVP",
            isCaptain: true,
            isViceCaptain: false,
            isRetired: false,
            xpPoints: 340,
            cardTier: "SILVER",
          },
          {
            sport: "VOLLEYBALL",
            jerseyNumber: 7,
            primaryPosition: "OH",
            secondaryPositions: JSON.stringify(["OPP"]),
            positionGroup: "Attackers (主攻组)",
            honors: "Best Spiker",
            isCaptain: false,
            isViceCaptain: true,
            isRetired: false,
            xpPoints: 180,
            cardTier: "BRONZE",
          },
        ],
      },
    },
  });

  // 6. Create Football Hall of Fame Legend (Li Ming - Retired 2023)
  const liMing = await prisma.user.create({
    data: {
      username: "liming",
      passwordHash: playerPass,
      role: "PLAYER",
      nameEn: "Li Ming",
      nameZh: "李明",
      playerProfiles: {
        create: [
          {
            sport: "FOOTBALL",
            jerseyNumber: 10,
            primaryPosition: "ST",
            secondaryPositions: JSON.stringify(["CAM"]),
            positionGroup: "Strikers (终结组)",
            honors: "All-Time Top Scorer · 2023 Champion Captain",
            isCaptain: true,
            isRetired: true,
            alumniTier: "HALL_OF_FAME",
            graduationYear: 2023,
            xpPoints: 1200,
            cardTier: "ICON",
          },
        ],
      },
    },
  });

  // 7. Create Football Regular Alumni (Chen Hao - Retired 2024)
  const chenHao = await prisma.user.create({
    data: {
      username: "chenhao",
      passwordHash: playerPass,
      role: "PLAYER",
      nameEn: "Chen Hao",
      nameZh: "陈浩",
      playerProfiles: {
        create: [
          {
            sport: "FOOTBALL",
            jerseyNumber: 6,
            primaryPosition: "CDM",
            secondaryPositions: JSON.stringify(["CM"]),
            positionGroup: "Midfield (中场组)",
            honors: "Tough Tackler",
            isRetired: true,
            alumniTier: "ALUMNI_REGULAR",
            graduationYear: 2024,
            xpPoints: 650,
            cardTier: "GOLD",
          },
        ],
      },
    },
  });

  // 8. Other active football athletes
  await prisma.user.create({
    data: {
      username: "wangjun",
      passwordHash: playerPass,
      role: "PLAYER",
      nameEn: "Wang Jun",
      nameZh: "王俊",
      playerProfiles: {
        create: [
          {
            sport: "FOOTBALL",
            jerseyNumber: 1,
            primaryPosition: "GK",
            positionGroup: "Goalkeepers (门将组)",
            honors: "Golden Glove",
            isViceCaptain: true,
            isRetired: false,
            xpPoints: 290,
            cardTier: "SILVER",
          },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      username: "liufeng",
      passwordHash: playerPass,
      role: "PLAYER",
      nameEn: "Liu Feng",
      nameZh: "刘峰",
      playerProfiles: {
        create: [
          {
            sport: "FOOTBALL",
            jerseyNumber: 9,
            primaryPosition: "ST",
            positionGroup: "Strikers (终结组)",
            honors: "Most Improved",
            isRetired: false,
            xpPoints: 120,
            cardTier: "BRONZE",
          },
        ],
      },
    },
  });

  // 9. Active Volleyball athletes
  await prisma.user.create({
    data: {
      username: "sunkai",
      passwordHash: playerPass,
      role: "PLAYER",
      nameEn: "Sun Kai",
      nameZh: "孙凯",
      playerProfiles: {
        create: [
          {
            sport: "VOLLEYBALL",
            jerseyNumber: 1,
            primaryPosition: "SETTER",
            positionGroup: "Setters (组织组)",
            honors: "Master Distributor",
            isCaptain: true,
            isRetired: false,
            xpPoints: 410,
            cardTier: "SILVER",
          },
        ],
      },
    },
  });

  // 10. Active Basketball athletes
  await prisma.user.create({
    data: {
      username: "yangfan",
      passwordHash: playerPass,
      role: "PLAYER",
      nameEn: "Yang Fan",
      nameZh: "杨帆",
      playerProfiles: {
        create: [
          {
            sport: "BASKETBALL",
            jerseyNumber: 23,
            primaryPosition: "PG",
            positionGroup: "Guards (后卫组)",
            honors: "Finals MVP",
            isCaptain: true,
            isRetired: false,
            xpPoints: 520,
            cardTier: "GOLD",
          },
        ],
      },
    },
  });

  // 11. Initial Precision Training Plan with Drill Cards for Football
  const today = new Date();
  const footballPlan = await prisma.trainingPlan.create({
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
        "重点演练丢球后5秒就地压迫、弱侧迅速拉开传中、以及禁区内双鬼拍门包抄。",
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
            pitchSpecs: "25m x 20m 狭窄场地",
            playerCount: "4红 vs 4蓝 + 3黄（自由人）",
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

  // 12. Seed Masterclass Tactics for Football, Volleyball, and Basketball
  // Football Tactic: 4-3-3 High Counter-Press & Half-Space Overload
  await prisma.tactic.create({
    data: {
      sport: "FOOTBALL",
      titleZh: "4-3-3 肋部渗透与边后卫套边 (Half-Space Overload)",
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
            notesZh: "门将与双中卫在后场形成稳固出球倒脚三角，边后卫拉开宽度，中前卫陈浩回撤接应。",
            notesEn: "Goalkeeper and two center-backs form a stable build-up triangle. Fullbacks provide width while CDM drops to link play.",
            tokensJson: JSON.stringify([
              { id: "p1", type: "PLAYER", label: "王俊", jerseyNumber: 1, position: "GK", isCaptain: false, isRetired: false, alumniTier: null, x: 100, y: 350, dutyZh: "后场开球指挥，控制禁区出球角度", dutyEn: "Distribute calmly and organize defensive line" },
              { id: "p2", type: "PLAYER", label: "张伟 (C)", jerseyNumber: 10, position: "CB", isCaptain: true, isRetired: false, alumniTier: null, x: 260, y: 240, dutyZh: "持球推进，观察对手左中卫压迫间隙", dutyEn: "Step out with ball, assess half-space passing lane" },
              { id: "p3", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "CB", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 260, y: 460, dutyZh: "拖后协防保护，随时防备对手快速反击", dutyEn: "Cover depth and provide sweeper security" },
              { id: "p4", type: "PLAYER", label: "陈浩 [校友]", jerseyNumber: 6, position: "CDM", isCaptain: false, isRetired: true, alumniTier: "ALUMNI_REGULAR", x: 420, y: 350, dutyZh: "回撤形成出球支点，接球后快速转移弱侧", dutyEn: "Pivot presence, receive under pressure and switch" },
              { id: "p5", type: "PLAYER", label: "刘峰", jerseyNumber: 9, position: "ST", isCaptain: false, isRetired: false, alumniTier: null, x: 740, y: 350, dutyZh: "压制对手双中卫，准备随时前插反越位", dutyEn: "Pin opposition center-backs on offside line" },
              { id: "ball", type: "BALL", label: "Soccer Ball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 275, y: 250, dutyZh: "皮球位于张伟脚下", dutyEn: "Possession with Zhang Wei" },
              { id: "opp1", type: "OPPONENT", label: "X1", jerseyNumber: 0, position: "FW", isCaptain: false, isRetired: false, alumniTier: null, x: 380, y: 280, dutyZh: "对手前锋上前逼抢张伟", dutyEn: "Pressing front-man" },
              { id: "opp2", type: "OPPONENT", label: "X2", jerseyNumber: 0, position: "DF", isCaptain: false, isRetired: false, alumniTier: null, x: 760, y: 330, dutyZh: "对手盯防中卫", dutyEn: "Marking striker" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "PASS", startX: 280, startY: 250, controlX: 350, controlY: 300, endX: 410, endY: 340, label: "精准斜传" },
              { id: "t2", type: "RUN", startX: 420, startY: 350, controlX: 460, controlY: 320, endX: 520, endY: 260, label: "接应转身" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：肋部穿透与边卫套边",
            titleEn: "Phase 2: Half-Space Through-Ball & Overlap",
            notesZh: "中场陈浩直塞送达肋部空当，边锋内切吸引防守，边后卫从外侧以最高速度套边插上。",
            notesEn: "CDM delivers an incision pass into the half-space pocket. Winger cuts inside, creating wide corridor for fullback sprint.",
            tokensJson: JSON.stringify([
              { id: "p1", type: "PLAYER", label: "王俊", jerseyNumber: 1, position: "GK", isCaptain: false, isRetired: false, alumniTier: null, x: 120, y: 350, dutyZh: "门线前压，保持防线联系", dutyEn: "High starting position" },
              { id: "p2", type: "PLAYER", label: "张伟 (C)", jerseyNumber: 10, position: "CB", isCaptain: true, isRetired: false, alumniTier: null, x: 450, y: 220, dutyZh: "前移至中线压迫，封锁防守反击路线", dutyEn: "Step up to halfway line" },
              { id: "p3", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "CB", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 380, y: 440, dutyZh: "在中后场保持纵深警戒", dutyEn: "Deep cover vigilance" },
              { id: "p4", type: "PLAYER", label: "陈浩 [校友]", jerseyNumber: 6, position: "CDM", isCaptain: false, isRetired: true, alumniTier: "ALUMNI_REGULAR", x: 550, y: 310, dutyZh: "送出精妙手术刀直塞球", dutyEn: "Weight incision pass to wing" },
              { id: "p5", type: "PLAYER", label: "刘峰", jerseyNumber: 9, position: "ST", isCaptain: false, isRetired: false, alumniTier: null, x: 790, y: 300, dutyZh: "斜插前点带走后卫，为后排拉扯空间", dutyEn: "Near-post diagonal drag run" },
              { id: "ball", type: "BALL", label: "Soccer Ball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 810, y: 160, dutyZh: "皮球传至边路底线深处", dutyEn: "Ball delivered into deep flank" },
              { id: "opp1", type: "OPPONENT", label: "X1", jerseyNumber: 0, position: "FW", isCaptain: false, isRetired: false, alumniTier: null, x: 480, y: 300, dutyZh: "被晃过失位", dutyEn: "Bypassed press" },
              { id: "opp2", type: "OPPONENT", label: "X2", jerseyNumber: 0, position: "DF", isCaptain: false, isRetired: false, alumniTier: null, x: 770, y: 280, dutyZh: "被前锋带离中路", dutyEn: "Dragged out by striker" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "PASS", startX: 550, startY: 310, controlX: 680, controlY: 220, endX: 800, endY: 165, label: "手术刀直塞" },
              { id: "t2", type: "RUN", startX: 650, startY: 120, controlX: 740, controlY: 130, endX: 830, endY: 160, label: "高速套边突破" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：倒三角传中与后插上终结",
            titleEn: "Phase 3: Cutback Delivery & Box Finish",
            notesZh: "边路下底后扣球倒三角回传，前点中锋吸引两名后卫，后插上的队长张伟在大禁区弧顶迎球劲射破门！",
            notesEn: "Fullback reaches byline and delivers low cutback pass. Striker near-post dummy creates space for Captain Zhang Wei to smash home from edge of box!",
            tokensJson: JSON.stringify([
              { id: "p1", type: "PLAYER", label: "王俊", jerseyNumber: 1, position: "GK", isCaptain: false, isRetired: false, alumniTier: null, x: 150, y: 350, dutyZh: "大声呼喊提醒阵型平衡", dutyEn: "Vocal leadership from back" },
              { id: "p2", type: "PLAYER", label: "张伟 (C)", jerseyNumber: 10, position: "CB", isCaptain: true, isRetired: false, alumniTier: null, x: 720, y: 340, dutyZh: "高速后插上包抄，迎球重炮轰门！", dutyEn: "Late run onto cutback, power strike on target!" },
              { id: "p3", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "CB", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 420, y: 370, dutyZh: "坐镇中后场指挥整体退防防线", dutyEn: "Hold defensive line shape" },
              { id: "p4", type: "PLAYER", label: "陈浩 [校友]", jerseyNumber: 6, position: "CDM", isCaptain: false, isRetired: true, alumniTier: "ALUMNI_REGULAR", x: 620, y: 280, dutyZh: "保护二点球，防止解围反击", dutyEn: "Second ball protection" },
              { id: "p5", type: "PLAYER", label: "刘峰", jerseyNumber: 9, position: "ST", isCaptain: false, isRetired: false, alumniTier: null, x: 860, y: 310, dutyZh: "前点强力吸引防守并虚晃漏球", dutyEn: "Near post dummy to clear lane" },
              { id: "ball", type: "BALL", label: "Soccer Ball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 735, y: 340, dutyZh: "皮球入网球门死角", dutyEn: "Ball flies into top corner!" },
              { id: "opp1", type: "OPPONENT", label: "X1", jerseyNumber: 0, position: "FW", isCaptain: false, isRetired: false, alumniTier: null, x: 550, y: 330, dutyZh: "无力回防", dutyEn: "Stranded opponent" },
              { id: "opp2", type: "OPPONENT", label: "X2", jerseyNumber: 0, position: "DF", isCaptain: false, isRetired: false, alumniTier: null, x: 880, y: 290, dutyZh: "被前点晃倒", dutyEn: "Beaten defender" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "PASS", startX: 840, startY: 170, controlX: 790, controlY: 260, endX: 730, endY: 330, label: "精准倒三角" },
              { id: "t2", type: "RUN", startX: 730, startY: 330, controlX: 830, controlY: 345, endX: 920, endY: 350, label: "重炮直挂死角" }
            ])
          }
        ]
      }
    }
  });

  // Volleyball Tactic: 5-1 Rotation 1 Pipe & Slide Attack
  await prisma.tactic.create({
    data: {
      sport: "VOLLEYBALL",
      titleZh: "5-1 轮转一号位快攻与后排梯次进攻 (Pipe & Slide Attack)",
      titleEn: "5-1 System: Rotation 1 Slide Decoy & Back-Row Pipe Spike",
      scenario: "一攻体系 / 战术掩护",
      courtFormat: "6人制室内排球场",
      tags: JSON.stringify(["5-1轮转", "一号位", "背飞", "后排Pipe进攻"]),
      descriptionZh:
        "在5-1阵型一号位轮转中，二传孙凯插上分配球，副攻手向2号位做高速背飞佯攻，吸引对手双人拦网，后排主攻手在6号位3米线后跃起实施Pipe强攻重扣！",
      descriptionEn:
        "In Rotation 1, setter Sun Kai penetrates to deliver the ball. Middle blocker executes an aggressive slide approach to zone 2 dragging two blockers, opening the pipe lane for a thundering back-row spike from zone 6.",
      isFeatured: true,
      creatorId: coachVolleyball.id,
      phases: {
        create: [
          {
            phaseIndex: 1,
            titleZh: "阶段一：W型稳定接发球与二传插上",
            titleEn: "Phase 1: W-Formation Receive & Setter Penetration",
            notesZh: "接应队员后撤保护，自由人与主攻手组成坚固接发球弧线，二传孙凯从一号位启动插上网前。",
            notesEn: "Libero and outside hitters stabilize serve reception in W formation. Setter Sun Kai starts penetration sprint from zone 1.",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "孙凯 (C)", jerseyNumber: 1, position: "SETTER", isCaptain: true, isRetired: false, alumniTier: null, x: 280, y: 480, dutyZh: "一号位准备插上网前2-3号位之间分配一传", dutyEn: "Penetrate from zone 1 to target setting zone" },
              { id: "v2", type: "PLAYER", label: "张伟", jerseyNumber: 10, position: "OH", isCaptain: false, isRetired: false, alumniTier: null, x: 260, y: 220, dutyZh: "主攻手后撤准备接一传并观察防守空当", dutyEn: "Outside hitter pass platform and ready for pipe" },
              { id: "v3", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "MB", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 400, y: 350, dutyZh: "副攻手网前待命，观察对方发球落点", dutyEn: "Middle blocker alert at net, tracking ball trajectory" },
              { id: "ball", type: "BALL", label: "Volleyball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 180, y: 260, dutyZh: "发球飞向张伟身前一传控制区", dutyEn: "Incoming serve targeted at pass zone" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "RUN", startX: 280, startY: 480, controlX: 380, controlY: 420, endX: 470, endY: 340, label: "二传插上网前" },
              { id: "t2", type: "PASS", startX: 180, startY: 260, controlX: 320, controlY: 290, endX: 470, endY: 330, label: "完美一传起球" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：副攻背飞佯攻与拦网牵制",
            titleEn: "Phase 2: Middle Slide Decoy & Block Commitment",
            notesZh: "二传孙凯起跳单手假传真吊，副攻李明向右侧2号位大范围跑动背飞，强力牵制对方主拦网手。",
            notesEn: "Setter Sun Kai squares up at net. Middle blocker Li Ming runs a high-speed slide route behind setter to zone 2, drawing both blockers.",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "孙凯 (C)", jerseyNumber: 1, position: "SETTER", isCaptain: true, isRetired: false, alumniTier: null, x: 480, y: 330, dutyZh: "起跳滞空背传或跳传后排", dutyEn: "Jump set, disguise trajectory to back row" },
              { id: "v2", type: "PLAYER", label: "张伟", jerseyNumber: 10, position: "OH", isCaptain: false, isRetired: false, alumniTier: null, x: 340, y: 320, dutyZh: "从6号位后排开始发力助跑，3米线外踏跳", dutyEn: "Accelerate approach from zone 6 behind 3m line" },
              { id: "v3", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "MB", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 480, y: 180, dutyZh: "2号位背飞起跳佯攻，怒吼带走双人拦网", dutyEn: "Fast slide takeoff in zone 2 drawing double block" },
              { id: "ball", type: "BALL", label: "Volleyball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 480, y: 320, dutyZh: "球在二传手中正送往后排", dutyEn: "Set executed toward 3m line" },
              { id: "opp1", type: "OPPONENT", label: "拦网X1", jerseyNumber: 0, position: "MB", isCaptain: false, isRetired: false, alumniTier: null, x: 530, y: 220, dutyZh: "被背飞佯攻吸引起跳", dutyEn: "Committed to slide block" },
              { id: "opp2", type: "OPPONENT", label: "拦网X2", jerseyNumber: 0, position: "OH", isCaptain: false, isRetired: false, alumniTier: null, x: 530, y: 270, dutyZh: "跟随副攻往2号位移动", dutyEn: "Shifting right with slide" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "RUN", startX: 400, startY: 350, controlX: 440, controlY: 240, endX: 480, endY: 180, label: "高速背飞助跑" },
              { id: "t2", type: "PASS", startX: 480, startY: 320, controlX: 440, controlY: 335, endX: 410, endY: 340, label: "平快后排立球" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：后排立体强攻与超手重扣",
            titleEn: "Phase 3: Back-Row Pipe Thunder Spike",
            notesZh: "主攻手张伟在6号位3米线后雷霆拔地而起，利用拦网移位造成的巨大中路真空，以105km/h时速重扣得分！",
            notesEn: "Outside hitter Zhang Wei elevates behind 3m attack line, unleashing a devastating 105km/h pipe spike into the vacated court seam!",
            tokensJson: JSON.stringify([
              { id: "v1", type: "PLAYER", label: "孙凯 (C)", jerseyNumber: 1, position: "SETTER", isCaptain: true, isRetired: false, alumniTier: null, x: 470, y: 340, dutyZh: "落地保护网前二点", dutyEn: "Cover tip and deflection" },
              { id: "v2", type: "PLAYER", label: "张伟", jerseyNumber: 10, position: "OH", isCaptain: false, isRetired: false, alumniTier: null, x: 420, y: 340, dutyZh: "超高击球点重扣砸向对手深区中路！", dutyEn: "Apex contact spike deep into court split!" },
              { id: "v3", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "MB", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 480, y: 170, dutyZh: "完成佯攻掩护任务", dutyEn: "Decoy execution complete" },
              { id: "ball", type: "BALL", label: "Volleyball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 780, y: 350, dutyZh: "皮球砸在对手界内地板上直接得分！", dutyEn: "Direct kill point on hardwood!" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "RUN", startX: 420, startY: 340, controlX: 600, controlY: 345, endX: 780, endY: 350, label: "105km/h 暴扣落地" }
            ])
          }
        ]
      }
    }
  });

  // Basketball Tactic: Horns Flare & Spanish Pick-and-Roll
  await prisma.tactic.create({
    data: {
      sport: "BASKETBALL",
      titleZh: "牛角高位战术与西班牙二次掩护 (Horns Spanish PnR)",
      titleEn: "Horns Alignment & Spanish Double Back-Screen Pick-and-Roll",
      scenario: "阵地半场 / 关键球战术",
      courtFormat: "5v5全场硬木地板",
      tags: JSON.stringify(["牛角Horns", "西班牙挡拆", "空接暴扣", "外线三分"]),
      descriptionZh:
        "高位牛角站位，杨帆控球呼叫中锋挡拆顺下，同时弱侧射手迅速上提给中锋防守人做背掩护，撕裂对手内线防守，既可空接终结，亦可分球底角大空位三分！",
      descriptionEn:
        "From high horns set, PG Yang Fan initiates PnR with center rolling hard. Crucially, the shooting guard sets a blind back-screen on the center's defender (Spanish action), creating an uncontested alley-oop or corner 3.",
      isFeatured: true,
      creatorId: coachBasketball.id,
      phases: {
        create: [
          {
            phaseIndex: 1,
            titleZh: "阶段一：高位牛角站位与拉开空间",
            titleEn: "Phase 1: High Horns Alignment & Spacing",
            notesZh: "控卫杨帆运球过半场至弧顶，4号位与5号位双内线分别站在罚球线两端肘区(Elbows)，双侧底角彻底拉开。",
            notesEn: "PG Yang Fan controls tempo at top of key. 4 & 5 position at high elbows, wing shooters clear to corners.",
            tokensJson: JSON.stringify([
              { id: "b1", type: "PLAYER", label: "杨帆 (C)", jerseyNumber: 23, position: "PG", isCaptain: true, isRetired: false, alumniTier: null, x: 500, y: 550, dutyZh: "弧顶稳妥控球，手势示意牛角西班牙战术启动", dutyEn: "Top of key command, signal Horns Spanish" },
              { id: "b2", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "C", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 420, y: 420, dutyZh: "左肘区站位，准备上前做扎实高质量挡拆", dutyEn: "Left elbow stance, ready to set solid on-ball screen" },
              { id: "b3", type: "PLAYER", label: "张伟", jerseyNumber: 10, position: "SG", isCaptain: false, isRetired: false, alumniTier: null, x: 580, y: 420, dutyZh: "右肘区站位，准备空切实施背掩护", dutyEn: "Right elbow stance, preparing blind back-screen" },
              { id: "ball", type: "BALL", label: "Basketball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 510, y: 545, dutyZh: "杨帆双手护球", dutyEn: "Possession with PG Yang Fan" },
              { id: "opp1", type: "OPPONENT", label: "对位D1", jerseyNumber: 0, position: "PG", isCaptain: false, isRetired: false, alumniTier: null, x: 500, y: 490, dutyZh: "贴身防守杨帆", dutyEn: "Guarding ball handler" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "RUN", startX: 420, startY: 420, controlX: 450, controlY: 470, endX: 490, endY: 500, label: "提上挡拆" }
            ])
          },
          {
            phaseIndex: 2,
            titleZh: "阶段二：中锋顺下与西班牙盲区背掩护",
            titleEn: "Phase 2: Center Roll & Spanish Blind Back-Screen",
            notesZh: "5号位名宿李明结实挡住防守人，杨帆向右侧运球突破；与此同时，射手张伟闪电切入给李明的防守人设立背掩护！",
            notesEn: "C Li Ming sets solid pick, Yang Fan attacks right. SG Zhang Wei sprints behind to set a devastating back-screen on Li Ming's recovery defender.",
            tokensJson: JSON.stringify([
              { id: "b1", type: "PLAYER", label: "杨帆 (C)", jerseyNumber: 23, position: "PG", isCaptain: true, isRetired: false, alumniTier: null, x: 620, y: 430, dutyZh: "吸引防守注意力，假投真传高抛球", dutyEn: "Drive right to draw defense, prepare lob" },
              { id: "b2", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "C", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 480, y: 310, dutyZh: "摆脱防守，全速直冲篮下篮筐！", dutyEn: "Slip free after back-screen, rim-run full speed" },
              { id: "b3", type: "PLAYER", label: "张伟", jerseyNumber: 10, position: "SG", isCaptain: false, isRetired: false, alumniTier: null, x: 470, y: 360, dutyZh: "设立扎实背掩护挡死中锋防守人，随后向底角外弹", dutyEn: "Set rock-solid back-screen, pop to perimeter" },
              { id: "ball", type: "BALL", label: "Basketball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 630, y: 425, dutyZh: "杨帆双手高抛空接传球", dutyEn: "Yang Fan releases lofted alley-oop pass" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "RUN", startX: 480, startY: 360, controlX: 480, controlY: 280, endX: 490, endY: 210, label: "直插篮下" },
              { id: "t2", type: "PASS", startX: 630, startY: 425, controlX: 570, controlY: 300, endX: 495, endY: 215, label: "精准空接吊球" },
              { id: "t3", type: "RUN", startX: 470, startY: 360, controlX: 600, controlY: 380, endX: 780, endY: 420, label: "外弹底角三分线" }
            ])
          },
          {
            phaseIndex: 3,
            titleZh: "阶段三：篮下空接暴扣或底角空位三分",
            titleEn: "Phase 3: Thunder Alley-Oop or Flare Corner 3",
            notesZh: "名宿李明在篮筐上方单手接球泰山压顶暴扣得分！若对手收缩包夹，杨帆则瞬间将球甩到底角大空位的张伟命中绝杀三分！",
            notesEn: "Hall of Famer Li Ming slams down the high lob with authority! If weak-side defender helps, kick out to Zhang Wei for a wide-open corner three!",
            tokensJson: JSON.stringify([
              { id: "b1", type: "PLAYER", label: "杨帆 (C)", jerseyNumber: 23, position: "PG", isCaptain: true, isRetired: false, alumniTier: null, x: 610, y: 410, dutyZh: "送出精彩助攻，回防呼喊庆祝", dutyEn: "Masterful assist delivered" },
              { id: "b2", type: "PLAYER", label: "李明 [名宿]", jerseyNumber: 4, position: "C", isCaptain: false, isRetired: true, alumniTier: "HALL_OF_FAME", x: 500, y: 200, dutyZh: "泰山压顶双手暴扣，篮筐轰鸣！", dutyEn: "Monstrous two-handed alley-oop slam!" },
              { id: "b3", type: "PLAYER", label: "张伟", jerseyNumber: 10, position: "SG", isCaptain: false, isRetired: false, alumniTier: null, x: 810, y: 430, dutyZh: "底角三分大空位待命接球射门", dutyEn: "Wide-open corner 3pt option locked" },
              { id: "ball", type: "BALL", label: "Basketball", jerseyNumber: 0, position: "BALL", isCaptain: false, isRetired: false, alumniTier: null, x: 500, y: 205, dutyZh: "皮球砸穿篮网", dutyEn: "Ball ripped through rim!" }
            ]),
            trajectoriesJson: JSON.stringify([
              { id: "t1", type: "RUN", startX: 500, startY: 205, controlX: 500, controlY: 220, endX: 500, endY: 240, label: "暴扣挂框落地" }
            ])
          }
        ]
      }
    }
  });

  // 13. Initial Training Plans for Volleyball and Basketball
  await prisma.trainingPlan.create({
    data: {
      sport: "VOLLEYBALL",
      trainingDate: today,
      startTime: "16:00",
      endTime: "18:00",
      location: "室内排球馆 1号场地 (Indoor Volleyball Court 1)",
      titleEn: "5-1 Transition Offense & Setting Connections",
      titleZh: "5-1 进攻体系网前快变配合与防反起球",
      contentEn:
        "Focus on setter penetration speed, quick slide coordination in zone 2, and back-row pipe spike timing.",
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
            coachingCuesEn: "1. Solid contact on pick; 2. Back-screener pops to corner; 3. Ball handler reads drop coverage.",
            coachingCuesZh: "1. 挡拆人双脚站定形成坚固掩护面；2. 背掩护完成后射手光速外弹底角三分线；3. 控卫读懂对手沉退深度送空接传球。",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // 14. Seed Matches for Football, Volleyball, and Basketball
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

  // 15. Seed 1-on-1 Debrief Cards
  await prisma.debrief.create({
    data: {
      sport: "FOOTBALL",
      targetType: "INDIVIDUAL",
      summaryZh: "全队高位逼抢执行坚决，后防线造越位纪律严密，攻防转换打出了训练中套边下底的全部预设战术！",
      summaryEn: "Exceptional collective press and backline offside discipline.",
      recommendedBodyParts: JSON.stringify(["hamstrings", "calves"]),
      coachId: coachFootball.id,
      recipients: {
        create: [
          {
            userId: zhangWei.id,
            rating: 10,
            honors: "🏆 全场最佳球员 (MATCH MVP)",
            quickTags: "后插上轰门, 拦截干净果决, 队长统率力强",
            privateNoteZh:
              "张伟：作为队长今天完全统治了后防线！下半场那脚后插上劲射死角极其提振士气！今晚回到宿舍记得用冷冻水瓶深度滚压小腿和足底，早点休息保证充沛体力！",
            privateNoteEn:
              "Zhang Wei: Outstanding captaincy and defensive leadership! Late finish sealed the victory. Remember to roll calves and get adequate sleep tonight.",
            isRead: true,
            acknowledgedAt: new Date(),
            actionItemNote: "收到教练！今晚已完成15分钟小腿与腘绳肌放松，下场继续加强左脚出球精度！",
          },
        ],
      },
    },
  });

  await prisma.debrief.create({
    data: {
      sport: "VOLLEYBALL",
      targetType: "INDIVIDUAL",
      summaryZh: "一传起球率高达 82%，二传在网前调度极具隐蔽性，副攻背飞多次拉开对手双人拦网！",
      summaryEn: "82% passing efficiency, deceptive setting at net opened slide attack lanes.",
      recommendedBodyParts: JSON.stringify(["shoulders", "calves", "knees"]),
      coachId: coachVolleyball.id,
      recipients: {
        create: [
          {
            userId: zhangWei.id,
            rating: 9,
            honors: "⭐ 关键扣杀之星 (CLUTCH SPIKER)",
            quickTags: "后排Pipe重扣, 拦网起跳时机精准",
            privateNoteZh:
              "张伟：今天在6号位的后排起跳雷霆扣杀直接击垮了对方心理防线！注意落地时双膝弯曲缓冲，赛后做肩袖十字拉伸与靠墙静蹲。",
            privateNoteEn:
              "Zhang Wei: Your pipe attack in zone 6 dismantled their defense! Keep up the knee cushion on landings.",
            isRead: false,
          },
        ],
      },
    },
  });

  // 16. Seed Recovery Guides
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

  console.log("✅ Seed completed successfully with tactics, training plans, matches, debriefs, and recovery guides!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
