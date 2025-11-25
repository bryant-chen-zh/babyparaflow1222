# 聊天系统 (Chat System)

## 功能概述

聊天系统提供与 AI 对话的界面，展示工作流执行计划，并触发自动化的 Simulation 演示。

## 用户场景

### 场景 1：启动演示
**角色**：演示者  
**目标**：向客户展示产品规划流程  
**操作**：点击 "Start Simulation" 按钮，观看自动化演示

### 场景 2：查看执行计划
**角色**：项目经理  
**目标**：了解 AI 的工作步骤  
**操作**：查看聊天消息中的执行计划（Plan Steps），实时查看进度

### 场景 3：折叠侧边栏
**角色**：用户  
**目标**：获得更大的画布空间  
**操作**：点击折叠按钮隐藏聊天栏

## 核心功能

### 1. 聊天界面

#### 1.1 侧边栏布局
- **宽度**：420px（展开）/ 56px（折叠）
- **位置**：屏幕左侧固定
- **层级**：z-index: 20（高于画布）
- **背景**：`bg-moxt-fill-white`
- **边框**：`border-moxt-line-1`

#### 1.2 侧边栏状态
- **展开**：显示完整聊天内容
- **折叠**：只显示图标和竖向文字

### 2. 消息系统

#### 2.1 消息类型
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  plan?: PlanStep[];  // 可选：执行计划
}
```

#### 2.2 消息渲染
- **用户消息**：右对齐，`bg-moxt-fill-2` 气泡，`text-13` 字号
- **AI 消息**：左对齐，无背景纯文本，`text-13` 字号，`text-moxt-text-2` 颜色，支持完整 Markdown 渲染
- **自动滚动**：新消息出现时滚动到底部

#### 2.3 Markdown 渲染支持

AI 消息支持完整的 Markdown 格式渲染：

**块级元素**：
- **标题**：H1-H6（`#` 到 `######`）
- **无序列表**：`-`、`*`、`•` 开头，bullet 颜色与文字同色
- **有序列表**：`1.` 等数字开头
- **任务列表**：`- [ ]` 未完成、`- [x]` 已完成
- **引用块**：`>` 开头，左侧显示竖线
- **代码块**：` ``` ` 包裹，支持语言标识，等宽字体显示
- **分隔线**：`---`、`***`、`___`

**行内元素**：
- **粗体**：`**text**`
- **斜体**：`*text*` 或 `_text_`
- **行内代码**：`` `code` ``
- **链接**：`[text](url)`
- **删除线**：`~~text~~`

**内联 Bullet 解析**：
- 支持 `• item1 • item2 • item3` 格式
- 自动拆分为独立的列表项

**实现文件**：
- `utils/markdownUtils.ts` - Markdown 解析器
- `components/Chat/ChatSidebar.tsx` - 渲染逻辑

#### 2.3 执行计划展示
```typescript
interface PlanStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done';
}
```

**视觉反馈**：
- `pending` - 灰色圆圈图标
- `loading` - 蓝色旋转加载图标
- `done` - 绿色勾选图标

### 3. Simulation 控制

#### 3.1 初始状态
- 显示欢迎消息
- 显示 "Start Simulation" 按钮（绿色，大尺寸）

#### 3.2 Simulation 启动
- 点击按钮触发 `runSimulation()`
- 按钮消失，显示输入框（可继续对话）
- `simulationStarted` 状态变为 true

#### 3.3 处理中状态
- 输入框禁用
- 显示 "Thinking..." 动画
- `isProcessing` 状态为 true

### 4. 输入交互

#### 4.1 输入框
- **位置**：底部固定
- **样式**：圆角，灰色背景，textarea 多行支持
- **Placeholder**："Type @ to mention files or describe your app idea..."
- **快捷键**：
  - Enter：发送消息
  - Shift+Enter：换行
  - Esc：关闭 @ Mention Popover

#### 4.2 发送消息
- Enter 键或点击发送按钮
- 自动清空输入框
- 添加到消息历史
- 清空已提及的节点列表

#### 4.3 @ Mention 功能

##### 4.3.1 触发方式
**方式 1：文本输入触发**
- 在输入框输入 `@` 字符
- 必须在开头或空格后输入
- 自动显示 Mention Popover

**方式 2：Canvas 选择触发**
- 在 Popover 中选择 "Select from Canvas"
- 进入 Canvas 选择模式
- 点击任意节点完成 mention

##### 4.3.2 Mention Popover 界面
```
┌─────────────────────────────┐
│ @ Mention                   │ ← Header
├─────────────────────────────┤
│ 🖱️ @ Select from Canvas    │ ← Canvas 选择选项（蓝色）
├─────────────────────────────┤
│ 📄 Product Charter (DOC)    │ ← 节点选项 1
│ 📊 User Flow (WHITEBOARD)   │ ← 节点选项 2
│ 📱 Home Screen (SCREEN)     │ ← 节点选项 3
└─────────────────────────────┘
```

**Popover 特性**：
- 最大高度：256px（超出滚动）
- 实时搜索过滤
- 键盘导航：↑/↓ 选择，Enter 确认，Esc 关闭
- 图标颜色按节点类型区分

##### 4.3.3 Canvas 选择模式
**功能范围**：
- 只能选择整个节点（不支持选择 Screen 内部元素）
- Screen 内部元素选择仅在 Run Prototype 模式（ImmersiveView）中可用

**视觉反馈**：
- 光标变为 pointer
- Hover 节点显示**蓝色高亮框**（`ring-4 ring-blue-500/50`）
- 其他交互（拖动、选择）被禁用

**退出方式**：
- 点击任意节点（自动退出）
- 按 Esc 键（手动退出）
- 点击 Canvas 空白区域

##### 4.3.4 Mention 视觉效果
**输入框中**：
- 格式：`@节点名称`
- 光标定位在节点名称之后
- 支持多个 mention（空格分隔）

**Canvas 上**：
- 被 mention 的节点显示**蓝色边框**（`ring-2 ring-blue-500`）
- 节点左上方显示蓝色 Badge：`@节点名称 ×`
- Badge 跟随节点移动（包括拖动、缩放）
- 被 mention 的节点自动设置 `overflow-visible` 和 `z-20`（确保 Badge 完整显示）

**消息历史中**：
- Mention 按节点类型显示彩色文本
- DOCUMENT: 蓝色
- WHITEBOARD: 紫色
- SCREEN: 翠绿色
- TABLE: 橙色
- API: 玫瑰色
- TASK: 灰色
- INTEGRATION: 靛蓝色

##### 4.3.5 删除 Mention
**方式 1：输入框删除**
- 直接删除 `@节点名称` 文本
- Canvas 上的边框和 Badge 不会自动消失（需手动删除）

**方式 2：Badge 删除**
- 点击 Badge 上的 `×` 按钮
- 同步从输入框删除对应的 `@节点名称`
- 清除 Canvas 上的蓝色边框和 Badge

##### 4.3.6 发送后行为
- 输入框清空
- 所有 mention 的视觉效果清除（边框和 Badge 消失）
- `mentionedNodeIds` 状态重置为空数组

##### 4.3.7 Run Prototype 模式的内部元素 @ Mention
**功能说明**：
- 仅在 Run Prototype（ImmersiveView）模式下支持选择和 mention Screen 内部元素
- Canvas 模式下只能选择整个节点

**触发方式**：
- 在 Run Prototype 全屏预览中，输入 `@` 进入 Canvas Selection Mode
- 选择 "Select from Canvas" 进入元素选择模式

**选择体验**：
- 顶部显示蓝色提示条："Select an element to mention"
- 鼠标悬停元素时显示蓝色高亮框（2px solid #3b82f6）
- Overlay 层拦截点击事件，确保选择流畅
- 点击元素完成选择，自动退出选择模式

**技术实现**：
- 使用 `generateCSSPath()` 生成元素的 CSS 选择器路径
- 使用 `extractElementLabel()` 提取元素标识（优先使用 className）
- 记录元素的 boundingBox 位置（相对于容器）
- Badge 格式：`@屏幕名称-元素标识`

**Badge 显示**：
- 蓝色 Badge 显示在元素左上方 32px 处
- 格式：`@Home Screen-hero-section ×`
- 支持点击 × 删除 mention

### 5. Simulation 触发

#### 5.1 自动触发机制
- 在输入框输入**任意内容**并发送
- 自动触发 `runSimulation()` 函数
- 启动自动化演示流程
- 用户无需输入特定命令，任何消息都会触发 simulation

## 界面设计

### 展开状态
```
┌─────────────────────┐
│  🌪️ Paraflow        │ ← Header
│  Visual Agent v1.0  │
├─────────────────────┤
│                     │
│ 🤖 AI: Hi! ...      │ ← Messages
│                     │
│ 👤 User: I want ... │
│                     │
│ 🤖 AI: Plan:        │
│   ✓ Step 1          │ ← Plan Steps
│   ⏳ Step 2         │
│   ○ Step 3          │
│                     │
│ [Thinking...]       │ ← Processing
│                     │
├─────────────────────┤
│ [Start Simulation]  │ ← Action Button
└─────────────────────┘
```

### 折叠状态
```
┌──┐
│ ⮜ │ ← Expand button
│    │
│ 🌪️ │ ← Logo
│    │
│ P  │ ← Vertical text
│ A  │
│ R  │
│ A  │
└──┘
```

## 技术实现

### 关键文件
- `components/Chat/ChatSidebar.tsx`
- `types.ts` - ChatMessage, PlanStep 类型

### 状态管理
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [isProcessing, setIsProcessing] = useState(false);
const [isSidebarOpen, setIsSidebarOpen] = useState(true);
const [simulationStarted, setSimulationStarted] = useState(false);
```

