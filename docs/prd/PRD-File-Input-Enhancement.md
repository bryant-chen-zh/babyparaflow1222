# PRD: 文件输入多格式支持 (File Input Enhancement)

## 背景

- **现状**
    - 当前 paraflow 的输入仅支持了图片格式（PNG 和 JPG）。
    - 仅支持上传 5 张图片，不支持批量上传，每次仅支持上传 1 张。
- **存在的问题**：目前主流的 Vibe Coding 类工具几乎支持了大部分主流格式的输入。本期希望能够支持更多格式的输入以满足用户上下文传达的需求。

## 需求

### 希望支持的格式包括

- **更宽松的图片格式**：除了现有的 PNG 和 JPG 外，新增支持 Webp、SVG。
    - 单张 ≤ 10MB；支持拖拽上传或粘贴截图
- **文档格式**
    - .txt、.pdf、.json、.md
    - 注：文档文件会读取文本内容（PDF 除外）传递给 AI
- **代码文件格式**
    - .ts、.tsx、.js、.jsx、.css、.scss、.html、.vue、.py、.yaml/.yml
    - 注：代码文件会读取完整文本内容传递给 AI

### 涉及到要改动的地方

- **输入框**：上传图片 iconbutton → 上传图片和文件的 iconbutton (Paperclip 图标)
- **上传方式**
    - 支持点击、拖拽和复制粘贴上传（含屏幕截图）
    - 点击上传时，打开系统文件选择器
        - 支持批量多选上传
        - 鼠标拖入区域时，输入框区域高亮提示，文案为「Drop files here to add to message」
- **输入框显示及判断逻辑**
    - **上传中**：显示文件加载态，用无进度条的环状加载态
    - **上传后**：显示文件预览卡片（统一高度 64px）
        - **图片**：64x64 方形全幅缩略图
        - **文档**：横向卡片，左侧大图标，右侧文件名 + 格式标签
            - 文件名：截断展示
            - 文件格式：MD, PDF, TXT, JSON
        - **代码文件**：横向卡片，左侧语言图标，右侧文件名 + 语言标签
            - 图标颜色：TypeScript 蓝色、JavaScript 黄色、CSS 紫色、HTML 橙色、Vue 绿色、Python 天蓝、YAML 粉色
            - 语言标签：TypeScript, TSX, JavaScript, JSX, CSS, SCSS, HTML, Vue, Python, YAML
    - **展示规则**
        - 最多展示一行，超过时横向滚动展示
        - 右上角支持点击 x 按钮移除上传文件（悬浮不被裁剪）
- **校验逻辑**
    - **格式校验**：不支持的格式提示 `Unsupported file type. Please upload a supported format.`
    - **文件大小、数量校验**
        - 单文件：每个文件必须不超过 10MB，超过提示 `Each file must be smaller than 10MB.`
        - 数量校验：单次最多允许上传 10 个文件，超过则拒绝进入上传队列。`You may only upload up to 10 files at a time.`
        - 文件总和：当前上传队列中所有文件大小总和不得超过 100MB。`Total file size exceeds the 100MB limit.`
        - 用户上传重复文件时，重复校验，只保留最近上传的一个
        - **错误提示展示**：统一出现在页面上方的正中间区域（Toast 组件）
- **文件内容处理逻辑**
    - **图片**（png/jpg/jpeg/webp/svg）：通过 `FileReader.readAsDataURL` 生成 Base64 预览
    - **文本文件**（txt/md/json）：通过 `FileReader.readAsText` 读取完整内容，发送时传递给 AI
    - **代码文件**（ts/tsx/js/jsx/css/scss/html/vue/py/yaml/yml）：通过 `FileReader.readAsText` 读取完整内容，发送时传递给 AI
    - **PDF**：仅传递文件元数据（文件名、大小），内容解析交由后端处理
- **在 chat 中的展示逻辑**
    - 分为两行展示：图片行 + 文件行
        - **图片行**：缩略图展示，最大 120×120px，圆角边框，flex-wrap 自动换行
        - **文件行**：文档和代码文件合并展示，紧凑样式（小图标 20px + 文件名截断 16 字符）
    - 文档和代码文件按上传顺序混合展示，不再按类别分组
    - 图标颜色保持与输入框预览一致
    - 用户消息右对齐，AI 消息左对齐
- **发送行为逻辑**
    - 所有文件上传成功时，才可以正常发送
    - 有文件正在上传时，禁用发送按钮，hover 至发送按钮，tooltip 提示「File upload pending」
    - 发送时会将文本文件（txt/md/json）及代码文件（ts/tsx/js/jsx/css/scss/html/vue/py/yaml/yml）的内容一并传递给 AI
- **画布区**
    - 导入
        - 图片格式从 PNG/JPG 增加到 WebP 和 SVG
        - 其他文件格式导入暂时不支持
    - 交互
        - 画布 Pinch 缩放时，仅缩放画布内容，不触发布局缩放
- **其他逻辑**
    - 当前页面刷新会话后，不保留
    - 在一个 session 上传后，再新开标签页/会话，输入框不保留

