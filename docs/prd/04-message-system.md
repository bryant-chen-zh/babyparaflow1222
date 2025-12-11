# Message System - 多类型消息展示系统

## 概述

Message System 是 Visual Coding Agent 的核心交互层，负责在 Chat 面板中展示多种类型的消息，包括用户输入、AI 回复、工具调用、产品决策问题和执行计划。该系统通过类型化消息架构，提供了清晰、直观的用户体验。

## 消息类型架构

### 类型定义

```typescript
export type MessageType = 'user' | 'ai' | 'tool_call' | 'question' | 'confirmation';

export interface ChatMessage {
  id: string;
  type: MessageType;
  role?: 'user' | 'ai'; // 向后兼容
  content: string;
  timestamp: number;
  plan?: PlanStep[];
  toolCall?: ToolCallData;
  question?: QuestionData;
  confirmation?: ConfirmationData;
  executionStarted?: boolean;
}

export interface ConfirmationData {
  targetNodeId: string;      // 待确认的节点 ID
  targetNodeType: NodeType;  // 节点类型
  title: string;             // 确认标题
  summary: string;           // 产物摘要
  status: 'pending' | 'confirmed' | 'revision_requested';
  revisionNote?: string;     // 用户的修改意见
}
```

### 五种核心消息类型

#### 1. User & AI Messages (基础对话)
- **user**: 用户输入的消息
- **ai**: AI 的文本回复
- 支持 @ mention 语法，可引用画布上的节点和区域
- 样式：用户消息右对齐灰色背景，AI 消息左对齐白色背景

#### 2. Tool Call Messages (工具调用展示)
展示 AI Agent 执行的工具操作，让用户了解系统的思考过程。

**支持的工具类型**：
- `grep` - 搜索代码
- `read` - 读取文件
- `bash` - 执行命令
- `edit` - 编辑文件
- `write` - 创建文件
- `glob` - 查找文件

**展示策略**：
- **简化展示** (`read` / `grep`): 纯文本形式展示，无容器，格式为 "Read [filename]" 或 "Search [filename]"
- **完整展示** (其他工具): 卡片形式，包含工具图标、操作描述、文件路径、状态图标

**实现组件**: `ToolCallMessage.tsx`

#### 3. Question Messages (产品决策问题)
在工作流开始前，向用户提出关键的产品决策问题，确保生成的内容符合用户需求。

**问题流程**：
1. 项目类型 (SaaS / E-commerce / Social / B2B / Other)
2. 核心用户场景
3. 技术复杂度 (Simple / Moderate / Complex)
4. 部署架构 (Single / Multi-tier / Microservices / Serverless)

**特性**：
- 单选题形式，A/B/C/D 选项标签
- 选择后自动前进到下一题（300ms 延迟显示选中效果）
- 使用 moxt-* 主题色系，选中状态为灰色 (`bg-moxt-fill-2`)
- 紧凑布局：`maxHeight: 40vh`
- 使用单个固定容器 ID `'question-container'` 在原地更新问题
- 完成后折叠显示答案摘要，格式：`Question 1/5: [Answer]`

**视觉设计**：
- 圆角：`rounded-lg`
- 边框：`border-moxt-line-1`
- Header icon：`HelpCircle` 使用主题色 `text-moxt-brand-7`
- 字号：标题 `text-13`，选项 `text-12`
- 选中状态：`bg-moxt-fill-2 border-moxt-line-2`（中性灰色）

**实现组件**: `QuestionCard.tsx`

#### 4. Plan Messages (执行计划)
展示 6 阶段的工作流执行计划，并提供实时进度追踪。

**六个执行阶段**：
1. 项目启动 (Project Charter, Persona)
2. 设计用户故事地图 (User Story Map) ⏸️ 确认点
3. 设计用户流程图 (User Flow) ⏸️ 确认点
4. 编写 PRD 文档 (每个 Story 一个) ⏸️ 确认点
5. 创建交互原型 (基于 PRD 生成 Screen)
6. 后端规划 (文档 + 数据库 + 集成)

**状态管理**：
- `pending`: 待执行
- `loading`: 正在执行
- `waiting_confirmation`: 等待用户确认
- `done`: 已完成

**交互流程**：
1. 计划消息首次出现时显示 "Start Execution" 按钮
2. 点击按钮后，`executionStarted` 标记为 true，按钮消失
3. 开始执行工作流，依次更新每个步骤的状态
4. 在确认点（阶段 2/3/4）暂停，发送确认消息
5. 用户确认后继续执行下一阶段
6. 当前执行步骤在 FloatingTodoBar 中悬浮显示