### 消息更新
```typescript
// 添加用户消息
setMessages(prev => [...prev, {
  id: Date.now().toString(),
  role: 'user',
  content: input,
  timestamp: Date.now()
}]);

// 添加带计划的 AI 消息
setMessages(prev => [...prev, {
  id: 'plan-msg',
  role: 'ai',
  content: "Here's the plan:",
  timestamp: Date.now(),
  plan: [
    { id: 's1', label: 'Step 1', status: 'pending' },
    { id: 's2', label: 'Step 2', status: 'pending' }
  ]
}]);
```

### 计划状态更新
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

### 自动滚动
```typescript
const bottomRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isOpen]);
```

## 验收标准

- [ ] 消息正确按时间顺序显示
- [ ] 用户和 AI 消息视觉区分明确
- [ ] 执行计划图标动画流畅
- [ ] 自动滚动到最新消息
- [ ] 侧边栏展开/折叠动画平滑
- [ ] 输入框在处理中正确禁用
- [ ] Start Simulation 按钮只显示一次

## 未来优化

- [ ] 消息时间戳显示
- [ ] 消息搜索功能
- [ ] 消息历史持久化
- [ ] 支持多轮对话（真实 AI）
- [ ] 消息编辑和删除
- [ ] 导出聊天记录
- [ ] 语音输入
- [x] Markdown 渲染（消息内）✅ 已实现
- [x] 代码块语法高亮 ✅ 已实现
- [ ] 流式输出（打字机效果）

