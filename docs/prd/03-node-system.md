# 节点系统 (Node System)

## 功能概述

节点系统定义了画布上所有内容单元的类型、数据结构和交互方式。每个节点都是一个独立的可视化组件，包含特定类型的内容。

## 节点类型

### 1. Document 节点

**用途**：存储 Markdown 格式的文档  
**尺寸**：450x550  
**图标**：📄 FileText  
**颜色**：白底，蓝色标题栏

#### 数据结构
```typescript
interface DocumentData {
  content: string; // Markdown 内容
}
```

#### 交互能力
- 显示 Markdown 预览（前 8 行）
- "Edit" 按钮打开 MarkdownModal
- 支持滚动查看内容

#### 使用场景
- PRD 文档
- 用户画像
- 技术方案
- 开发计划

### 2. Whiteboard 节点

**用途**：绘制流程图、图表和卡片墙  
**尺寸**：850x700（可根据内容自适应）  
**图标**：🎨 GitBranch  
**颜色**：白底，紫色元素

#### 数据结构
```typescript
interface WhiteboardData {
  variant?: 'flow' | 'storymap';  // 变体类型
  elements: WhiteboardElement[];
}

interface WhiteboardElement {
  id: string;
  type: 'rect' | 'circle' | 'diamond' | 'text' | 'arrow' | 'card' | 'swimlane';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
  // Story Map 专用字段
  cardType?: 'epic' | 'story' | 'task';
  parentId?: string;  // 用于层级关系
}
```

#### 变体类型

##### Flow 变体（用户流程图）
- 用于展示页面跳转与交互逻辑
- 元素类型：圆形（起点/终点）、矩形（页面）、菱形（决策）、箭头（跳转）
- 自动布局：从上到下或从左到右

##### Story Map 变体（用户故事地图）
- 用于展示产品范围的卡片墙
- 采用 Epic → Story → Task 层级结构
- 布局规则：
  - **横向**：Epic 行，表示用户核心目标
  - **纵向**：Story 列，表示具体用户故事
  - **子项**：Task 卡片，表示实现任务

```
┌─────────────────────────────────────────────────────┐
│                   User Story Map                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐   ┌─────────┐   ┌─────────┐           │
│  │ Epic 1  │   │ Epic 2  │   │ Epic 3  │   ← Epic 行│
│  └────┬────┘   └────┬────┘   └────┬────┘           │
│       │             │             │                 │
│  ┌────▼────┐   ┌────▼────┐   ┌────▼────┐           │
│  │ Story 1 │   │ Story 3 │   │ Story 5 │   ← Story │
│  ├─────────┤   ├─────────┤   ├─────────┤           │
│  │ Story 2 │   │ Story 4 │   │         │           │
│  └─────────┘   └─────────┘   └─────────┘           │
│       │             │                               │
│  ┌────▼────┐   ┌────▼────┐                         │
│  │ Task 1  │   │ Task 2  │                 ← Task  │
│  └─────────┘   └─────────┘                         │
└─────────────────────────────────────────────────────┘
```

#### Story Map 详细数据结构

```typescript
// Story Map 专用数据结构
interface StoryMapData extends WhiteboardData {
  variant: 'storymap';
  epics: EpicData[];
}

interface EpicData {
  id: string;
  title: string;
  description?: string;
  color: string;  // Epic 颜色标识
  order: number;  // 横向排列顺序
  stories: StoryData[];
}

interface StoryData {
  id: string;
  title: string;
  description?: string;
  priority: 'must' | 'should' | 'could' | 'wont';  // MoSCoW 优先级
  order: number;  // 纵向排列顺序
  tasks: TaskData[];
}

interface TaskData {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  estimate?: string;  // 估算工时
}
```

#### Story Map Mock 数据示例