#### 5. Confirmation Messages (确认消息)
在关键产物生成后，向用户展示确认卡片，等待确认后继续执行。

**确认点**：
- Story Map 生成后 → 确认 Epic/Story 划分
- User Flow 生成后 → 确认页面跳转逻辑
- PRD 文档生成后 → 确认功能规格

**卡片结构**：
```
┌─────────────────────────────────────┐
│ ✓ Story Map 已生成                   │
├─────────────────────────────────────┤
│ 包含 2 个 Epic，5 个 User Story      │
│                                     │
│ [查看详情]  [定位到画布]              │
├─────────────────────────────────────┤
│ [确认继续] [需要修改]                 │
└─────────────────────────────────────┘
```

**交互规则**：
- 「确认继续」→ 更新状态为 confirmed，继续下一阶段
- 「需要修改」→ 弹出修改说明输入框，AI 根据反馈调整
- 「定位到画布」→ 画布自动平移到该节点

**视觉设计**：
- 圆角：`rounded-lg`
- 边框：`border-moxt-line-1`
- 待确认状态：Header 显示橙色图标
- 已确认状态：Header 显示绿色勾选图标
- 需要修改状态：Header 显示红色警告图标

**实现组件**: `ConfirmationCard.tsx`

## FloatingTodoBar - 悬浮任务进度条

### 位置和布局
- 位置：Chat 面板输入框正上方
- 布局：左侧 icon + 中间 title/description + 右侧计数器和展开按钮
- 宽度：与输入框一致
- 内边距：`px-3 py-2.5`（紧凑设计）

### 视觉设计
- 圆角：`rounded-lg`
- 阴影：`shadow-md`
- 边框：`border border-moxt-line-1`
- 背景：`bg-moxt-fill-white`

### 功能
**收起状态**：
- 显示当前执行任务的标题（黑色文字 `text-moxt-text-1`）
- 显示任务状态（"Processing..." 或 "Execution complete"）
- 显示进度计数（X/Y）
- loading 图标带动画 pulse 效果

**展开状态**：
- 列出所有任务及其状态
- pending: 灰色圆圈图标 (`text-moxt-text-4`)
- loading: 灰色旋转加载图标 (`text-moxt-text-2`)，淡灰背景
- done: 主题色勾选图标 (`text-moxt-brand-7`)，文字删除线

### 字体规范
- 标题：`text-13` (13px)
- 描述文字：`text-12` (12px)
- 进度计数：`text-12`
- 列表项文字：`text-12`

### 对齐方式
- 主容器：`items-start` (顶部对齐)
- Icon：添加 `pt-0.5` 微调对齐，使用 `size={14}` 统一尺寸
- 文字内容：左对齐

**实现组件**: `FloatingTodoBar.tsx`

## 工具映射系统

### 用户友好标签

为了让非技术用户理解 AI Agent 的操作，所有工具调用都映射为人类可读的标签。

**映射表** (`utils/toolCallMapper.ts`):

```typescript
grep → "Search Code"
glob → "Find Files"
read → "Read File"
bash → 智能判断:
  - 包含 'git' → "Git Operation"
  - 包含 'npm'/'yarn' → "Run Build Command"
  - 包含 'test' → "Run Tests"
  - 其他 → "Execute Command"
edit → "Edit File"
write → "Create File"
```

## 状态管理

### Plan State
- 存储在 App.tsx 的 `currentPlan` 状态
- 传递给 `ChatSidebar` 作为 props
- 每次步骤状态更新时同步更新 `currentPlan` 和消息中的 `plan`

### Question State
- 使用固定 ID `'question-container'` 在消息列表中原地更新
- `currentQuestionIndex` 跟踪当前问题索引
- 用户选择答案后保存在 `questionAnswers` map 中

### Execution State
- `executionStarted` 标记控制按钮显隐
- 工作流通过 `executeWorkflow` 函数编排执行
- 每个阶段完成后更新对应步骤状态为 `done`

## 工作流编排

### 执行序列（带确认点）

