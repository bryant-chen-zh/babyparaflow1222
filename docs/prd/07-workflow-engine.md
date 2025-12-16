# 工作流引擎 (Workflow Engine)

## 功能概述

工作流引擎是 Visual Coding Agent 的"导演"，采用 **Define = Plan** 的设计理念，通过握手澄清、MVP 快速验证、结构化迭代的方式，编排自动化产品设计流程。

## 核心设计理念

### Define-centric 流程

采用 **1-5-9 层级迭代** 的设计理念：

- **L1 (MVP)**: 最小可行产品，一条 Happy Path，快速验证
- **L5 (Structured)**: 结构化设计，完整的模块拆分和 PRD
- **L9 (Build Ready)**: 构建就绪，工程视角的任务规格

### 三大改动原则

1. **Define = Plan**: Define 阶段就是计划阶段，以 Define 的产物为底构建每一次任务的循环
2. **更 MVP 更小的任务**: 让 Fast Prototype 能更快出现（一条 Happy Path，最多 3 屏）
3. **握手澄清机制**: 拒绝"猜测式执行"，在动手前通过握手确保 Agent 对目标和范围的认知一致

### 产物体系

| Artifact | 层级 | 角色与定义 | 更新时机 |
|----------|------|------------|----------|
| **Product Charter** | Step 0 | 本轮迭代的目标、问题、范围定义 | 每轮开始时的握手阶段 |
| **Persona** | Step 0 | 目标用户画像 | 握手阶段确定 |
| **MVP Card Plan** | D1 | 一条 Happy Path 的计划 | L1 迭代时创建 |
| **User Flow (Simple)** | D1 | 简化的用户流程图 | L1 迭代时创建 |
| **Story Map** | D5 | 结构化的用户故事地图 | L5 迭代时从原型抽取 |
| **Module PRDs** | D5 | 各功能模块的需求文档 | L5 迭代时创建 |
| **Build Task Spec** | D9 | 工程视角的构建任务规格 | 进入 Build 前创建 |
| **Execution Plan** | EP | 长期有效的执行计划文档 | Define 锁定后、Screen 生成前 |

### 工作流结构

```
Step 0 (握手) → D1 (MVP Plan) → EP (Execution Plan) → S1 (Fast Prototype)
                     ↓ 确认点      ↓ Start 门禁           ↓
                     →→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→
                     ↓
                D5 (Structured Plan) → S5 (Structured Prototype)
                     ↓ 确认点          ↓
                     →→→→→→→→→→→→→→→→→→→
                     ↓
                D9 (Build Spec) → Build (Working App)
                     ↓ 确认点
```

**关键区分**：
- **Agent Todo**：短期工作清单，覆盖 Step 0 → D1 的 Define 过程
- **Execution Plan**：长期计划文档，在 D1 确认后生成，包含后续执行的 TODO
- **Start 门禁**：用户必须点击 Start 才能从 EP 进入 S1

---

## 用户场景

### 场景 1：快速 MVP 验证
**角色**：创业者  
**目标**：尽快看到一个可以走通的产品闭环  
**操作**：通过握手澄清需求后，Agent 生成 3 屏 MVP 原型

### 场景 2：渐进式产品规划
**角色**：产品经理  
**目标**：逐步完善产品设计，确保每个阶段正确  
**操作**：从 D1 到 D5 到 D9，每个 Define 阶段确认后再继续

### 场景 3：需求到开发的交接
**角色**：技术 Lead  
**目标**：获得可执行的 Build 任务规格  
**操作**：确认 D9 Build Spec 后，开始实际开发

---

## Define-centric 工作流

### Step 0: 握手 & 切小任务

**目标**：拒绝"猜测式执行"，先把这轮要做的事切成一个小 MVP

**操作**：
1. Agent 通过问答表单澄清：
   - 解决什么问题？
   - 目标用户？
   - MVP 还是相对完整？
