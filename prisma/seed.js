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

  console.log("✅ Seed completed successfully!");
  console.log("Default accounts:");
  console.log("  Admin: admin / admin123");
  console.log("  Football Coach: football / coach123");
  console.log("  Volleyball Coach: volleyball / coach123");
  console.log("  Basketball Coach: basketball / coach123");
  console.log("  Player: zhangwei / player123 (Multi-sport Captain)");
  console.log("  Legend: liming / player123 (Hall of Fame)");
  console.log("  Alumni: chenhao / player123 (Alumni Regular)");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
