# AI Coding 指南

## 概述

本指南帮助你使用 AI 编程工具（如 Cursor, GitHub Copilot, ChatGPT）基于 PRD 文档快速迭代开发 Visual Coding Agent。

## 使用 PRD 文档

### PRD 文档结构
```
docs/prd/
├── 01-overview.md           # 产品概述
├── 02-canvas-system.md      # 画布系统
├── 03-node-system.md        # 节点系统
├── 04-chat-system.md        # 聊天系统
├── 05-editor-system.md      # 编辑器系统
├── 06-preview-system.md     # 预览系统
└── 07-workflow-engine.md    # 工作流引擎
```

### 如何使用

1. **明确需求**：先确定要开发的功能属于哪个模块
2. **阅读 PRD**：打开对应的 PRD 文档了解功能细节
3. **生成任务**：基于 PRD 向 AI 提问或生成代码
4. **迭代开发**：根据反馈调整和优化

## AI Prompt 模板

### 模板 1：实现新功能

```
我正在开发 Visual Coding Agent 项目。

需求：[功能描述]

参考文档：docs/prd/[模块编号]-[模块名].md

相关文件：
- [文件路径1]
- [文件路径2]

请帮我实现这个功能，保持与现有代码风格一致。
```

### 模板 2：优化现有功能

```
我需要优化 Visual Coding Agent 的 [模块名]。

当前问题：[问题描述]

期望效果：[期望结果]

参考 PRD：docs/prd/[模块编号]-[模块名].md 中的"未来优化"部分

请提供优化方案。
```

### 模板 3：修复 Bug

```
在 Visual Coding Agent 中发现一个 Bug：

模块：[模块名]
现象：[Bug 描述]
复现步骤：[步骤]
相关文件：[文件路径]

参考 PRD：docs/prd/[模块编号]-[模块名].md

请帮我定位和修复这个问题。
```

### 模板 4：添加新节点类型

```
我要为 Visual Coding Agent 添加一个新的节点类型：[节点名]

功能描述：[描述]
数据结构：[结构说明]
交互需求：[交互说明]

参考文档：docs/prd/03-node-system.md 中的"添加新节点类型"部分

请帮我实现完整的节点类型，包括：
1. 类型定义（types.ts）
2. 节点组件（components/Canvas/nodes/）
3. 编辑器（如需要）
4. CanvasContainer 集成
```

## 常见开发场景

### 场景 1：优化画布性能

**目标**：支持 1000+ 节点而不卡顿

**Prompt 示例**：
```
参考 docs/prd/02-canvas-system.md 的"性能优化"部分，
我需要为 CanvasContainer 实现虚拟化渲染。

当前节点渲染逻辑在：
components/Canvas/CanvasContainer.tsx 第 570-601 行

请帮我实现虚拟化，只渲染视口内可见的节点。
```

### 场景 2：添加 Markdown 预览

**目标**：Markdown 编辑器支持实时预览

**Prompt 示例**：
```
参考 docs/prd/05-editor-system.md 的"Markdown 编辑器"部分，
我要为 MarkdownModal 添加分屏预览功能。

当前文件：components/Editor/MarkdownModal.tsx

需求：
1. 左侧编辑，右侧预览
2. 实时渲染 Markdown
3. 滚动同步

推荐使用 react-markdown 库。
```

### 场景 3：实现真实 AI 生成

**目标**：用 Gemini API 替换 Mock 数据

**Prompt 示例**：
```
参考 docs/prd/07-workflow-engine.md 的"AI 集成计划"部分，
我要接入真实的 Gemini API。

预留代码在：services/geminiService.ts

需要修改：
1. App.tsx 的 runSimulation 函数
2. 将 MOCK_LUMA_DATA 替换为 API 调用
3. 添加 loading 状态和错误处理

我的 API Key 已在 .env.local 中配置。
```

### 场景 4：添加协作功能

**目标**：支持多人实时编辑

**Prompt 示例**：
```
我要为 Visual Coding Agent 添加多人协作功能。

参考：docs/prd/02-canvas-system.md 的"未来优化"部分

技术方案建议：
- 使用 WebSocket 或 Yjs
- 实现游标同步
- 冲突解决策略

请先给我技术方案设计。
```

## 使用 Cursor 的最佳实践

### 1. 利用 Composer
- 一次性生成多个相关文件
- 示例：创建节点类型时同时生成组件、类型定义、编辑器

### 2. 利用 Chat
- 询问架构问题
- 代码审查和优化建议
- 调试帮助

### 3. 利用 Inline Edit
- 快速修改单个函数
- 调整样式
- 修复小 bug

### 4. 引用 PRD
在 Cursor Chat 中，使用 `@docs/prd/` 直接引用 PRD 文档

## 测试策略

### 手动测试检查清单

#### 画布系统
- [ ] 缩放流畅（0.1x - 3x）
- [ ] 平移无卡顿
- [ ] Section 正确分组
- [ ] 工具切换正常

#### 节点系统
- [ ] 所有节点类型正确渲染
- [ ] 拖拽流畅
- [ ] 编辑功能正常
- [ ] Screen 预览正常

#### 聊天系统
- [ ] Simulation 完整运行
- [ ] Plan Steps 状态正确
- [ ] 侧边栏展开/折叠正常

#### 编辑器系统
- [ ] 所有编辑器正确打开
- [ ] 保存功能正常
- [ ] 取消不丢失原数据

### 性能测试
- [ ] 100 个节点时 FPS > 30
- [ ] 内存使用稳定
- [ ] 长时间运行无内存泄漏

## 部署流程

### 开发环境
```bash
npm run dev
```

### 预生产测试
```bash
npm run build
npm run preview
```

### 生产部署（Vercel）
```bash
# 方式 1：自动部署（推荐）
git push origin main  # Vercel 自动检测并部署

# 方式 2：手动部署
npx vercel --prod
```

### 环境变量
如果接入真实 AI，需要在 Vercel 设置：
- `GEMINI_API_KEY` - Google Gemini API 密钥

## 故障排查

### 问题：画布空白
- 检查控制台错误
- 确认 `LAYOUT_CENTER_X/Y` 设置合理
- 检查 `view` 初始状态

### 问题：节点无法拖拽
- 检查 `activeTool` 是否为 'SELECT'
- 确认鼠标事件没有被阻止
- 检查 `.canvas-node` class 是否正确

### 问题：Simulation 卡住
- 检查 `async/await` 是否正确
- 确认没有死循环
- 检查 `updatePlanStatus` 调用正确

### 问题：编辑器无法保存
- 检查状态更新逻辑
- 确认节点 ID 匹配
- 检查数据结构类型

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交清晰的 commit
4. 推送到你的 fork
5. 创建 Pull Request
6. 等待 Code Review

### PR 检查清单
- [ ] 代码遵循规范
- [ ] 无 TypeScript 错误
- [ ] 无 console.log（除非必要）
- [ ] 功能完整测试
- [ ] 更新相关文档

## 学习资源

### 项目架构
- 阅读 `docs/prd/01-overview.md` 了解整体架构
- 按模块阅读其他 PRD 文档

### React + TypeScript
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Hooks 完全指南](https://overreacted.io/a-complete-guide-to-useeffect/)

### Tailwind CSS
- [Tailwind 文档](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com/) - 组件示例

### Canvas 技术
- [CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [Canvas 坐标系统](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)

## 联系方式

- GitHub Issues: [提交问题](https://github.com/Timsamapf/babyparaflow/issues)
- Discussions: [讨论区](https://github.com/Timsamapf/babyparaflow/discussions)