```typescript
async function executeWorkflow(planMsgId: string) {
  // Phase 1: 项目启动
  updatePlanStatus(planMsgId, 's1', 'loading');
  await simulateToolCalls(['grep', 'read']);
  createNodes([ProjectCharter, Persona]);
  updatePlanStatus(planMsgId, 's1', 'done');

  // Phase 2: Story Map + 确认点
  updatePlanStatus(planMsgId, 's2', 'loading');
  createStoryMapNode();
  updatePlanStatus(planMsgId, 's2', 'waiting_confirmation');
  const confirmMsgId2 = addConfirmationMessage('story-map', 'WHITEBOARD', 'Story Map 已生成', '包含 2 个 Epic，5 个 User Story');
  const confirmed2 = await waitForConfirmation(confirmMsgId2);
  if (!confirmed2) { await handleRevision(confirmMsgId2); }
  updatePlanStatus(planMsgId, 's2', 'done');

  // Phase 3: User Flow + 确认点
  updatePlanStatus(planMsgId, 's3', 'loading');
  createUserFlowNode();
  updatePlanStatus(planMsgId, 's3', 'waiting_confirmation');
  const confirmMsgId3 = addConfirmationMessage('user-flow', 'WHITEBOARD', 'User Flow 已生成', '包含 5 个页面的跳转逻辑');
  const confirmed3 = await waitForConfirmation(confirmMsgId3);
  if (!confirmed3) { await handleRevision(confirmMsgId3); }
  updatePlanStatus(planMsgId, 's3', 'done');

  // Phase 4: PRD 文档 + 确认点
  updatePlanStatus(planMsgId, 's4', 'loading');
  createPRDNodes([Story1PRD, Story2PRD, Story3PRD, Story4PRD, Story5PRD]);
  updatePlanStatus(planMsgId, 's4', 'waiting_confirmation');
  const confirmMsgId4 = addConfirmationMessage('prd-docs', 'DOCUMENT', 'PRD 文档已生成', '共 5 个 Story 的功能规格说明');
  const confirmed4 = await waitForConfirmation(confirmMsgId4);
  if (!confirmed4) { await handleRevision(confirmMsgId4); }
  updatePlanStatus(planMsgId, 's4', 'done');

  // Phase 5: 前端原型（基于确认的 PRD）
  updatePlanStatus(planMsgId, 's5', 'loading');
  createScreenNodes([Home, Explore, Detail, Create, Profile]);
  updatePlanStatus(planMsgId, 's5', 'done');

  // Phase 6: 后端规划
  updatePlanStatus(planMsgId, 's6', 'loading');
  createBackendNodes([...]);
  updatePlanStatus(planMsgId, 's6', 'done');
}
```

### 确认交互辅助函数

```typescript
// 添加确认消息
const addConfirmationMessage = (
  targetNodeId: string,
  targetNodeType: NodeType,
  title: string,
  summary: string
): string => {
  const msgId = `confirm-${Date.now()}`;
  setMessages(prev => [...prev, {
    id: msgId,
    type: 'confirmation',
    content: '',
    timestamp: Date.now(),
    confirmation: {
      targetNodeId,
      targetNodeType,
      title,
      summary,
      status: 'pending'
    }
  }]);
  return msgId;
};

// 等待用户确认
const waitForConfirmation = (msgId: string): Promise<boolean> => {
  return new Promise(resolve => {
    const checkStatus = () => {
      const msg = messages.find(m => m.id === msgId);
      if (msg?.confirmation?.status === 'confirmed') resolve(true);
      else if (msg?.confirmation?.status === 'revision_requested') resolve(false);
      else setTimeout(checkStatus, 100);
    };
    checkStatus();
  });
};
```

### 动画和延迟
- 工具调用消息：200ms 间隔添加
- 节点创建：500ms 延迟显示
- 阶段间隔：800ms 暂停
- 问题选择反馈：300ms 延迟跳转
- 确认等待：无限等待，直到用户操作

## 最佳实践

### 性能优化
1. 使用 `React.memo` 包裹消息组件
2. 避免在渲染循环中创建新对象
3. 使用 `key` prop 确保列表性能

### 可访问性
1. 按钮提供合适的 aria-label
2. 使用语义化 HTML 标签
3. 键盘导航支持（问题卡片的上下箭头选择）

### 用户体验
1. 状态变化要有视觉反馈（加载动画、颜色变化）
2. 长文本要截断并提供 tooltip
3. 错误状态要明确提示

## 未来扩展

### 计划中的消息类型
- **Error Messages**: 执行失败时的错误提示
- ~~**Confirmation Messages**: 需要用户确认的操作~~ ✅ 已实现
- **Branch Messages**: 支持多路径选择的决策树
- **Feedback Messages**: 用户对生成内容的反馈

### 增强功能
- 消息搜索和过滤
- 消息导出（Markdown / PDF）
- 消息历史回放
- 自定义消息模板
- 确认历史记录和回溯
- 批量确认/拒绝多个产物
