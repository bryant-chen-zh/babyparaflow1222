# 预览系统 (Preview System)

## 功能概述

预览系统提供全屏沉浸式的原型查看体验，让用户可以像真实应用一样点击和导航 Screen 节点的内容。

## 用户场景

### 场景 1：演示原型给客户
**角色**：设计师  
**目标**：展示高保真交互原型  
**操作**：点击 Screen 节点的 Run 按钮，全屏演示，点击界面内按钮跳转页面

### 场景 2：测试原型流程
**角色**：产品经理  
**目标**：验证用户流程是否合理  
**操作**：在预览模式中点击导航，体验完整用户旅程

### 场景 3：快速返回编辑
**角色**：设计师  
**目标**：发现问题后立即修改  
**操作**：按 Esc 或点击关闭按钮退出预览，返回画布编辑

## 核心功能

### 1. 沉浸式全屏预览

#### 1.1 界面特征
- **层级**：z-index: 100（最高层）
- **布局**：全屏覆盖画布和侧边栏
- **背景**：白色（模拟真实应用）
- **动画**：淡入 + 从底部滑入

#### 1.2 预览模式
- **移动端模式**：居中显示，手机边框样式
  - 尺寸：320x640
  - 圆角、阴影、顶部刘海
- **Web 端模式**：接近全屏显示
  - 尺寸：1000x700+
  - 浏览器窗口样式

### 2. 内容渲染

#### 2.1 HTML 注入
```typescript
<div dangerouslySetInnerHTML={{ __html: screenData.htmlContent }} />
```

#### 2.2 样式隔离
- 使用 iframe（可选，当前未使用）
- 依赖 Tailwind utility-first 特性避免冲突

#### 2.3 交互支持
- 内部按钮可点击
- 滚动正常工作
- 表单输入可用（非持久化）

### 3. 导航系统

#### 3.1 页面跳转机制
使用 `data-to` 属性标记可导航元素：

```html
<button data-to="node-screen-2">Go to Explore</button>
```

#### 3.2 导航监听
```typescript
useEffect(() => {
  const handleNavigation = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const navTarget = target.closest('[data-to]');
    if (navTarget) {
      const targetId = navTarget.getAttribute('data-to');
      onNavigate(targetId);
    }
  };
  
  container.addEventListener('click', handleNavigation);
  return () => container.removeEventListener('click', handleNavigation);
}, []);
```

#### 3.3 跳转效果
- 无动画，直接切换
- 保持预览模式（不返回画布）
- 支持多级跳转

### 4. 控制界面

#### 4.1 顶部 Header
```
┌──────────────────────────────────────┐
│ ← Back to Canvas     [Screen Name]  ✕│
└──────────────────────────────────────┘
```

- **Back 按钮**：返回画布
- **Screen 名称**：当前页面标识
- **关闭按钮**：退出预览

#### 4.2 快捷键
- **Esc**：退出预览
- **←/→**：上一页/下一页（待实现）

### 5. 响应式适配

#### 5.1 移动端预览
- 固定宽度 320px
- 居中显示
- 添加设备边框和刘海
- 支持滚动（overflow-y: auto）

#### 5.2 Web 端预览
- 宽度 1000px 或接近全屏
- 顶部留白 Header 空间
- 支持响应式布局

## 界面设计

### 移动端预览样式
```
┌────────────────────────────────────┐
│     ← Back    Home Screen      ✕   │
├────────────────────────────────────┤
│                                    │
│    ┌──────────────────┐            │
│    │                  │            │
│    │   📱 Mobile      │            │
│    │   [320x640]      │            │
│    │                  │            │
│    │   [Content]      │            │
│    │                  │            │
│    └──────────────────┘            │
│                                    │
└────────────────────────────────────┘
```

### Web 端预览样式
```
┌────────────────────────────────────┐
│   ← Back    Dashboard          ✕   │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │   💻 Web Content [1000x700]   │ │
│ │                                │ │
│ │   [Full width content]         │ │
│ │                                │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

## 技术实现

### 关键文件
- `components/Preview/ImmersiveView.tsx`

### Props 接口
```typescript
interface ImmersiveViewProps {
  data: ScreenData;
  onClose: () => void;
  onNavigate: (targetId: string) => void;
}
```

### 状态管理（App.tsx）
```typescript
const [runningScreenId, setRunningScreenId] = useState<string | null>(null);

// 获取当前预览的 Screen 数据
const getRunningScreenData = () => {
  const node = nodes.find(n => n.id === runningScreenId);
  return node && node.type === NodeType.SCREEN 
    ? node.data as ScreenData 
    : null;
};
```

### 导航实现
```typescript
const handleNavigate = (targetId: string) => {
  setRunningScreenId(targetId);  // 直接切换到新 Screen
};
```

### 安全考虑
- 使用 `dangerouslySetInnerHTML` 注入 HTML
- **风险**：XSS 攻击
- **当前缓解**：Mock 数据可控
- **未来**：需要内容清洗和沙箱隔离

## 验收标准

- [ ] Screen 节点点击 Run 后正确全屏显示
- [ ] 移动端和 Web 端样式正确适配
- [ ] 内部按钮的 data-to 导航正常工作
- [ ] Back 按钮返回画布，状态正确
- [ ] Esc 键可退出预览
- [ ] 预览时侧边栏和工具栏被完全覆盖
- [ ] 滚动在预览内容中正常工作

## 未来优化

- [ ] iframe 隔离（安全性）
- [ ] 响应式设备切换（iPhone/iPad/Desktop）
- [ ] 屏幕录制功能
- [ ] 分享预览链接（独立 URL）
- [ ] 评论和标注功能（在预览中）
- [ ] 触摸手势支持（移动设备）
- [ ] 前进/后退历史
- [ ] 热重载（编辑时实时预览）
- [ ] 多设备同步预览