```typescript
const MOCK_STORY_MAP: StoryMapData = {
  variant: 'storymap',
  elements: [], // 由 epics 自动生成渲染元素
  epics: [
    {
      id: 'epic-1',
      title: 'User Discovery',
      description: 'Users can discover and explore events',
      color: '#3B82F6',  // blue
      order: 0,
      stories: [
        {
          id: 'story-1-1',
          title: 'Browse Events',
          description: 'As a user, I want to browse available events',
          priority: 'must',
          order: 0,
          tasks: [
            { id: 'task-1-1-1', title: 'Event list UI', status: 'todo' },
            { id: 'task-1-1-2', title: 'Filter & Search', status: 'todo' }
          ]
        },
        {
          id: 'story-1-2',
          title: 'View Event Details',
          description: 'As a user, I want to see event details',
          priority: 'must',
          order: 1,
          tasks: [
            { id: 'task-1-2-1', title: 'Detail page UI', status: 'todo' }
          ]
        }
      ]
    },
    {
      id: 'epic-2',
      title: 'Event Participation',
      description: 'Users can join and manage event participation',
      color: '#10B981',  // green
      order: 1,
      stories: [
        {
          id: 'story-2-1',
          title: 'Register for Event',
          description: 'As a user, I want to register for an event',
          priority: 'must',
          order: 0,
          tasks: [
            { id: 'task-2-1-1', title: 'Registration form', status: 'todo' },
            { id: 'task-2-1-2', title: 'Payment integration', status: 'todo' }
          ]
        },
        {
          id: 'story-2-2',
          title: 'Manage Bookings',
          description: 'As a user, I want to view and cancel my bookings',
          priority: 'should',
          order: 1,
          tasks: []
        }
      ]
    },
    {
      id: 'epic-3',
      title: 'Event Creation',
      description: 'Organizers can create and manage events',
      color: '#F59E0B',  // amber
      order: 2,
      stories: [
        {
          id: 'story-3-1',
          title: 'Create Event',
          description: 'As an organizer, I want to create a new event',
          priority: 'must',
          order: 0,
          tasks: [
            { id: 'task-3-1-1', title: 'Event form UI', status: 'todo' },
            { id: 'task-3-1-2', title: 'Image upload', status: 'todo' }
          ]
        }
      ]
    }
  ]
};
```

#### Story Map 渲染规则

1. **布局计算**：
   - Epic 卡片宽度：200px，间距：40px
   - Story 卡片宽度：180px，高度：根据内容自适应
   - Task 卡片宽度：160px，高度：固定 40px

2. **颜色编码**：
   - Epic 使用自定义颜色作为左边框
   - Story 优先级颜色：must(红)、should(橙)、could(黄)、wont(灰)
   - Task 状态颜色：todo(灰)、doing(蓝)、done(绿)

3. **层级连线**：
   - Epic 到 Story：垂直虚线
   - Story 到 Task：垂直实线（可折叠）

#### 交互能力
- SVG 渲染流程图元素
- "Edit" 按钮打开 WhiteboardModal
- 支持箭头、形状、文字、卡片
- Story Map 变体支持卡片拖拽重排
- **Epic 支持折叠/展开 Story 列表**
- **Story 支持折叠/展开 Task 列表**

#### 使用场景
- **User Flow**：页面跳转与交互逻辑
- **User Story Map**：产品范围与用户故事
- 系统架构图
- 流程决策树

### 3. Screen 节点

**用途**：展示可交互的 UI 原型  
**尺寸**：移动端 320x640 + 80，Web 端 1000x700 + 80  
**图标**：📱 Smartphone  
**颜色**：白底，设备边框

#### 数据结构
```typescript
interface ScreenData {
  htmlContent: string;     // HTML + Tailwind CSS
  screenName: string;
  variant?: 'mobile' | 'web';
  plan?: string;           // 设计思路（Markdown）
}
```

#### 交互能力
- iframe 渲染 HTML 内容
- "Run" 按钮全屏预览
- "Edit Plan" 编辑设计思路
- 支持内部导航（data-to 属性）

#### 使用场景
- 移动应用原型
- Web 应用界面
- 交互演示

### 4. Table 节点

**用途**：展示数据库表结构  
**尺寸**：280x320  
**图标**：🗄️ Table  
**颜色**：白底，黄色标题栏

#### 数据结构
```typescript
interface TableData {
  columns: string[];
  rows: Record<string, any>[];
}
```

#### 交互能力
- 表格预览（前 3 行）
- "Expand" 按钮打开 DatabaseModal 查看完整数据
- 显示行数统计

#### 使用场景
- 数据库表设计
- Mock 数据展示
- 数据模型可视化

### 5. Integration 节点

**用途**：表示第三方服务集成  
**尺寸**：320x240  
**图标**：⚡ Zap  
**颜色**：玫瑰色到粉色渐变

#### 数据结构
```typescript
interface IntegrationData {
  provider: string;        // 'SendGrid', 'Stripe'
  category: string;        // 'Email', 'Payment'
  description?: string;
  apiEndpoint?: string;
  requiredKeys?: string[]; // ['API_KEY', 'SECRET']
  documentation?: string;  // 文档链接
}
```

#### 交互能力
- 显示 provider 和 category
- 显示 API endpoint
- 显示所需环境变量
- "查看文档" 按钮打开外部链接
- "Edit" 按钮编辑配置

#### 使用场景
- 邮件服务（SendGrid）
- 支付服务（Stripe）
- 认证服务（Auth0）
- 存储服务（AWS S3）

### 6. API 节点（已移除，但保留代码）

**用途**：API 接口定义（当前版本未使用）  
**尺寸**：320x240  

### 7. Task 节点（已移除，但保留代码）

**用途**：任务清单（当前版本未使用）  
**尺寸**：240x160  

## 通用节点能力

