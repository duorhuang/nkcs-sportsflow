# 球队战术与综合竞技管理平台 (NKCS SportsFlow)

> **Collegiate Athletic Heritage Tactics & Comprehensive Training Hub**  
> 专为金陵中学会（NKCS）U19精英梯队打造的传世经典战术白皮书、高精度训练日程、竞技损伤自愈与赛后全维度即时复盘系统。

---

## 🌐 域名与部署架构 (Domain & Subdomain)

- **主域名 (Apex Domain)**: `sportsflow.best`
- **业务专属子域名 (Target Subdomain)**: `nkcs-sports.sportsflow.best`
- **部署平台**: Cloudflare Pages / Workers
- **自动化 CI/CD**: `.github/workflows/deploy.yml` 自动构建部署

---

## 🔑 账户矩阵与权限分工 (Role & Credentials)

系统已根据产品规范配置三项运动独立教练专属单字账号及真实学员账号，无任何随机字符：

| 角色 / 身份 | 登录用户名 (Username) | 默认密码 | 说明 |
| :--- | :--- | :--- | :--- |
| **🛡️ 平台总管理员** | `admin` | `admin123` | 全局球员花名册管理、教练权限委派、队长标签分配 |
| **⚽ 足球队主教练** | `football` | `coach123` | 足球频道战术白皮书编排、高精度训练科目、复盘卡下发 |
| **🏐 排球队主教练** | `volleyball` | `coach123` | 排球 5-1 轮转战术推演、一攻梯次跑位演播、身体恢复指导 |
| **🏀 篮球队主教练** | `basketball` | `coach123` | 篮球牛角/西班牙挡拆战术、比赛中心比分录入、球员评价 |
| **🏃 现役队长 (足球/排球)** | `zhangwei` | `player123` | 队长 (C) 标签，多运动轮转，查看专属复盘卡并签署自勉行动项 |
| **🏆 校队传奇名宿** | `liming` | `player123` | 名宿殿堂 (Hall of Fame)，加冕金桂冠与金色盾徽，调入战术模拟 |
| **🎓 毕业校友** | `chenhao` | `player123` | 2024届校友 (Alumni Regular)，佩戴常春藤银质毕业年徽章 |

---

## 🏆 核心功能模块清单

### 1. 战术白皮书与阶段推演引擎 (`/[sport]/tactics`)
- **真实球场纹理与标准制式**：
  - ⚽ 足球：11人制标准天然草坪、双色深绿草皮横条纹、禁区弧、罚球点、球门区。
  - 🏐 排球：标准室内 18m x 9m 地板、3米进攻限制线 (Attack Line)、中央球网、1-6号位标准轮转坐标。
  - 🏀 篮球：典雅硬木地板纹理 (Hardwood)、三分线、罚球三秒区 (Key/Paint)、篮筐与篮板。
- **阶段平滑动画推演 (Phased Keyframing)**：
  - 支持 `阶段 1 (初始站位)` → `阶段 2 (传切跑位)` → `阶段 3 (终结攻门/扣杀)` 线性平滑插值演播。
  - 贝塞尔弧线实线传球 (PASS)、虚线跑位 (RUN)、折线突破 (DRIBBLE) 路径高精度渲染。
- **战术角色选择器 (Character Select Tray)**：
  - 灵感来自经典角色选择界面，抽屉式分类收录【现役主力】、【🏆 校队名宿】、【🎓 毕业校友】与【战术标记】。
  - 现役队员清晰标注 `号码`、`位置`、`队长 (C)` 标签；名宿与退役校友以独立金色与银色徽章区分展示，支持一键调入球场推演。
- **📺 更衣室大屏演播模式 (Locker Room Broadcast)**：
  - 全屏沉浸式暗色古典质感演播台，适配赛前更衣室智能大屏、iPad 与投影仪。
- **🖨️ A4 战术白皮书手册出版级导出**：
  - 一键调用标准打印排版，生成包含官方徽标、战术路线图、主教练指令及全员职责分工矩阵的纸质战术手册。

### 2. 高精度训练日程与高级科目卡片 (`/[sport]/schedule`)
- **分钟级专业训练时间轴** (热身 15min → 战术抢逼围 25min → 边路套边 30min)。
- **Premium Drill Card 结构化卡片**：标注场地规格、练习人数、组数间歇与**三大主教练执行要诀 (Coaching Cues)**。

### 3. 3D 竞技解剖康复与损伤自愈白皮书 (`/[sport]/recovery`)
- **3D 交互式解剖定位仪**：支持人体前侧 (Front) 与后侧 (Back) 视角切换，精准定位 11 大核心肌群与关节。
- **分级运动医学处置规范**：
  - 覆盖【DOMS 延迟性酸痛】、【急性扭伤/拉伤】与【慢性劳损】三大场景。
  - 严格遵循现代医学最新 **PEACE & LOVE / POLICE** 原则，彻底摒弃传统过时静态制动。
  - 提供**宿舍零成本极简替代手法**（冷冻水瓶足底肌膜滚压、网球激痛点自重下压、毛巾牵引等长抗阻收缩）。
  - **返场安全红绿灯测试 (Return-to-Play Readiness)**：3 项功能性达标测试确保安全返场。
- **校队师生共建经验库 (UGC)**：学员贡献宿舍妙招，主教练与队医安全核验后公开展示。

### 4. 比赛中心与赛后全场景全维度即时复盘 (`/[sport]/matches`)
- **赛程预告与极简比分战报**：清晰追踪主客场战绩与比分。
- **1对1 专属复盘卡 (Private Debriefing Cards)**：
  - 主教练下发 1-10 分实战评分、单场 MVP / 最佳防守荣誉勋章、个性化私密寄语。
  - **疲劳恢复处方**：根据本场跑动智能圈定赛后重点放松肌群。
  - **双向领悟回执**：运动员签署回执并写下一句话自勉行动项，形成闭环。

### 5. 球员名册与球员卡 (`/[sport]/squad` & `/admin/roster`)
- **现役战将卡**：EA FC26 风格经验值进阶与卡牌评级。
- **🏆 名宿殿堂卡 (Hall of Fame)**：古典金叶麦穗盾徽、历史丰碑功绩。
- **🎓 往届校友卡 (Alumni)**：毕业年份印章、常春藤经典银质画框。
- **管理员花名册后台**：严格要求手动录入专属登录学号/用户名，禁止任意随机字符生成。

---

## 🛠️ 本地开发与运行 (Development)

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma 客户端并载入数据库种子
npx prisma generate
node prisma/seed.js

# 3. 运行本地开发服务器
npm run dev
# 或构建生产版本
npm run build && npm start
```

访问 `http://localhost:3000` 即可开始使用。

---

## 🚀 部署至 GitHub 与 Cloudflare

1. **推送到 GitHub 仓库**:
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

2. **绑定 Cloudflare Pages 与自定义域名**:
- 登录 Cloudflare Dashboard -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
- 选择本项目仓库，Framework Preset 选择 **Next.js**。
- 环境变量配置：
  - `DATABASE_URL`: `file:./dev.db` (或连接远程 PostgreSQL / Turso / D1)
  - `JWT_SECRET`: 自定义高强度秘钥
  - `NEXT_PUBLIC_APP_URL`: `https://nkcs-sports.sportsflow.best`
- 在 Pages 项目设置中添加 Custom Domain：`nkcs-sports.sportsflow.best`，Cloudflare 将自动配置 SSL 证书并在 `sportsflow.best` 主域名下完成 DNS CNAME 解析。