2. AI 消息："根据您的回答，确认了以下内容..."
3. 创建 2 个 Document 节点（loading 状态）
4. 填充内容（done 状态）

**产物**：
- **Product Charter**: 本轮目标、问题、范围、In/Out scope
- **User Persona**: 目标用户画像

**无需确认** - 这是握手的输出，为 D1 做准备

---

### D1: Define L1 - MVP Card Plan ⏸️ 确认点 1

**目标**：把握手结果固化成一个最小的 MVP 计划

**操作**：
1. AI 消息："正在创建 MVP Card Plan..."
2. 工具调用模拟
3. 创建 MVP Card Plan Document 节点
4. 创建简化的 User Flow Whiteboard 节点
5. AI 消息："D1 MVP Card Plan 已生成，请确认..."
6. **⏸️ 发送确认消息，等待用户确认**

**产物**：
- **D1 MVP Card Plan**: Goal、User/Context、Happy Path User Story、核心功能说明
- **D1 User Flow**: 3 屏的简化流程图

**确认交互**：
- Chat：显示确认卡片，说明这将决定 S1 原型的内容
- 画布：节点显示橙色待确认边框

---

### EP: Execution Plan ⏸️ Start 门禁

**前置条件**：D1 确认完成（User Story + User Flow + PRD 都已锁定）

**目标**：生成长期有效的 Execution Plan 文档，作为后续执行的单一事实源

**操作**：
1. AI 消息："Define 阶段已完成！正在生成 Execution Plan..."
2. 创建 `Execution Plan — <Project> — v1` Document 节点
3. 节点内容按模板生成（包含 Objective/Scope/Inputs/Outputs/TODO/AC）
4. Chat 发送文件操作卡片（可定位/可编辑）
5. **⏸️ 发送 Start 门禁消息，等待用户点击 Start**

**产物**：
- **Execution Plan v1**: 长期有效的计划文档，包含：
  - Objective（单句目标）
  - Scope（In Scope / Out of Scope）
  - Inputs（引用 Define 产物：@Charter, @Persona, @PRD...）
  - Outputs（交付物列表）
  - TODO List（执行顺序的任务列表）
  - Acceptance Checklist（验收标准）
  - Open Questions / Change Control

**Start 门禁交互**：
- Chat：显示 Start 门禁卡片（`intent='start'`）
- 画布：节点显示 Start 确认控件
- 主按钮文案：**Start**（而非 Confirm）
- 次要操作：Ask for Changes

**版本控制**：
- Ask for Changes → 保留 v1 节点，创建 `v2` 新节点
- 重新显示 Start 门禁

**Todo 同步**：
- Start 后，从 Plan 的 TODO List 派生新的 Chat「Plan Todo」消息
- FloatingTodoBar 切换到 Plan Todo
- 后续执行进度以 Plan Todo 为准

---

### S1: Design L1 - Fast Prototype

**前置条件**：Execution Plan Start 完成

**目标**：根据 Execution Plan 生成一个可点击的快速原型

**操作**：
1. AI 消息："Plan 已启动！开始生成快速原型..."
2. 创建 3 个 Screen 节点（MVP Happy Path）
3. 创建导航 Edges
4. 逐个填充 Screen 内容
5. AI 消息："S1 快速原型已生成！"
6. 更新 Plan Todo 进度

**产物**（以 Luma 为例）：
- **Screen A: Home/Explore** - 活动发现入口
- **Screen B: Event Detail** - 活动详情 + 注册
- **Screen C: Success** - 注册成功确认

**无阻塞确认** - 用户可以直接体验原型并提反馈

---

### D5: Define L5 - Structured Plan ⏸️ 确认点 2

**前置条件**：S1 生成完成

**目标**：从 S1 原型中抽取结构，生成更完整的计划

**操作**：
1. AI 消息："从 S1 原型中抽取结构..."
2. 创建 Story Map Whiteboard 节点
3. 创建多个 Module PRD Document 节点
4. AI 消息："D5 结构化计划已生成，请确认..."
5. **⏸️ 发送确认消息，等待用户确认**

