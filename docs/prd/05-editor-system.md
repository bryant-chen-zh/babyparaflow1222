# 编辑器系统 (Editor System)

## 功能概述

编辑器系统为不同类型的节点提供专门的编辑界面，支持内容创建和修改。所有编辑器都采用全屏模态框形式。

## 编辑器类型

### 1. Markdown 编辑器

**用途**：编辑 Document 节点和 Screen 节点的 Plan  
**文件**：`components/Editor/MarkdownModal.tsx`

#### 功能
- [x] 全屏编辑界面
- [x] 文本域输入
- [x] 实时字数统计
- [x] 保存/取消按钮
- [ ] Markdown 预览（待实现）
- [ ] 语法高亮（待实现）
- [ ] 快捷工具栏（加粗、斜体、列表等）

#### 界面元素
- **Header**：标题 + 返回按钮 + 保存按钮
- **Content**：大文本域（支持滚动）
- **Footer**：字数统计

#### 交互流程
1. 双击 Document 节点或点击 Edit
2. 打开全屏模态框
3. 在文本域中编辑 Markdown
4. 点击 Save 保存，或 Back 取消
5. 关闭模态框，节点内容更新

### 2. Whiteboard 编辑器

**用途**：编辑 Whiteboard 节点的图表元素  
**文件**：`components/Editor/WhiteboardModal.tsx`

#### 功能
- [x] 全屏画布编辑器
- [x] 添加形状（矩形、圆形、菱形）
- [x] 添加箭头连线
- [x] 添加文字
- [x] 选择和删除元素
- [x] 拖拽移动元素
- [ ] 调整元素大小（待实现）
- [ ] 元素颜色选择器
- [ ] 撤销/重做

#### 工具栏
- 选择工具
- 矩形工具
- 圆形工具
- 菱形工具
- 箭头工具
- 文字工具
- 删除工具

#### 交互流程
1. 点击 Whiteboard 节点的 Edit
2. 打开全屏白板编辑器
3. 选择工具绘制元素
4. 点击 Save 保存修改
5. 白板节点更新渲染

### 3. Database 查看器

**用途**：查看 Table 节点的完整数据  
**文件**：`components/Editor/DatabaseModal.tsx`

#### 功能
- [x] 全屏表格显示
- [x] 显示所有列和行
- [x] 行数和列数统计
- [x] 鼠标悬停高亮行
- [ ] 列排序（待实现）
- [ ] 数据筛选（待实现）
- [ ] 数据编辑（待实现）
- [ ] 导出 CSV（待实现）

#### 界面元素
- **Header**：表名 + 返回按钮 + 关闭按钮
- **Table**：完整数据表格
- **Footer**：统计信息（X rows × Y columns）

#### 交互流程
1. 点击 Table 节点的 Expand
2. 全屏显示表格数据
3. 滚动查看所有数据
4. 点击 Close 返回画布

**注意**：当前为只读模式，不支持编辑

### 4. Integration 编辑器

**用途**：配置第三方服务集成  
**文件**：`components/Editor/IntegrationModal.tsx`

#### 功能
- [x] 编辑 provider 名称
- [x] 选择 category（Email, Payment, Auth, Storage, Calendar, Maps, Analytics）
- [x] 编辑描述
- [x] 编辑 API endpoint
- [x] 管理 Required Keys（添加/删除）
- [x] 编辑 documentation URL
- [x] 预设模板快速创建

#### 预设模板
- SendGrid (Email)
- Stripe (Payment)
- Auth0 (Authentication)
- AWS S3 (Storage)
- Google Calendar (Calendar)
- Google Maps (Maps)

#### 交互流程
1. 双击 Integration 节点
2. 打开编辑表单
3. 手动填写或选择预设模板
4. 动态添加/删除 Required Keys
5. 保存更新节点数据

### 5. Pin 编辑器

**用途**：创建画布标注  
**文件**：`components/Editor/PinModal.tsx`

#### 功能
- [x] 浮动小窗口（非全屏）
- [x] 文本输入
- [x] 相关节点选择（待完善）
- [x] 保存创建 Pin

#### 交互流程
1. 切换到 Pin 工具（P 键）
2. 点击画布位置
3. 在浮动窗口输入标注内容
4. 保存后在画布上显示黄色 Pin 标记

## 编辑器通用设计

### 模态框样式
- 全屏覆盖（z-index: 100）
- 白色背景
- 滑入动画（从底部）
- 顶部固定 Header
- 中间滚动内容区
- 统一的返回和保存按钮

### Header 结构
```
┌──────────────────────────────────────┐
│ ← Back  │  🔧 Editor: Title  │  💾 Save │
└──────────────────────────────────────┘
```

### 颜色系统
每个编辑器使用特定主题色：
- Markdown：蓝色
- Whiteboard：紫色
- Database：琥珀色
- Integration：玫瑰色
- Pin：黄色

## 技术实现

### 状态管理（App.tsx）
```typescript
const [editingDocId, setEditingDocId] = useState<string | null>(null);
const [editingWhiteboardId, setEditingWhiteboardId] = useState<string | null>(null);
const [editingTableId, setEditingTableId] = useState<string | null>(null);
const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);
```

### 编辑触发
```typescript
const handleEditNode = (id: string) => {
  const node = nodes.find(n => n.id === id);
  if (!node) return;
  
  switch (node.type) {
    case NodeType.DOCUMENT:
      setEditingDocId(id);
      break;
    case NodeType.WHITEBOARD:
      setEditingWhiteboardId(id);
      break;
    case NodeType.SCREEN:
      setEditingDocId(id); // 复用 Markdown 编辑器
      break;
    case NodeType.TABLE:
      setEditingTableId(id);
      break;
    case NodeType.INTEGRATION:
      setEditingIntegrationId(id);
      break;
  }
};
```

### 数据保存
```typescript
const handleSave = (newData: any) => {
  setNodes(prev => prev.map(n => 
    n.id === editingNodeId 
      ? { ...n, data: newData } 
      : n
  ));
  closeEditor();
};
```

## 验收标准

- [ ] 所有编辑器正确打开和关闭
- [ ] 编辑内容正确保存到节点
- [ ] 取消操作不保存更改
- [ ] 模态框动画流畅
- [ ] 输入框/文本域正确聚焦
- [ ] Integration 预设模板正确填充
- [ ] Pin 创建后正确显示在画布

## 未来优化

### Markdown 编辑器
- [ ] 分屏预览（编辑 + 预览）
- [ ] 快捷工具栏
- [ ] 图片上传
- [ ] 模板插入

### Whiteboard 编辑器
- [ ] 元素分组
- [ ] 图层管理
- [ ] 对齐辅助线
- [ ] 元素复制/粘贴
- [ ] 导出为 SVG/PNG

### Database 查看器
- [ ] 行内编辑
- [ ] 添加/删除行
- [ ] 列类型定义
- [ ] SQL 查询预览
- [ ] 索引和约束配置

### Integration 编辑器
- [ ] API 测试功能
- [ ] OAuth 配置向导
- [ ] Webhook 配置
- [ ] 更多预设模板

### 通用优化
- [ ] 快捷键支持（Cmd+S 保存）
- [ ] 自动保存草稿
- [ ] 编辑历史
- [ ] 协作编辑（多人）