### 1. 节点状态
```typescript
type NodeStatus = 'loading' | 'done' | 'error';
```
- **loading**：骨架屏动画
- **done**：正常显示内容
- **error**：错误状态（待实现）

### 2. 确认状态
```typescript
type ConfirmationStatus = 'pending' | 'confirmed' | 'revision_requested';
```
- **pending**：待确认状态
  - 节点显示橙色边框（`ring-2 ring-orange-500`）
  - 边框脉冲动画（`animate-pulse`）
  - 右上角显示「待确认」徽章
- **confirmed**：已确认状态
  - 节点边框变为绿色（`ring-2 ring-green-500`）
  - 徽章变为「已确认 ✓」
- **revision_requested**：需要修改
  - 节点边框变为红色
  - 显示修改说明

**需要确认的节点类型**：
- User Story Map（Whiteboard）
- User Flow（Whiteboard）
- PRD 文档（Document）

### 3. 节点定位
```typescript
interface BaseNode {
  id: string;
  type: NodeType;
  x: number;           // 画布坐标
  y: number;
  width?: number;      // 可选，自动计算
  height?: number;
  title: string;
  status: NodeStatus;
  sectionId?: string;  // 所属 Section ID
  confirmationStatus?: ConfirmationStatus;  // 确认状态（可选）
}
```

### 3. 节点交互

#### 拖拽
- 鼠标按下节点 → 记录偏移 → 移动鼠标更新位置
- 拖拽时显示蓝色高光和阴影
- 松开鼠标完成移动

#### 编辑
- 双击节点或点击 "Edit" 按钮
- 根据节点类型打开对应编辑器
- 编辑完成后更新节点数据

#### 运行（Screen 特有）
- 点击 "Run" 按钮
- 全屏显示原型内容
- 支持内部跳转

## 边系统 (Edges)

### 边的类型
```typescript
interface CanvasEdge {
  id: string;
  fromNode: string;     // 起始节点 ID
  toNode: string;       // 目标节点 ID
  type?: 'flow' | 'dependency' | 'data';
  label?: string;       // 连线标签
}
```

### 边的样式
| 类型 | 颜色 | 样式 | 语义 |
|------|------|------|------|
| dependency | 橙色 | 虚线 | 功能依赖 |
| data | 蓝色 | 实线 | 数据流动 |
| flow | 灰色 | 虚线 | 工作流 |

### 边的渲染
- 使用 SVG path 绘制
- 贝塞尔曲线连接节点中心
- 控制点：水平方向 50% 偏移

## 技术实现

### 关键文件
- `components/Canvas/nodes/DocumentNode.tsx`
- `components/Canvas/nodes/WhiteboardNode.tsx`
- `components/Canvas/nodes/ScreenNode.tsx`
- `components/Canvas/nodes/TableNode.tsx`
- `components/Canvas/nodes/IntegrationNode.tsx`
- `types.ts` - 所有节点类型定义

### 节点尺寸计算
```typescript
const getNodeDimensions = (node: CanvasNode) => {
  if (node.width && node.height) return { width: node.width, height: node.height };
  
  switch (node.type) {
    case NodeType.SCREEN:
      const isWeb = (node.data as ScreenData)?.variant === 'web';
      return {
        width: isWeb ? 1000 : 320,
        height: (isWeb ? 700 : 640) + 80
      };
    case NodeType.DOCUMENT: return { width: 450, height: 550 };
    case NodeType.WHITEBOARD: return { width: 850, height: 700 };
    case NodeType.TABLE: return { width: 280, height: 320 };
    case NodeType.INTEGRATION: return { width: 320, height: 240 };
    default: return { width: 400, height: 400 };
  }
};
```

### Section 边界计算
```typescript
const getSectionBounds = (nodes: CanvasNode[], padding = 120) => {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const { width, height } = getNodeDimensions(node);
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + width);
    maxY = Math.max(maxY, node.y + height);
  });
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + padding * 2,
    height: (maxY - minY) + padding * 2
  };
};
```

## 验收标准

- [ ] 所有节点类型正确渲染
- [ ] 节点拖拽流畅（60fps）
- [ ] 节点编辑按钮触发正确的编辑器
- [ ] Screen 节点的 Run 功能正常
- [ ] Section 自动包裹节点，无重叠
- [ ] 边的颜色和样式符合类型定义
- [ ] 边的标签文字清晰可读
- [ ] **Whiteboard 节点支持 Story Map 卡片墙布局**
- [ ] **待确认节点显示橙色脉冲边框**
- [ ] **已确认节点显示绿色边框和徽章**
- [ ] **点击确认徽章可触发确认交互**

## 未来优化

- [ ] 节点复制/粘贴
- [ ] 节点删除功能
- [ ] 节点对齐辅助线
- [ ] 节点批量操作
- [ ] 节点模板库
- [ ] 自定义节点类型
- [ ] 节点折叠/展开
- [ ] 节点搜索和过滤















