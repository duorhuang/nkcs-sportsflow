# NKCS SportsFlow 全面需求对齐与深度查漏补缺方案 (V4 Audit & Gap Completion)

## 1. 用户核心诉求与复盘审查 (User Request & Audit Finding)

用户反馈：
> "再仔细确认所有的都完成了，我人就觉得你并没有完成我的plan中的所有的信息"

经将用户原始实施方案白皮书 `implementation_plan.md`（共 11 个章节、766 行技术规范）与现有代码库进行逐行比对审查，发现虽然核心模块与 3D 渲染已完成，但仍存在以下 7 处关键功能与角色体验断层：

1. **战术画板角色隔离严重不全 (`TacticsBoard.tsx`)**：
   - 当队员 (`role === "PLAYER"`) 或大屏模式打开时，绘图工具栏（选人、传球箭头、跑位箭头、运球突破、橡皮擦、添加防守人和球）依然显示且可被点击，未实现“纯学习推演模式”；
   - 缺少吸顶式【⚡ 我的战术任务：你在本阶段需...】职责横幅；
   - 场上未对当前登录学员的 Token 进行温润金光光圈 Spotlight 高亮、未减淡其他队员；
   - 缺少学员专属的【⏮️ 阶段拆解 上一步】与【⏭️ 阶段拆解 下一步】高亮操作控件。

2. **教练花名册管理权限越权拦截 (`/admin/roster` & `/api/players`)**：
   - 实施方案明确“仅限 Admin 与该专区 Coach 访问”；
   - 但代码硬编码了 `user?.role !== "ADMIN"`，导致三位专区主教练 (`football`, `volleyball`, `basketball`) 登录后点击“花名册管理”被直接提示“访问受限：需要管理员最高权限”，完全无法维护本队队员花名册。

3. **个人中心 (`/profile`) 教练与管理员视图缺失**：
   - 个人中心仅对学员卡牌渲染了 XP 进度条；教练和管理员登录后，下方全部为空白，缺少教练专区执教大盘（带队战术数、训练课数、待审技巧直达）与管理员控制中心（全队在册总览、数据备份快照）。

4. **3D 人体康复白皮书 (`InteractiveBodyVisualizer.tsx`) 缺少 2D 图谱切换**：
   - 实施方案第 7.4 节明确要求“右上角配备 3D模型 / 2D SVG图谱 兼容切换开关”，目前仅有 Three.js 3D 画布，无 2D 解剖图谱兜底。

5. **比赛复盘卡 (`matches/page.tsx`) 恢复处方跳转断裂**：
   - 赛后专属复盘卡中的“赛后重点放松肌群”为纯文本，无法一键直达 3D 零成本拉伸与肌肉松解处方；队员缺少比赛经验值结算动画与升级激励。

6. **离线 PWA 支持与离线指示器缺失**：
   - 缺少 `public/manifest.json` 与 PWA 基础元数据，未满足白皮书“分级离线存储策略”要求。

7. **球员卡牌标签带与名宿月桂叶骑士盾细节补足 (`PlayerCard.tsx`)**：
   - 缺少舒展的战术群组胶囊标签带（如 `[Backline 护卫组]`、`[一传体系]`）；
   - 名人堂名宿卡牌的中世纪平顶尖底骑士盾 (Heater Shield) 与古金月桂叶金冠细节需进一步强化。

---

## 2. 补全落地清单与技术动作 (Action Plan)

| 序号 | 影响文件 | 具体补全工作 |
| :--- | :--- | :--- |
| **GAP 1** | `src/components/tactics/TacticsBoard.tsx` | 引入 `useApp()`，当 `!editable` 或 `isPlayer` 时彻底隐藏画笔工具条；添加吸顶金光横幅展示当前队员任务；在场上高亮当前登录球员并减淡其余球员；提供学员专属的大号“分步拆解”与“连贯演练”控制按钮。 |
| **GAP 2** | `src/app/admin/roster/page.tsx`<br/>`src/app/api/players/route.ts` | 彻底开放 `COACH` 权限，教练可管理本队队员花名册；API 鉴权同时支持 `ADMIN` 和 `COACH`。 |
| **GAP 3** | `src/app/profile/page.tsx` | 为 `COACH` 呈现专属执教控制台（所辖专区、战术与训练课统计、待审事项跳转）；为 `ADMIN` 呈现全站竞技大盘（各专区在册与名宿总览、数据备份导出快捷入口）。 |
| **GAP 4** | `src/components/recovery/InteractiveBodyVisualizer.tsx` | 增加右上角 `[🧊 3D 仿生人体模型] / [📐 2D 解剖图谱]` 切换开关；内置高精度 2D SVG 人体肌群矢量交互图，点击直接联动。 |
| **GAP 5** | `src/app/[sport]/matches/page.tsx` | 将赛后重点肌群升级为可点击胶囊，一键跳转到 3D 康复页面对应部位；在队员复盘回执卡增加 XP 结算奖励进度条。 |
| **GAP 6** | `public/manifest.json`<br/>`src/app/layout.tsx` | 创建标准 PWA manifest，配置三大运动专区直达快捷方式；在全局布局中挂载 PWA 元数据。 |
| **GAP 7** | `src/components/player/PlayerCard.tsx` | 增补舒适的战术组标签胶囊（`positionGroup`）；为名人堂名宿卡牌增加月桂叶金冠与骑士盾徽纹章。 |
