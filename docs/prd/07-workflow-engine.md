# 工作流引擎 (Workflow Engine)

## 功能概述

工作流引擎是 Visual Coding Agent 的"导演"，负责编排自动化演示流程，控制节点生成时序、摄像机运动和状态更新。

## 用户场景

### 场景 1：自动化产品演示
**角色**：创业者  
**目标**：向投资人演示完整的产品规划  
**操作**：点击 Start Simulation，坐等自动演示完成

### 场景 2：教学展示
**角色**：培训讲师  
**目标**：展示标准的产品开发流程  
**操作**：运行 Simulation，配合讲解每个阶段

### 场景 3：快速原型验证
**角色**：产品经理  
**目标**：快速生成一个产品蓝图模板  
**操作**：运行 Simulation，基于生成的内容进行修改

## 6-Act Workflow

### Act 1: 产品策略 (Product Strategy)
**时长**：~4 秒  
**操作**：
1. AI 消息："Analyzing your requirements and researching similar platforms..."
2. 工具调用：`grep` → "event management SaaS"
3. 工具调用：`read` → "docs/product-templates.md"
4. AI 消息："Creating user personas and product charter..."
5. 平移摄像机到文档区域
6. 创建 3 个 Document 节点（loading 状态）
7. 1.2 秒后填充内容（done 状态）
8. AI 消息："Product strategy documents ready."

**生成内容**：
- User Personas
- Product Charter
- Core Requirements

**摄像机**：
```typescript
panTo(cx, cy + DOCUMENT_SECTION_Y_OFFSET, 0.5);
```

### Act 2: 用户流程 (User Flow)
**时长**：~3.5 秒  
**操作**：
1. AI 消息："Mapping user journey based on your requirements..."
2. 工具调用：`grep` → "user flow patterns"
3. 工具调用：`read` → "templates/flow-diagram.json"
4. AI 消息："Generating flow chart with key decision points..."
5. 平移摄像机到流程图区域
6. 创建 1 个 Whiteboard 节点（loading）
7. 1.2 秒后显示流程图
8. AI 消息："User flow diagram complete."

**生成内容**：
- User Flow Chart（包含圆形、矩形、菱形、箭头）

**摄像机**：
```typescript
panTo(cx + CHART_SECTION_X_OFFSET + 400, cy - 300 + 300, 0.6);
```

### Act 3: 前端原型 (Frontend Prototype)
**时长**：~6 秒  
**操作**：
1. AI 消息："Designing high-fidelity screens with Tailwind CSS..."
2. 工具调用：`read` → "design-system/colors.css"
3. 工具调用：`grep` → "navigation component"
4. 缩小视角看到整个 Screen 区域
5. 创建 5 个 Screen 节点骨架
6. 创建 4 条边（Screen 之间的导航关系）
7. AI 消息："Building Home and Explore pages..."
8. 显示 Screen 1-2
9. 工具调用：`read` → "templates/form-patterns.tsx"
10. AI 消息："Creating Event Detail and form screens..."
11. 显示 Screen 3-5
12. AI 消息："All screens connected with navigation flow."

**生成内容**：
- Home Screen
- Explore Screen
- Event Detail Screen
- Create Event Screen
- Profile Screen

**摄像机**：
```typescript
panTo(cx, cy + 400, 0.25);  // 缩小看全局
```

### Act 4: 后端规划 (Backend Planning)
**时长**：~4 秒  
**操作**：
1. AI 消息："Designing system architecture for scalability..."
2. 工具调用：`grep` → "RESTful API patterns"
3. 工具调用：`read` → "docs/architecture-guide.md"
4. 平移到后端文档区域
5. AI 消息："Documenting tech stack and data flow..."
6. 创建 4 个 Document 节点（loading）
7. 1.2 秒后填充内容
8. AI 消息："Architecture documentation complete."

**生成内容**：
- Development Plan
- Tech Stack
- Architecture Design
- Data Model

**摄像机**：
```typescript
panTo(cx + 2800, cy - 100, 0.4);
```

### Act 5: 数据设计 (Data Design)
**时长**：~3.5 秒  
**操作**：
1. AI 消息："Modeling database schemas for PostgreSQL..."
2. 工具调用：`read` → "schemas/postgres-types.sql"
3. 工具调用：`grep` → "foreign key constraints"
4. 向下平移到数据库区域
5. AI 消息："Creating Users and Events tables with relationships..."
6. 创建 2 个 Table 节点
7. 0.8 秒后显示表结构
8. AI 消息："Database models defined."