**产物**：
- **D5 Story Map**: 用户活动视角的故事地图（3 个 Epics）
- **D5 Module PRDs**: 
  - PRD: Discovery Module
  - PRD: Detail Module
  - PRD: Registration Module

**确认交互**：
- Chat：显示确认卡片，说明这将决定 S5 和后续 Build 的结构
- 画布：所有 D5 节点显示橙色待确认边框

---

### S5: Design L5 - Structured Prototype

**前置条件**：D5 确认完成

**目标**：在 S1 基础上增加结构预留

**操作**：
1. AI 消息："D5 已确认！S5 将在 S1 基础上优化结构..."
2. 更新/添加 Prototype Notes
3. AI 消息："S5 结构化原型完成..."

**产物**：
- 保持 S1 的 3 屏可用
- 添加 **S5 Prototype Notes**: 预留扩展说明

**无阻塞确认** - 准备进入 Build

---

### D9: Define L9 - Build Task Spec ⏸️ 确认点 3

**前置条件**：S5 完成

**目标**：为 Build 创建工程视角的任务规格

**操作**：
1. AI 消息："在开始 Build 之前，需要一份工程任务规格..."
2. 创建 Build Task Spec Document 节点
3. AI 消息："D9 Build 任务规格已生成，请确认..."
4. **⏸️ 发送确认消息，等待用户确认**

**产物**：
- **D9 Build Task Spec**:
  - Scope: 这轮 Build 只做什么
  - Screens & Routes: 页面和路由定义
  - Data Model: 数据结构
  - Behavior Rules: 交互规则
  - 验收标准: 什么算完成

**确认交互**：
- Chat：显示确认卡片，这是进入 Build 的最后确认点
- 画布：节点显示橙色待确认边框

---

### Build: Working App

**前置条件**：D9 确认完成

**目标**：根据 D9 规格开始构建

**操作**：
1. AI 消息："D9 已确认！Build 阶段可以开始..."
2. 模拟代码生成工具调用
3. AI 消息：完成总结

**产物**：
- 在演示中，S1/S5 已经是可运行的原型
- 实际开发中会调用代码生成工具

---

## 确认交互机制

### 确认消息类型

```typescript
interface ConfirmationData {
  targetNodeId: string;      // 待确认的节点 ID
  targetNodeType: NodeType;  // 节点类型
  title: string;             // 确认标题
  summary: string;           // 产物摘要
  status: 'pending' | 'confirmed' | 'revision_requested';
  revisionNote?: string;     // 用户的修改意见
}
```

### 确认点设置

| 确认点 | 阶段 | 确认内容 | 影响范围 |
|--------|------|----------|----------|
| 1 | D1 | MVP Card Plan | 决定 S1 原型的内容 |
| 2 | D5 | Structured Plan | 决定 S5 结构和 Build 范围 |
| 3 | D9 | Build Task Spec | 决定 Build 的具体任务 |

### 交互规则

- **「确认继续」**: 卡片折叠为已确认状态，节点边框变绿，继续下一阶段
- **「需要修改」**: 弹出修改说明输入框，AI 根据反馈调整
- **「定位到画布」**: 画布自动平移到该节点

---

## 类型定义

### 工作流阶段和层级

```typescript
// 工作流阶段
export type WorkflowPhase = 'handshake' | 'd1' | 's1' | 'd5' | 's5' | 'd9' | 'build';

// 层级标识
export type DefineLevel = 'L1' | 'L5' | 'L9';

// 扩展的 PlanStep
export interface PlanStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'waiting_confirmation' | 'done';
  level?: DefineLevel;      // Define 层级
  phase?: WorkflowPhase;    // 当前阶段
}
```

### Section 定义

```typescript
export const SECTION_IDS = {
  DEFINE: 'section-define',       // Define 阶段产物
  PROTOTYPE: 'section-prototype', // Design 阶段 Screens
  BUILD: 'section-build'          // Build 阶段产物
};
```

