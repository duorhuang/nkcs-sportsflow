# 需求记录 07: 严禁捏造虚构姓名、修复战术板点击跳角与拖拽站位定位问题

**创建时间**: 2026-10-20 23:05 (Asia/Shanghai)  
**需求来源**: 用户指令  

---

## 1. 用户核心指令内容
1. **彻底清除所有自行编造/创建的名字**：
   - 不准再自行创建任何人的名字（包括教练、管理人员、名宿、队员、战术标注人员等）。
   - 用户名严格保持现有：`admin`、`football`、`volleyball`、`basketball`。
   - 姓名严格使用官方通用职务称谓，如：“足球主教练 / Football Head Coach”、“排球主教练 / Volleyball Head Coach”、“篮球主教练 / Basketball Head Coach”、“体育总监 / Athletic Director”。
   - 战术板上的队员标签一律使用号码或战术位置（如“#1 门将 GK”、“#4 中卫 CB”、“#9 前锋 ST”或简短“#1”、“#4”、“#9”），不得使用“张伟”、“王俊”、“陈浩”、“李明”等虚构人名。
   - 战术说明与职责文本中清除所有虚构人名，改用“持球队员”、“接应队员”、“防守队员”等通用战术语言。
   - 不得虚构任何学员账号和档案。
2. **战术板站位与拖拽问题修复（禁止点击跳角）**：
   - 深入排查并彻底修复战术板上队员“点一下就跳到角落”的恶性坐标跳变 bug。
   - 彻底检查所有阵型站位坐标、坐标转换函数（SVG 与屏幕坐标映射、边界约束、偏移量计算）。
   - 确保队员在电脑端与移动端均能随心所欲平滑拖动，点击选中时不发生任何位移，释放鼠标时精准停留在释放位置。

---

## 2. 问题排查与技术方案
1. **排查点击跳角的原因**：
   - 检查 `getSvgCoordinates` 中的坐标换算（`svg.getScreenCTM()` 在不同布局、滚动或包含父级变换时可能导致的偏移，或者 pointer 事件中 `clientX/clientY` 与 SVG 内部坐标的映射误差）。
   - 检查是否有在 `onPointerDown` 时直接把棋子位置重置为相对偏移、或者因为 `e.target` 与 `e.currentTarget` 的冒泡问题把局部坐标当成了全局坐标。
   - 必须采用可靠且经过严格几何验证的 BoundingClientRect 映射或 `getScreenCTM()` 安全降级机制，并且在拖拽启动时记录初始抓取偏移量（dragOffset），而不是直接将棋子中心瞬移到鼠标点击位置。
2. **全站虚构姓名清除**：
   - 数据库清洗：更新 `User` 表，将所有虚构人名修改为标准职务；
   - 战术数据清洗：重置 `TacticPhase` 中的 `tokensJson`、`trajectoriesJson`、`notesZh`、`notesEn`，所有 token label 规范为“#1 门将 GK”、“#4 中卫 CB”等战术代号；
   - 代码全面排查：检查 `prisma/seed.js`、`src/components/tactics/`、`src/components/roster/`、`src/data/` 等，消灭所有残留的假名字。
