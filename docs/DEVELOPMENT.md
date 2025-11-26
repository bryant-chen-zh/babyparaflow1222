# 开发指南

## 环境准备

### 系统要求
- **Node.js**: 18.0.0 或更高
- **npm**: 9.0.0 或更高
- **操作系统**: macOS, Linux, Windows
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+

### 推荐工具
- **IDE**: VS Code, Cursor
- **Git**: 2.30.0+
- **终端**: iTerm2, Hyper, Windows Terminal

## 项目设置

### 1. 克隆项目
```bash
git clone https://github.com/Timsamapf/babyparaflow.git
cd babyparaflow
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本
```bash
npm run build
npm run preview  # 预览构建结果
```

## 项目结构详解

```
visual-coding-agent/
├── App.tsx                    # 主应用，状态管理和 Simulation 逻辑
├── types.ts                   # 所有 TypeScript 类型定义
├── constants.ts               # 布局常量和配置
├── index.tsx                  # 应用入口
├── index.html                 # HTML 模板
│
├── components/
│   ├── Canvas/                # 画布系统
│   │   ├── CanvasContainer.tsx      # 画布容器，视图控制
│   │   ├── PinMarker.tsx            # Pin 标注组件
│   │   └── nodes/                   # 所有节点类型
│   │       ├── DocumentNode.tsx     # 文档节点
│   │       ├── WhiteboardNode.tsx   # 白板节点
│   │       ├── ScreenNode.tsx       # 原型节点
│   │       ├── TableNode.tsx        # 数据表节点
│   │       ├── IntegrationNode.tsx  # 集成节点
│   │       ├── APINode.tsx          # API 节点（保留）
│   │       ├── TaskNode.tsx         # 任务节点（保留）
│   │       └── FlowNode.tsx         # 流程节点（未使用）
│   │
│   ├── Chat/                  # 聊天系统
│   │   └── ChatSidebar.tsx          # 聊天侧边栏
│   │
│   ├── Editor/                # 编辑器系统
│   │   ├── MarkdownModal.tsx        # Markdown 编辑器
│   │   ├── WhiteboardModal.tsx      # 白板编辑器
│   │   ├── DatabaseModal.tsx        # 数据库查看器
│   │   ├── IntegrationModal.tsx     # 集成配置编辑器
│   │   └── PinModal.tsx             # Pin 创建框
│   │
│   └── Preview/               # 预览系统
│       └── ImmersiveView.tsx        # 全屏预览
│
├── services/
│   └── geminiService.ts       # AI 服务（预留）
│
├── utils/
│   └── markdownUtils.ts       # Markdown 工具函数
│
├── docs/                      # 文档
│   ├── prd/                   # PRD 按功能模块
│   ├── DEVELOPMENT.md         # 本文件
│   └── AI_CODING_GUIDE.md     # AI 编程指南
│
└── dist/                      # 构建输出（ignored）
```

## 开发流程

### 1. 创建新分支
```bash
git checkout -b feature/your-feature-name
```

### 2. 进行开发
- 遵循现有代码风格
- 使用 TypeScript 严格模式
- 组件使用函数式 + Hooks

### 3. 提交代码
```bash
git add .
git commit -m "feat: add your feature description"
```

### 4. 推送和 PR
```bash
git push origin feature/your-feature-name
```

## 代码规范

### TypeScript
- 所有组件必须有类型定义
- Props 使用 interface 定义
- 避免使用 `any`，使用具体类型

### React
- 优先使用函数组件
- 使用 Hooks 管理状态
- 合理使用 `useMemo` 和 `useCallback` 优化性能
- 避免在 render 中创建函数

### 样式
- 使用 Tailwind utility classes
- 避免内联样式（除非动态计算）
- 统一使用 Tailwind 颜色系统

### 命名约定
- 组件文件：PascalCase（`CanvasContainer.tsx`）
- 工具函数：camelCase（`getNodeDimensions`）
- 常量：UPPER_SNAKE_CASE（`SECTION_IDS`）
- 类型/接口：PascalCase（`CanvasNode`）

## 常见开发任务

### 添加新的节点类型

1. **定义类型**（`types.ts`）
```typescript
export enum NodeType {
  // ...
  YOUR_NEW_TYPE = 'YOUR_NEW_TYPE'
}

export interface YourNewTypeData {
  // 数据结构
}
```

2. **创建组件**（`components/Canvas/nodes/YourNewTypeNode.tsx`）
```typescript
export const YourNewTypeNode: React.FC<{
  title: string;
  data: YourNewTypeData | null;
  loading: boolean;
  onEdit: () => void;
}> = ({ title, data, loading, onEdit }) => {
  // 实现
};
```

3. **添加到 CanvasContainer**
- 导入组件
- 在 `getNodeDimensions` 中添加尺寸
- 在节点渲染中添加条件分支

4. **创建编辑器**（如需要）
- 创建 Modal 组件
- 在 App.tsx 中添加状态和处理

### 修改 Simulation 流程

编辑 `App.tsx` 的 `runSimulation` 函数：
- 调整时序延迟
- 修改摄像机路径
- 更改节点位置
- 更新 Mock 数据

### 调整布局

编辑 `constants.ts`：
- 修改 Section 偏移
- 调整节点间距
- 更改初始缩放

## 调试技巧

### 1. 查看状态
在 React DevTools 中查看：
- `nodes` 数组
- `view` 对象
- `messages` 数组

### 2. 控制台日志
```typescript
console.log('Current view:', view);
console.log('Nodes:', nodes);
```

### 3. 跳过 Simulation
临时注释掉部分阶段快速测试后续内容

### 4. 调整速度
修改 `setTimeout` 延迟时间加速/减速演示

## 性能优化

### 1. 使用 React.memo
```typescript
export const NodeComponent = React.memo<Props>(({ ... }) => {
  // ...
});
```

### 2. 避免不必要的重渲染
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存函数引用

### 3. 虚拟化长列表
考虑使用 `react-window` 或 `react-virtualized`

## Git 工作流

### 分支策略
- `main` - 生产环境
- `develop` - 开发环境
- `feature/*` - 新功能
- `bugfix/*` - Bug 修复
- `hotfix/*` - 紧急修复

### Commit Message 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `style`: 格式（不影响代码运行）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具

示例：
```
feat(canvas): add zoom to center functionality

- Modified handleWheel to zoom around viewport center
- Updated zoomIn/zoomOut buttons to use same logic
- Improved user experience when zooming

Closes #123
```

## 常见问题

### Q: 如何添加新的 Section？
A: 在 `constants.ts` 的 `SECTION_IDS` 中添加，然后在 `CanvasContainer.tsx` 中添加渲染逻辑。

### Q: 如何修改节点默认尺寸？
A: 编辑 `CanvasContainer.tsx` 中的 `getNodeDimensions` 函数。

### Q: Simulation 不运行怎么办？
A: 检查浏览器控制台错误，确认 Mock 数据完整。

### Q: 如何禁用某个 Act？
A: 在 `runSimulation` 中注释掉对应的 Phase 代码块。

### Q: 如何调试摄像机位置？
A: 在 `panTo` 调用前后添加 console.log，或在右下角查看坐标。

## 资源链接

- [React 文档](https://react.dev)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite 指南](https://vitejs.dev/guide/)
- [Lucide Icons](https://lucide.dev)