**生成内容**：
- Users Table
- Events Table

**摄像机**：
```typescript
panTo(cx + 2750, cy + 300, 0.4);
```

### Act 6: 第三方集成 (Integration)
**时长**：~3 秒  
**操作**：
1. AI 消息："Configuring external service integrations..."
2. 工具调用：`grep` → "SendGrid API"
3. 工具调用：`read` → "config/services.json"
4. 继续向下到集成区域
5. AI 消息："Setting up email notifications and calendar sync..."
6. 创建 2 个 Integration 节点
7. 0.8 秒后显示详细配置
8. AI 消息："All integrations configured successfully."

**生成内容**：
- SendGrid（邮件服务）
- Google Calendar（日历同步）

**摄像机**：
```typescript
panTo(cx + 2700, cy + 600, 0.35);
```

### Finale: 全局视图
**时长**：~1 秒  
**操作**：
1. 缩小到全局视图（0.16x）
2. 显示完成消息（包含生成内容清单）

**完成消息内容**：
```
Complete! Your full-stack prototype is ready with:
• 3 Product Strategy Documents
• User Flow Diagram
• 5 High-fidelity UI Screens
• Backend Architecture & Data Models
• Database Schemas
• Third-party Integrations

You can click on any node to edit, or use the toolbar to add more resources.
```

**摄像机**：
```typescript
panTo(cx + 1000, cy, 0.16);
```

## 核心机制

### 0. 辅助函数

#### addAIMessage - 添加 AI 消息
```typescript
const addAIMessage = (content: string) => {
  setMessages(prev => [...prev, {
    id: `ai-${Date.now()}-${Math.random()}`,
    type: 'ai',
    role: 'ai',
    content,
    timestamp: Date.now()
  }]);
};
```

#### simulateToolCall - 模拟工具调用
```typescript
const simulateToolCall = async (tool: 'grep' | 'read', filePath: string, delay: number = 400) => {
  const msgId = addToolCallMessage(tool, tool === 'grep' ? 'Search Code' : 'Read File', filePath);
  await new Promise(r => setTimeout(r, delay));
  updateToolCallStatus(msgId, 'success');
};
```

### 1. 时序控制

使用 `setTimeout` + `await` 控制每步延迟：

```typescript
await new Promise(r => setTimeout(r, 1000));  // 等待 1 秒
```

### 2. 状态更新

#### 2.1 Plan 状态更新
```typescript
const updatePlanStatus = (msgId: string, stepId: string, status: 'pending' | 'loading' | 'done') => {
  setMessages(prev => prev.map(msg => {
    if (msg.id === msgId && msg.plan) {
      return {
        ...msg,
        plan: msg.plan.map(s => 
          s.id === stepId ? { ...s, status } : s
        )
      };
    }
    return msg;
  }));
};
```

#### 2.2 节点状态更新
```typescript
// 批量更新节点状态
setNodes(prev => prev.map(n => 
  condition(n) ? { ...n, status: 'done', data: mockData } : n
));
```

### 3. 摄像机控制

#### 3.1 panTo 函数
```typescript
const panTo = (targetX: number, targetY: number, targetScale: number) => {
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  
  // 计算视图偏移，使目标点居中
  const newX = -(targetX * targetScale) + (screenW / 2);
  const newY = -(targetY * targetScale) + (screenH / 2);
  
  setView({ x: newX, y: newY, scale: targetScale });
};
```

#### 3.2 过渡动画
使用 CSS transition（CanvasContainer）：
```css
transition-transform duration-700 ease-in-out
```

### 4. Mock 数据管理

#### 4.1 数据结构
```typescript
const MOCK_LUMA_DATA: {
  doc1: DocumentData;
  doc2: DocumentData;
  doc3: DocumentData;
  docDevPlan: DocumentData;
  docTechStack: DocumentData;
  docArchitecture: DocumentData;
  docDataModel: DocumentData;
  whiteboard: WhiteboardData;
  screen1: ScreenData;
  screen2: ScreenData;
  screen3: ScreenData;
  screen4: ScreenData;
  screen5: ScreenData;
  tableUsers: TableData;
  tableEvents: TableData;
} = { ... };
```

