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
- **宽度**：384px（展开）/ 56px（折叠）
- **位置**：屏幕左侧固定
- **层级**：z-index: 20（高于画布）

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
- **用户消息**：右对齐，灰色气泡
- **AI 消息**：左对齐，白色气泡，带 AI 头像
- **自动滚动**：新消息出现时滚动到底部

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
- **样式**：圆角，灰色背景
- **Placeholder**：根据状态变化
  - 初始："Describe your app idea..."
  - Simulation 后："Reply to agent..."

#### 4.2 发送消息
- Enter 键或点击发送按钮
- 自动清空输入框
- 添加到消息历史

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
- [ ] Markdown 渲染（消息内）
- [ ] 代码块语法高亮
- [ ] 流式输出（打字机效果）