---

## 技术实现

### 关键文件

- `types.ts` - WorkflowPhase, DefineLevel, PlanStep 类型
- `constants.ts` - SECTION_IDS, 布局常量
- `App.tsx` - HANDSHAKE_QUESTIONS, MOCK_LUMA_DATA, executeWorkflow 函数
- `components/Chat/ConfirmationCard.tsx` - 确认卡片组件

### executeWorkflow 主流程

```typescript
const executeWorkflow = async (planMsgId: string) => {
  // Step 0: Handshake & Charter
  await runStep0_Handshake();
  
  // D1: Define L1 - MVP Card Plan
  await runStep1_DefineL1();
  await waitForConfirmation('d1');  // 确认点 1
  
  // S1: Design L1 - Fast Prototype
  await runStep2_DesignL1();
  
  // D5: Define L5 - Structured Plan
  await runStep3_DefineL5();
  await waitForConfirmation('d5');  // 确认点 2
  
  // S5: Design L5 - Structured Prototype
  await runStep4_DesignL5();
  
  // D9: Define L9 - Build Task Spec
  await runStep5_DefineL9();
  await waitForConfirmation('d9');  // 确认点 3
  
  // Build: Working App
  await runStep6_Build();
};
```

---

## Mock 数据结构

```typescript
const MOCK_LUMA_DATA = {
  // Step 0: Handshake outputs
  projectCharter: DocumentData;
  persona: DocumentData;
  
  // D1: MVP Card Plan
  d1MvpCardPlan: DocumentData;
  d1UserFlow: WhiteboardData;
  
  // S1: Fast Prototype (3 Screens)
  s1ScreenA: ScreenData;  // Home/Explore
  s1ScreenB: ScreenData;  // Event Detail
  s1ScreenC: ScreenData;  // Success
  
  // D5: Structured Plan
  d5StoryMap: WhiteboardData;
  d5PrdDiscovery: DocumentData;
  d5PrdDetail: DocumentData;
  d5PrdRegistration: DocumentData;
  
  // D9: Build Task Spec
  d9BuildSpec: DocumentData;
};
```

---

## 产物统计

| 阶段 | 类型 | 数量 | 节点名称 |
|------|------|------|----------|
| Step 0 | Document | 2 | Charter, Persona |
| D1 | Document | 1 | MVP Card Plan |
| D1 | Whiteboard | 1 | User Flow (3屏) |
| S1 | Screen | 3 | Home/Explore, Detail, Success |
| D5 | Whiteboard | 1 | Story Map |
| D5 | Document | 3 | PRD x3 |
| S5 | Document | 1 | Prototype Notes |
| D9 | Document | 1 | Build Task Spec |
| **总计** | | **13 个节点** | |

---

## 验收标准

- [ ] Step 0 握手问题正确显示并收集答案
- [ ] Step 0 产出 Charter 和 Persona
- [ ] D1 生成 MVP Card Plan 和简化 User Flow
- [ ] D1 确认点正确暂停等待
- [ ] S1 生成 3 屏快速原型（可点击预览）
- [ ] D5 从原型抽取 Story Map 和 Module PRDs
- [ ] D5 确认点正确暂停等待
- [ ] S5 添加结构化说明
- [ ] D9 生成 Build Task Spec
- [ ] D9 确认点正确暂停等待
- [ ] Build 阶段完成总结
- [ ] Plan Steps 实时显示层级和状态
- [ ] 所有确认卡片正常交互

---

## 未来优化

- [ ] 支持从 D5/S5 回退到 D1/S1 调整
- [ ] 支持多轮 Define 循环（添加新功能）
- [ ] 根据用户握手答案动态调整 MVP 范围
- [ ] 真实 AI 生成内容（替代 Mock 数据）
- [ ] D9 到 Build 的代码生成集成
- [ ] 确认历史记录和版本对比
- [ ] 工作流模板（不同类型产品的预设流程）
