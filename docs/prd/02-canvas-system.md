# 画布系统 (Canvas System)

## 功能概述

画布系统是 Visual Coding Agent 的核心交互层，提供无限的 2D 空间用于组织和展示所有内容。

## 用户场景

### 场景 1：探索完整产品规划
**角色**：产品经理  
**目标**：查看从需求到实现的完整流程  
**操作**：使用手型工具拖拽画布，缩放查看不同层次的内容

### 场景 2：组织内容分组
**角色**：架构师  
**目标**：将相关节点分组管理  
**操作**：拖拽 Section 标题移动整组节点，调整 Section 主题色

### 场景 3：添加标注
**角色**：设计师  
**目标**：在某个节点旁添加设计注释  
**操作**：切换到 Pin 工具，点击画布创建标注

## 核心功能

### 1. 无限画布

#### 1.1 视图控制
- [x] 平移（Pan）
  - 手型工具拖拽
  - 空格键 + 拖拽
  - 滚轮平移（无修饰键）
- [x] 缩放（Zoom）
  - Ctrl/Cmd + 滚轮
  - +/- 快捷键
  - 工具栏按钮
  - 缩放中心：视口中心（不跟随鼠标）
- [x] 缩放范围：0.1 - 3.0x

#### 1.2 画布坐标系
- 使用 CSS Transform 实现
- 中心锚点：(2000, 1500) 世界坐标
- 初始缩放：0.3x

### 2. Section 自动分组

#### 2.1 Section 定义
Section 是节点的逻辑分组，自动计算边界框包裹相关节点。

当前 Section 类型：
- **Documents & Specs**（蓝色）- 产品文档区
- **Logic & Flow**（紫色）- 流程图区
- **Prototype**（绿色）- 前端原型区
- **Backend Development**（橙色）- 后端规划区

#### 2.2 Section 能力
- [x] 自动计算边界（基于包含节点）
- [x] 拖拽 Section 标题移动整组
- [x] 编辑 Section 标题
- [x] 切换 Section 主题色（6种颜色）
- [x] Padding: 120px

#### 2.3 手动 Section
- [x] 用户可绘制自定义 Section
- [x] 手动 Section 不自动调整大小

### 3. Pin 标注系统

#### 3.1 Pin 功能
- [x] 在画布任意位置添加文字标注
- [x] Pin 跟随画布缩放
- [x] 删除 Pin
- [ ] 编辑已有 Pin（待实现）
- [ ] Pin 吸附到节点（待实现）

#### 3.2 Pin 创建流程
1. 切换到 Pin 工具（P 键）
2. 点击画布位置
3. 在弹窗中输入内容
4. 保存后在画布上显示为黄色标记

### 4. 边/连线系统

#### 4.1 边的类型
- **dependency**（橙色虚线）：依赖关系（如 Screen → Database）
- **data**（蓝色实线）：数据流（如 API → Table）
- **flow**（灰色虚线）：工作流（如 Task → API）

#### 4.2 边的渲染
- 使用贝塞尔曲线（cubic bezier）
- 自动计算节点中心点
- 支持标签文字

#### 4.3 边的创建
- 当前：AI 自动生成
- 未来：手动拖拽创建（已移除）

### 5. 工具栏

#### 5.1 主工具栏（底部居中）
- **选择工具** (V) - 选择和拖拽节点
- **手型工具** (H) - 平移画布
- **Pin 工具** (P) - 创建标注
- **+ 菜单** - 创建新节点
  - Section
  - Document
  - Chart
  - Table
  - Integration

#### 5.2 控制面板（右下角）
- 放大按钮
- 缩小按钮
- 缩放比例显示（实时更新）

### 6. 交互模式

#### 6.1 节点拖拽
- 点击节点，拖拽到新位置
- 拖拽时显示蓝色高光
- 自动更新 Section 边界

#### 6.2 Section 拖拽
- 点击 Section 标题的拖拽图标
- 同时移动该 Section 内所有节点
- 使用批量更新优化性能

#### 6.3 绘制模式
- 选择创建工具后，鼠标变为十字
- 拖拽绘制矩形区域
- 松开鼠标创建节点/Section
- 最小尺寸限制：50x50

## 技术实现

### 关键文件
- `components/Canvas/CanvasContainer.tsx` - 主容器组件
- `constants.ts` - 布局常量
- `types.ts` - CanvasView, CanvasSection 等类型

### 状态管理
```typescript
const [view, setView] = useState<CanvasView>({
  x: number,  // 视图偏移 X
  y: number,  // 视图偏移 Y
  scale: number  // 缩放比例
});

const [activeTool, setActiveTool] = useState<CanvasTool>('SELECT');
const [nodes, setNodes] = useState<CanvasNode[]>([]);
const [edges, setEdges] = useState<CanvasEdge[]>([]);
const [pins, setPins] = useState<CanvasPin[]>([]);
```

### 坐标转换
```typescript
// 屏幕坐标 → 画布坐标
const canvasX = (clientX - view.x) / view.scale;
const canvasY = (clientY - view.y) / view.scale;
```

### 性能优化
- 使用 `useMemo` 缓存 Section 边界计算
- 使用 CSS Transform 而非重绘
- 拖拽时使用 `requestAnimationFrame`（待优化）

## 验收标准

- [ ] 画布可平滑缩放（0.1x - 3x）
- [ ] 缩放中心固定在视口中心
- [ ] Section 自动包裹节点，padding 正确
- [ ] 拖拽 Section 时所有节点同步移动
- [ ] Pin 标注在缩放时保持可读性
- [ ] 工具栏按钮高亮正确反映当前工具
- [ ] 快捷键正确响应（不影响输入框）

## 未来优化

- [ ] 虚拟化渲染（支持 1000+ 节点）
- [ ] Minimap 缩略图导航
- [ ] 网格吸附
- [ ] 多选节点（框选）
- [ ] 撤销/重做
- [ ] 画布历史记录
- [ ] 触摸板手势支持