#### 4.2 数据注入
```typescript
setNodes(prev => prev.map(n => 
  n.id === 'node-doc-1' 
    ? { ...n, status: 'done', data: MOCK_LUMA_DATA.doc1 } 
    : n
));
```

## 工作流配置

### 布局常量
```typescript
// 画布中心点
LAYOUT_CENTER_X = 2000
LAYOUT_CENTER_Y = 1500

// Section 偏移
DOCUMENT_SECTION_Y_OFFSET = -900
CHART_SECTION_X_OFFSET = -2200
BACKEND_SECTION_X_OFFSET = 2600
BACKEND_SECTION_Y_OFFSET = -800

// 节点间距
NODE_SPACING_X = 550
WEB_NODE_SPACING_X = 1200
WEB_NODE_SPACING_Y = 900
```

### 时序配置
```typescript
// 各阶段延迟时间（ms）
PHASE_DELAY = {
  beforePhase1: 1000,
  phase1Load: 800,
  phase1Reveal: 1500,
  beforePhase2: 1000,
  phase2Load: 800,
  phase2Reveal: 1500,
  // ...
};
```

## 技术实现

### 关键文件
- `App.tsx` - `runSimulation` 函数（约 200 行）
- `constants.ts` - 布局配置

### Simulation 主流程
```typescript
const runSimulation = async () => {
  setSimulationStarted(true);
  
  // 1. 添加用户消息
  setMessages(prev => [...prev, userMessage]);
  setIsProcessing(true);
  
  // 2. 添加 AI 响应和计划
  setMessages(prev => [...prev, aiMessageWithPlan]);
  
  // 3. 执行 6 幕
  await runAct1();  // Documents
  await runAct2();  // Flow
  await runAct3();  // Screens
  await runAct4();  // Backend Docs
  await runAct5();  // Database
  await runAct6();  // Integration
  
  // 4. 完成
  setIsProcessing(false);
  setMessages(prev => [...prev, finalMessage]);
};
```

### 节点生成模式
```typescript
// 模式 1：批量创建 + 逐个填充
const nodes = [...]; // 创建空节点
setNodes(prev => [...prev, ...nodes]);

await delay(1500);
setNodes(prev => prev.map(n => 
  n.id === targetId ? { ...n, status: 'done', data } : n
));

// 模式 2：逐个创建和填充
for (const nodeData of nodeList) {
  const node = { ... };
  setNodes(prev => [...prev, node]);
  await delay(600);
  setNodes(prev => prev.map(n => 
    n.id === node.id ? { ...n, status: 'done' } : n
  ));
}
```

## 验收标准

- [ ] Simulation 按正确顺序执行 6 幕
- [ ] 每幕的摄像机运动平滑准确
- [ ] 节点生成时机和顺序正确
- [ ] Plan Steps 状态实时更新
- [ ] 最终显示完成消息
- [ ] Simulation 期间用户输入被禁用
- [ ] Simulation 只能运行一次（按钮消失）

## 未来优化

- [ ] 可配置的工作流（JSON 配置文件）
- [ ] 暂停/继续 Simulation
- [ ] 加速/减速控制
- [ ] 步进调试模式
- [ ] 自定义 Mock 数据
- [ ] 从用户输入生成真实内容（AI）
- [ ] 保存和加载工作流
- [ ] 工作流模板库
- [ ] 分支工作流（不同路径）
- [ ] 工作流可视化编辑器

## AI 集成计划（未实现）

当前使用 Mock 数据，未来可接入真实 AI：

### 预留的 AI 服务
```typescript
// services/geminiService.ts
generateDocument(userIntent: string)
generateUserFlow(userIntent: string, docOverview: string)
generateScreen(screenName: string, description: string, context: string)
generateDatabase(description: string)
```

### 集成步骤
1. 配置 Gemini API Key
2. 替换 Mock 数据为 AI 调用
3. 添加错误处理和重试
4. 优化生成质量（Prompt Engineering）

## 性能考虑

- 使用 `useState` 批量更新而非逐个更新
- 避免在循环中直接操作 DOM
- 摄像机动画使用 CSS Transform（GPU 加速）
- 大量节点时考虑分批渲染


