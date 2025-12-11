# Paraflow define 流程调整

## 当前版本的感受

- 当前的 Paraflow，没有澄清需求的过程，没有明确地表达工作内容和范围。
- 虽然有很多中间产物，但是没有用户关键的「确认」，很容易与预期产生不符。
- Prototype 的结果非常完整，用户可能会对着最后完整的页面手足无措，不知从何改起，也并改不动。

## 可能需要回答的问题 from Max

**过去 Paraflow 做的是 Define + Design，Define 基本不停，但能相对较快看到 Design 结果。Define 是后续回顾的内容，用户看完感受可能还行。现在 Paraflow 做的是 Define + Design（Prototype）+ Build（Working App）。
这里面的区别是什么？为什么会感觉现在的 Define 不合适了？**

原本的 Design 更轻量、交付明确，可以直接修改。现在的 Prototype 耗时更长、更整体，更重，在面对一个完整 应用 后，可能无从改起，修改的心智成本变高。这时看到「不及预期的结果」，回头看「一开始过于主动但跑偏」的 Define 产物，用户不由得生出一股不满情绪。

另外过往的 define 产物主要是文档，阅读效率低（不易确认）。但目前增加了 Whiteboard 后，阅读效率增加了，用户有能力确认内容，这时过于自主后的跑偏感受会更差。

---

**现在 Paraflow 做的是 Define + Design（Prototype）+ Build（Working App）。用户的工作流程应该是什么呢？
一种逻辑是说，Define：先简单确认要做的事情（类似 Lovable 和 Replit 的 chat）；之后进 Design，用户在这里可能还会有大的调整；最终确认之后，开始 Build。
还有一种是，上来先少量信息就 Fast Prototype，确认 Prototype 之后，写相对完整的文档，为了后续更好的 Build。
后者类似产品经理做事情的方式，先用 AI 整个 Fast Prototype，然后开始填肉。（1-5-9？）**

我的倾向是：

- 更 MVP 更小的任务切分（Fast Prototype），更频繁的握手澄清。
- Define = Plan mode，Define 的过程就是在握手澄清并切分任务。Define 后的任务可能是 Design（Prototype），也可能是 Build （Working app）。
- 在一次次 Define - Design 或者 Define - Build 的循环中，完成 1-5-9 的迭代和更新。

## 主要改动

1. Define 就是 Plan，以 Define 的产物为底构建每一次任务的循环。
    1. section 也需要修改，可能就叫 Define or Plan。
2. 将任务变成更 MVP 更小的任务，让 Fast Prototype (only 1 Happy path) 能更快出现。（当然用户可以补充）
3. 握手澄清机制。拒绝“猜测式执行”，在动手前，通过 **握手** 确保 Agent 对目标和范围的认知完全一致。

---

## 核心流程

![image.png](Paraflow%20define%20%E6%B5%81%E7%A8%8B%E8%B0%83%E6%95%B4/image.png)

---

## 步骤拆解：以 Define 为 Plan 的小循环

### Step 0：握手 & 切小任务（还没进入 1/5/9，只在对齐任务）

**目标：严禁「猜测式执行」，先把这一次要做的事切成一个小 MVP。**

- 用户扔进来的是大需求：
    
    > 「做一个酒店预订 web app」
    > 
- Agent 不直接开干，而是做一件事：**主动总结 +反问，完成握手**：
    - 解决什么问题？
    - 目标用户？
    - MVP 还是相对完整？（例如「搜索+预订+支付的一条 happy path」）
- 产物：
    - Product charter：目标、解决什么问题、什么做什么不做。
    - Persona：目标用户。

这个任务声明还不是 D1，但下一步的 D1 会完全基于它。

---

### Step 1：Define L1（D1）= MVP Card Plan

**Define = Plan，从这里开始生效。**

Agent 把 Step 0 的握手结果，固化成一个最小的 **D1：MVP 卡片**，比如结构：

- Goal：这轮要达成的目标（一句话）
- User / Context：谁、在什么场景用
- 1 条 Happy path 的 User Stories 和 User Flow（只考虑这轮的 MVP）
- 核心功能说明 PRD

然后再 **来一次轻量握手**：

✅ 当用户点头，这个 D1 就变成 **本轮的 Plan / Source of Truth**，

S1 只能按这个来，不许乱漂移。

---

### Step 2：Design L1（S1）= Fast Prototype（只有 1 条 Happy Path）

有了 D1 之后，才进 S1：

- Agent 根据 User Stories + User flow，画出 **一条完整 happy path 的原型**：
    - 只覆盖这轮 MVP 的 Story（例如搜索→详情→预订→支付成功）
    - 不去展开所有「可能会用到的界面」，而是保证从头到尾能走通一次

在这一步，你的新规则是：

- **任务刻意变小**：只实现 one vertical slice，不追求功能面铺满
- 目的不是一次性搞定产品，而是**让用户尽快看到「有一条能走通的路」**

之后，用户可以：

- 在 Prototype 上提意见；
- 也可以回到「Define」层，补新的 Story 或 Non-goals。

---

### Step 3：从 S1 回到 Define L5（D5）——结构化 Plan

当用户觉得 S1 的方向对了，就进入「**Define 升级为 L5**」阶段：

- Agent 从 S1 的原型中，抽取和补全：
    - MVP 的 Story Map：这轮到底包含哪些活动 / 任务
    - User Flow：当前 happy path 的每一步
    - PRD 核心模块说明：例如「搜索模块」「预订模块」「支付模块」的职责/关系

这一步是把「好像能用的原型」整理成「更稳的结构化 Plan」，也就是 D5。

再次握手：

- Agent 把这版 Story Map + Flow 卡片展示给用户，问：
    - 「这轮只做这些模块和这条 Flow」
    - 「有没有一定要进来的 Story？」

✅ **D5 一旦被确认，就变成 S5 的 Plan**。

S1 里那些「随手画的」如果跟 D5 不一致，以 D5 为准。

---

### Step 4：Design L5（S5）——结构化 Prototype

基于 D5：

- Agent 生成 / 更新 **S5：更结构化的 Prototype**：
    - Screen 结构更清晰（每个 Story/模块对应哪些界面）
    - 页面之间的 Flow 更严谨（不乱来）
    - 开始暴露出细节问题：比如字段不够、文案不清、状态没定义

S5 做完以后，可能会出现两种选择：

1. 用户觉得方向还不稳 → 再在 **D5 ↔ S5** 之间转几圈（纯 Design 循环），先不 Build。
2. 用户觉得「够了，先做一点东西出来」→ 进入下一步：**为 Build 新开一个 Define 任务（D9）**。

---

### Step 5：Define L9（D9）= Build Task Plan

这一步是你前面说的关键转折：

> 开始 Build 的时候，需要有新的 Define（task），来指导 Build。
> 

所以：

- **D1 / D5 是「为 Design 服务的 Plan」**；
- **D9 是「为 Build 服务的 Plan」**，它的形态会不一样：

D9 会长得更像「工程视角可执行的任务说明」：

- 覆盖范围：这轮 Build 要实现哪几条 Story（从 D5 里选）
- 对应界面：用 S5/S9 里哪些 Screen 做参照
- 字段与状态：
    - 每个页面/模块需要哪些字段
    - 状态机（例如订单：待支付 / 已支付 / 已取消）
- 约束 & 规则：
    - 校验规则、错误处理、边界情况
- 验收标准：
    - 什么条件下，这轮可以说「完成」

这一步也必须握手：

- Agent 总结 D9：「这轮 Build 只做这些 Story 和这些状态，其他暂不实现，你同意吗？」
- 用户同意之后，**Build 只能在这个 D9 里开工**，不许超范围「顺手多做」。

---

### Step 6：Build（B1/B5/B9）+ 反馈 → 回到下一轮 Define

有了 D9：

- 可以是 **B5：MVP 实现**
    
    （比如只实现 happy path 的真实后端接口）
    
- 也可以进一步变成 **B9：更稳定的 Working App**
    
    （补异常情况、补权限、补列表/管理页）
    

Build 完成后：

- Agent 收集：
    - 真实使用中的问题（UX / 业务 / 性能）
    - 实现过程中发现的新约束（比如接口限制）
    - 用户使用后冒出来的新想法
- 再把这些写回 Define：形成 **下一轮 D1 / D5 / D9 的输入**。

下一轮又重新经历：握手 → 切小任务 → D1 → S1 → … → 新的 D9。

---

## 模拟流程 - 酒店预订 app

### 场景前提

用户丢进 Paraflow 一句话：

> 「我想做一个酒店预订的 web app，可以让用户搜索、预订、支付。」
> 

---

### Step 0：握手 & 切小任务（还没进 1/5/9，先对齐任务）

**目标：拒绝猜测式执行，先把这「一轮」要做的事说清楚。**

### 0.1 握手对话

Agent 不开干，先问：

> Agent：
> 「我需要确认：
> 
> 1. 你希望这个产品**主要解决什么问题**？
> 2. 本轮**目标用户**是谁？
> 3. 这轮是做整体框架，还是一个很小但能走通的 MVP？
>     
>     比如：只做一条最简单的 Happy path：
>     
>     - 城市 + 日期 → 推荐一个酒店 → 填信息 → 支付成功。」

用户回答：

> 用户：
> 
> - 问题：用户临时订酒店的时候，希望流程尽量短、尽量少页面。
> - 目标用户：自由行游客，习惯用手机，越简单越好。
> - 这轮先做一个**极简 happy path**：
>     - 搜索一次城市/日期
>     - 给一个推荐酒店
>     - 填信息 → 支付成功
>         
>         不做多酒店比较、不做订单列表、不做取消。
>         

### 0.2 产物：Product charter + Persona（本轮）

Agent 生成一个很轻的 charter：

> Product Charter（本轮迭代）
> 
> - Problem：
>     
>     自由行游客在临时订酒店时，常常被复杂筛选和多步骤流程拖慢，只想快速「搞定一个能住的」。
>     
> - Goal（本轮）：
>     
>     「让用户在 3 屏内完成一次预订」，而不是做完整的 OTA。
>     
> - In Scope：
>     - 城市 + 日期 输入
>     - 推荐一个可订的酒店
>     - 填入住人信息
>     - 模拟支付成功并给出确认
> - Out of Scope（本轮不做）：
>     - 多酒店列表、排序、筛选
>     - 酒店详细信息页
>     - 订单列表、订单取消、评价
> - Success criteria：
>     - 任何用户在 3 个页面内，可以完成一次从输入条件到看到「预订成功」的闭环。

**Persona（简版）：**

> 名字：Lily
场景：在机场，登机口前 10 分钟，想赶紧订到今晚能住的地方
诉求：越少步骤越好不需要复杂选项和信息，只要「可信」和「快」
> 

👉 这两份就是「本轮任务的上下文」，但还不是 D1。

**D1 会基于它们，但会更面向这轮具体闭环。**

---

## Step 1：Define L1（D1）= MVP Card Plan（3 屏闭环）

**从这里开始：Define = 本轮的 Plan。**

### 1.1 Agent 整理 D1：1 条 Happy path + Flow + 核心 PRD

基于 charter & persona，Agent 生成 D1：

> D1：MVP Card Plan（极简 3 屏闭环）
> 
> - Goal（本轮）：
>     
>     让自由行游客在 3 个界面内完成一次预订：
>     
>     输入条件 → 查看推荐 → 填信息并支付 → 看到成功。
>     
> - User / Context：
>     - 用户：Lily 这类自由行游客
>     - 场景：手机浏览器，时间紧、网络不一定稳定
> - Happy Path User Story
> - Happy Path User Flow
> - 核心功能说明 PRD（L1 粒度）
>     1. Quick booking 页面：
>         - 输入：city, checkInDate, checkOutDate, guests
>         - 行为：提交后调用「推荐一个酒店」的接口（可以是 mock），返回酒店名 + 价格
>     2. Confirm & pay 页面：
>         - 展示：来自 quick booking 的酒店信息
>         - 表单字段：guestName, guestPhone, guestEmail（全部必填）
>         - 行为：点击「确认并支付」→ 直接跳转成功页
>     3. Booking success 页面：
>         - 展示简单摘要（酒店 + 日期 + 价格）
>         - 行为：点击「返回开始」→ 回到 Screen A

### 1.2 L1 握手确认

> Agent：
> 「我把这轮的 Plan 压成了一个 3 屏的 D1：
> 
> - 只推荐 1 家酒店
> - 只做 1 条 happy path
> - 不做列表、不做详情、不做订单列表
>     
>     这会作为本轮的唯一 Plan。你确认我们先这样从小闭环开始吗？」
>     
> 
> 用户：
> 
> 「确认，先把这条 3 屏闭环跑通。」
> 

✅ **D1 锁定 → S1 只能按这个来。**

---

## Step 2：Design L1（S1）= Fast Prototype（3 屏 Happy Path）

### 2.1 Agent 生成 S1：3 个 Screen 的原型

根据 D1，Agent 快速拉一套原型：

1. **Screen A：Quick booking**
    
    结构非常简单：
    
    - 顶部标题：「快速订一晚酒店」
    - 城市输入框（支持简单建议）
    - 入住日期 / 离店日期控件
    - 人数选择
    - 下面立刻显示一个「推荐酒店卡片」：
        - 「今天推荐：Tokyo Simple Hotel — $120 / night」
    - 一个大按钮：「预订这家」
2. **Screen B：Confirm & pay**
    - 顶部：
        - 「Tokyo Simple Hotel」
        - 「入住：5/20，离店：5/21」
        - 「总价：$120」
    - 中间表单：
        - 入住人姓名
        - 手机号
        - 邮箱
    - 底部一个大按钮：「确认并支付」
    - 点击后不做 loading，很快切到成功页
3. **Screen C：Booking success**
    - 「预订成功！」
    - 简单摘要：
        - 酒店名
        - 入住 / 离店日期
        - 总价
    - 一个按钮：「回到开始，重新预订」

### 2.2 用户体验 S1 & 调整

用户走一遍：

> 用户：
> 
> - 「爽，这个 3 屏版本是我说的那种‘极简 MVP’感觉。」
> - 「后面肯定要有酒店详情、更多选择，但作为第一条 vertical slice 这样就够了。」
> - 「Confirm & pay 页可以在按钮下面加一句提醒文案，比如：‘本次为测试环境，不会真实扣款。’」

Agent：

- 直接在 Prototype 上改这句文案
- 同时标记「未来 D5 要把这个行为写进 spec（比如 sandbox 提示）」

然后问：

> Agent：
> 「如果只看这条 3 屏闭环，你觉得有必须加的步骤或信息吗？
> 
> 如果没有，我会基于这个 S1 去升一个 D5，把结构和模块说清楚。」
> 

用户：

> 「这条闭环按现在这样就可以了。」
> 

---

## Step 3：从 S1 回到 Define L5（D5）——结构化 Plan

现在开始「从原型里抽结构」→ D5。

### 3.1 Agent 生成 D5：Story Map + Flow + 模块说明（围绕 3 屏）

> D5：结构化 Plan（在 3 屏闭环基础上）
> 
> - Story Map（本轮活动）：
>     1. 快速创建预订请求
>         - Story：用户输入城市和日期，系统推荐一个可预订酒店
>     2. 提交入住人信息和支付意愿
>         - Story：用户确认酒店和价格，填写入住人信息，并确认支付
>     3. 获取成功确认
>         - Story：用户看到预订成功提示和简要信息
> - User Flow（比 D1 更明文化）：
>     1. A：用户输入 city, checkInDate, checkOutDate, guests → 点击「生成推荐」 / 「预订这家」
>     2. B：系统展示酒店摘要 → 用户填写 guestName, guestPhone, guestEmail → 点击「确认并支付」
>     3. C：系统返回成功 → 展示成功页，可点击「重新预订」返回 A
> - 核心模块说明 PRD：
>     - 模块：QuickBooking
>         - 输入：city, dates, guests
>         - 输出：hotelName, price（推荐单一酒店）
>         - 行为：不做多选，不做高级筛选
>     - 模块：BookingConfirmation
>         - 负责展示酒店摘要和订单草稿
>         - 负责收集入住人信息
>     - 模块：FakePayment
>         - 本轮仅需模拟成功结果
>     - 模块：BookingResult
>         - 负责展示成功信息
>         - 暂不持久化订单，只做「体验级」闭环（这一点可视为 B1/B5 决策点）

### 3.2 再次握手：D5 作为 S5 的 Plan

> Agent：
> 「我已经把 3 屏原型抽象成一个结构化 Plan（D5）：
> 
> - 三个活动（快速预订、确认信息、查看成功）
> - 一条清晰的 Flow
> - 四个模块的职责
>     
>     接下来如果需要，我可以基于 D5 做一个结构更清晰、可扩展性的 S5 原型。
>     
>     但这轮我们也可以选择**只停留在 S1 + D5**，先去做一个很轻的 Build。你更倾向哪种？」
>     

用户：

> 「我希望在 Build 前，先有一个稍微‘结构化一点’的 Prototype，比如：把未来酒店详情、订单列表的位置预留出来，但不一定要能点到。」
> 

Agent：

> 「好，那我基于 D5 升级到 S5。」
> 

---

## Step 4：Design L5（S5）——结构化 Prototype（在 3 屏基础上预留未来）

在 S5 阶段，**不一定增加真正可点的页面**，

但可以在 UI 上预留结构，让后续 5/9 更好长。

### 4.1 S5 的改动

在原有 3 屏基础上，Agent 做这些调整：

1. **Screen A：Quick booking**
    - 顶部增加一个「未来可放导航条」的区域（比如放置「订单」入口的占位）
    - 推荐酒店卡片设计得更像一个可扩展组件，将来可以演变成列表
2. **Screen B：Confirm & pay**
    - 把酒店摘要组件抽成独立部分（看起来像「详情头部」）
    - 在确认按钮附近，加入将来可扩展的「费用明细」占位（但本轮不填内容）
3. **Screen C：Booking success**
    - 成功信息下方，留一个空区域写「未来可展示订单号 / 查看详情的链接」
    - 但本轮仍然只有「返回开始」按钮可点

也就是说：**S1 = 纯闭环体验，S5 = 闭环 + 结构预留**。

用户看完：

> 用户：
> 「OK，我现在已经能想象后面怎么长到详情页、订单列表，但这轮先做这条 3 屏闭环没问题。」
> 

此时你有两个选项：

1. 继续做更多 Design 迭代（在 D5 ↔ S5 之间兜圈）
2. 或者：进入 Build → 需要一个 D9 来指导

用户选择：

> 「我想先看看一个真的能跑的 3 屏闭环。」
> 

---

## Step 5：Define L9（D9）= Build Task Plan（只针对 3 屏）

现在进入 **为 Build 专门开的 Define（task）**。

### 5.1 Agent 生成 D9：面向 Build 的 Spec

> D9：Build Task Spec（3 屏 MVP Build）
> 
> - Scope（这一轮 Build 只做什么）：
>     - 实现 3 个页面：Quick booking, Confirm & pay, Booking success
>     - 推荐酒店：可以在后端写死一个 mock 结果（无需接真实服务）
>     - 不实现订单持久化（本轮只做体验级 demo）
> - Screens 对应：
>     - QuickBookingScreen（A）
>     - ConfirmAndPayScreen（B）
>     - BookingSuccessScreen（C）
> - Data & Fields：
>     - Search params：city(string), checkInDate(date), checkOutDate(date), guests(int)
>     - Booking data：hotelName(string), price(number), nights(int), totalPrice(number)
>     - Guest data：guestName, guestPhone, guestEmail（全部必填）
> - Rules：
>     - checkOutDate > checkInDate，否则前端提示，不发送请求
>     - 提交确认并支付时，如任一字段为空，阻止提交并提示
>     - 点击「确认并支付」后，一律视为成功，直接跳到成功页
> - 非目标（本轮 Build 不做）：
>     - 不连接真实支付
>     - 不保存订单到数据库
>     - 不实现订单编号、历史订单等
> - 验收标准：
>     1. 在浏览器中可以从 A → B → C 完成一次预订流程
>     2. 刷新页面后，流程可以重新开始
>     3. 所有按钮都有响应，不出现死路或报错

### 5.2 Build 前握手

> Agent：
> 「这是这轮 Build 的任务定义（D9）——
> 
> 就是做一个 3 屏、无真实支付、无持久化的 demo 闭环。
> 
> 只要能从 A 走到 C，就算本轮 Build 成功。
> 
> 你确认吗？」
> 
> 用户：
> 
> 「确认，这就是我想要的 ‘最小可跑版本’。」
> 

✅ D9 锁定，Build 开工。

---

## Step 6：Build（B5）+ 反馈 → 回到下一轮 Define

### 6.1 Build 执行（B5：MVP 实现）

工程 / Build agent 按 D9 做：

- 前端实现 3 个页面（可用简单 UI）
- 后端 / mock 层写死一个推荐酒店：
    - 如果城市非空 → 永远返回「Tokyo Simple Hotel」
- 不做数据库，所有状态只存在前端内存 / URL state

你得到一个可以现场 demo 的版本：

- 打开：
    - 输入城市/日期 → 推荐酒店 → 填信息 → 支付 → 成功
- 没有复杂功能，但**体验是真实的**。

### 6.2 反馈 & 推动下一轮 Define

用户用了一下 demo：

> 用户：
> 
> - 「这个 3 屏 demo 很好解释，也很适合对外展示。」
> - 「下一轮我想加：
>     - 至少有一个‘酒店详情’页
>     - 能看到刚刚下过的订单详情
>         
>         然后，再慢慢做列表和取消。」
>         

Agent 把这些需求写回 Define 体系：

- 对「新需求」：进入下一轮的 **Step 0 / Step 1**，生成新的 D1（可能是「酒店详情 + 订单详情」的闭环）。
- 对「技术/体验反馈」：补到 charter / D5 / 将来 D9 的约束里。

下一轮可能是：

- 新 D1：
    - Goal = 给现有 3 屏闭环，加一个「查看订单详情」的第四屏
    - 还是切成一个小任务：从成功页点「查看订单详情」→ 只看「最近一次订单」

然后再跑一遍：

**握手 → 小任务 → D1 → S1（也许这次是 4 屏）→ D5 → S5 → 新 D9 → Build。**

---

## 模拟流程

- Step 0：握手 & 切小任务（产物：Product charter + Persona）
- Step 1：Define L1 = MVP Card Plan
- Step 2：Design L1 = Fast Prototype（只 1 条 Happy path，尽量少页面）
- Step 3：从 L1 Prototype 抽象成 Define L5（结构化 Plan）
- Step 4：Design L5 = 结构化 Prototype
- Step 5：Define L9 = Build Task Plan
- Step 6：Build + 反馈 → 下一轮

场景：

用户说：

> 「我想制作一个应用，brief 是这个：
> `Video collaboration platform built by creatives, for how creatives actually work. Designed and developed solo (no investors, no team)`」
> 

---

### Step 0：握手 & 切小任务（还没进 1/5/9，只在对齐任务）

**目标：不要直接往“整个平台”上扑，先把这轮切成一个可以做完的小 MVP。**

### 0.1 握手：澄清问题 / 用户 / 本轮范围

Agent 不开干，先问：

> Agent：
> 「为了更好地完成你的需求，我想先帮你把任务切小一点，而不是一上来就做“完整平台”。
> 先确认几件事：
> 
> 1. 你希望这个平台**最优先解决的具体问题**是什么？
>     - 远程审片？
>     - 多人版本管理？
>     - 带任务的协作？
> 2. **第一批目标用户**是谁？
>     - 独立创作者？小型工作室？代理商？
> 3. 这**一轮**你更想先做：
>     - 一个可以 demo 的「极小闭环 MVP」？
>     - 还是一个“功能很多但都很浅”的框架版？
> 
> 我的建议是：
> 
> 本轮只做一个「**给客户/合作者发一个视频链接，对方能按时间轴留言反馈**」的闭环，
> 
> 后续再慢慢长到版本管理、任务流之类。你觉得呢？」
> 

假设用户回答：

> 用户：
> 
> - 最优先解决：**远程视频审片的反馈混乱问题**，
>     
>     大家各种用微信、邮件、Drive 评论，信息很散。
>     
> - 第一批用户：**自由职业视频创作者 / 小型工作室**，
>     
>     先不管大公司多用户权限那种。
>     
> - 本轮：我也同意先做一个 **“分享视频 → 收集时间轴评论 → 自己看汇总”** 的闭环，
>     
>     不做团队管理、项目空间这些复杂的。
>     

Agent 收到回答后：

> Agent：
> 
> 「好的，我确认了：
> 
> - **问题**：远程视频审片的反馈混乱问题，大家各种用微信、邮件、Drive 评论，信息很散
> - **用户**：自由职业视频创作者 / 小型工作室，先不管大公司多用户权限那种
> - **范围**：做一个「**分享视频 → 收集时间轴评论 → 自己看汇总**」的闭环，不做团队管理、项目空间这些复杂的
> 
> 接下来我会生成：
> 
> 1. **Product Charter** - 把你的需求写成一份任务说明
> 2. **Persona** - 目标用户是谁
> 3. **✅ User Story** - 用户要完成什么任务（需要你确认）
> 4. **✅ User Flow** - 操作路径是怎样的（需要你确认）
> 5. **✅ PRD** - 每个模块的功能说明（需要你确认）
> 6. **Prototype** - 可以点击的原型
> 
> 」

（此时显示 TODO 列表 + Start 按钮，用户点击 Start 后）

> Agent：
> 「我先来写 Product Charter 和 Persona...」

### 0.2 产物 1：本轮 Product charter（极小任务）

> Product Charter（本轮迭代：Remote video review MVP）
> 
> - Problem：
>     
>     独立视频创作者给客户/合作者发片子时，反馈散落在不同渠道（微信、邮件、Drive 评论），
>     
>     时间点、版本、结论都很混乱，反复对齐成本极高。
>     
> - Goal（本轮）：
>     
>     做一个「**超轻量视频审片链接**」：
>     
>     - 创作者可以创建一个 review 链接
>     - 合作者可以在同一个页面上边看边按时间点留言
>     - 创作者能在一个地方看到所有时间轴评论
> - In scope（这轮要做）：
>     - 创作者粘贴一个视频链接（或上传占位），生成一个 review 房间
>     - 在这个房间里，用户可以播放视频，在当前时间点添加评论
>     - 评论按时间轴展示
>     - 有一个简单的「评论汇总视图」
> - Out of scope（这轮不做）：
>     - 多项目、多文件管理
>     - 复杂权限（viewer / editor / client 角色区分）
>     - 真正的团队工作区、任务分配
>     - 真正的账号系统（可以先匿名或 magic link）
> - Success criteria：
>     - 在 1 个 URL 内，完成「播放视频 → 添加 3 条以上时间点评论 → 查看评论列表」
>     - 创作者 demo 给别人看时，可以清楚说明「这就是审片场景的样子」

### 0.3 产物 2：Persona（本轮聚焦对象）

> Persona（简版）
> 
> - 名字：Alex
> - 身份：独立视频创作者 / 小型工作室主理人
> - 场景：
>     - 深夜在家剪片
>     - 想把 rough cut 发给客户/朋友，请他们给反馈
> - 诉求：
>     - 不想教客户用复杂工具
>     - 只想发一个链接，对方可以边看边说：
>         - “这里多 3 秒”
>         - “这句对白太小声”
>         - “这个转场太突兀了”
>     - 然后自己能在一个视图里看到所有反馈，按时间排好。

👉 到这里为止，我们只是把「**本轮任务**」澄清了，还没进入 Define 1/5/9。

接下来才是正式的 Define L1。

---

### Step 1：Define L1 = MVP Card Plan（本轮 1 条 Happy path）

**从这里开始：Define = 本轮的 Plan。**

### 1.1 Agent 生成 Define L1：极小 MVP 卡片

> Define L1：MVP Card Plan（单条视频审片闭环）
> 
> - Goal（本轮）：
>     
>     让 Alex 可以在一个页面内创建一个视频审片房间，
>     
>     自己（或合作者）可以在同一页面边看边按时间点添加评论，
>     
>     最后在一个简单的汇总视图里看到所有评论。
>     
> - User / Context：
>     - 用户：Alex（创作者）
>     - 场景：桌面端浏览器为主，这轮先不做移动适配
> - Happy path User Story（只 1 条）：
>     - 「作为一个视频创作者，我想快速创建一个视频审片页面，让我和合作者可以在同一个地方边看边按时间点评论，这样我就不会在各个渠道到处翻反馈。」
> - Happy path User Flow（控制在 3 屏左右）：
>     1. **Screen A：Create review**
>         - Alex 输入项目名
>         - Alex 粘贴一个视频链接（例如 mp4 / Vimeo 占位）
>         - 点击「Create review room」
>     2. **Screen B：Review room**
>         - 展示视频播放器
>         - 下方有一个 input：「Add comment at current time」
>         - Alex 播放到某一帧，点击暂停，在输入框里打字 → 点击「Add」
>         - 评论出现在右侧列表，按时间排序
>         - 下方有一个「Finish reviewing」按钮
>     3. **Screen C：Summary**
>         - 展示这个视频下所有评论（时间戳 + 文本），按时间排序
>         - 有一个「Back to review room」按钮，可以再回去继续看
>         - 有一个「Copy share link」按钮（本轮可以假装有，但不做真正权限）
> - 核心功能说明 PRD（L1 粒度）：
>     1. Create review：
>         - 字段：projectTitle, videoUrl
>         - 行为：点击「Create review room」后，生成一个临时 review ID，并跳转到 Review room
>     2. Review room：
>         - 播放器：支持播放/暂停/时间拖动（可先用浏览器原生 video）
>         - 评论输入框：
>             - 「Current time」由播放器提供
>             - 点击「Add」时记录（timestamp, text）
>         - 评论列表：右侧按 timestamp 升序展示
>     3. Summary：
>         - 展示这次会话的所有评论
>         - 暂时不支持「已处理」状态，只做列表
>         - 「Copy share link」可以是一个假按钮，也可以复制当前 URL（视 Build 决定）

### 1.2 L1 握手确认

> Agent：
> 「我把这轮 Plan 压成了一条闭环：
> 
> - A：创建审片房间
> - B：在播放器里加几条时间点评论
> - C：看评论汇总
>     
>     不做项目列表，不做多文件，不做复杂权限。
>     
>     你确认这一轮就只做这条路吗？」
>     
> 
> 用户：
> 
> 「确认，本轮就做这个最小审片闭环。」
> 

✅ **Define L1 锁定 → 后面的 Fast Prototype 必须按这个 Plan 来。**

---

### Step 2：Design L1 = Fast Prototype（只有这条 Happy Path）

### 2.1 Agent 生成 Design L1：极简 3 屏原型

基于 Define L1：

1. **Screen A：Create review**
    - 顶部文案：
        
        `Start a new video review`
        
    - 输入框：Project title
    - 输入框：Video URL
    - 按钮：`Create review room`
    - 下面小字：`No login required in this MVP.`
2. **Screen B：Review room**
    
    布局类似：
    
    - 左侧：video player（占 2/3 宽度）
        - 控制：Play/Pause、时间轴
    - 右侧：Comments panel（1/3 宽度）
        - 顶部：当前视频名称
        - 中部：评论列表
        - 底部：
            - 文案：`Add comment at 01:23`（自动显示当前时间）
            - 文本框 + 「Add」按钮
    - 底部一个按钮：`Finish reviewing` → 进入 Summary
3. **Screen C：Summary**
    - 标题：`Review summary for "Project title"`
    - 列表：
        - 每行：`[01:23] Text of comment`
    - 顶部说明：「This MVP summary is read-only; resolving comments is in future iterations.」
    - 按钮：
        - `Back to review room`
        - `Copy share link`（可以只是复制当前 URL）

### 2.2 用户走一遍 Fast Prototype & 调整

用户走一圈：

> 用户：
> 
> - 「这个 3 屏 MVP 闭环很清楚。」
> - 「我有两个补充：
>     
>     1）在 Review room 里，点击评论时，视频可以跳到对应时间（哪怕现在只做 ‘快跳’）；
>     
>     2）Summary 页可以标一下总评论数，比如：`5 comments on this cut`。」
>     

Agent 的处理：

- 暂时先在 Prototype 上改交互和文案；
- 标记「点击评论 → 跳时间」为 **L5 时需要写进 Story / 模块说明**。

此时用户如果说「我还想要 reviewer 的名字」，Agent 会问：

> Agent：
> 「这个字段对本轮 Build 是否必需？
> 
> 还是先在 Prototype 里做占位，Build 放到下一轮？」
> 

假设用户说「先占位，不强制 Build」→ 那就是一个明确的 L5 话题。

---

### Step 3：从 L1 Prototype 回到 Define L5 —— 结构化 Plan

当用户确认这条 3 屏 Happy path 方向 OK 后，Agent 开始**抽结构**，产出 Define L5。

### 3.1 Define L5：Story Map + Flow + 模块 PRD

> Define L5：结构化 Plan（基于 3 屏 L1 Prototype）
> 
> - Story Map（本轮「活动」视角）：
>     1. 创建审片会话
>         - Story：作为创作者，我可以输入项目名和视频链接，创建一个新的审片会话。
>     2. 在时间轴上收集反馈
>         - Story：在播放视频时，我可以在当前时间点添加评论，并在右侧列表中看到它们。
>         - Story（L5 新增）：点击已有评论，可以跳转到对应时间。
>     3. 汇总与回看反馈
>         - Story：我可以在一个 summary 视图里看到所有评论的时间点和内容。
>         - Story（候选）：看到本次 cut 的评论总数。
> - User Flow（比 L1 写得更清晰）：
>     1. 打开 Create review 页面
>     2. 填写项目名 + 视频链接 → 点击「Create review room」
>     3. 跳转到 Review room，播放器自动准备好
>     4. 播放视频 → 暂停 → 在当前时间点添加评论 → 评论出现在右侧
>     5. （可选）点击某条评论 → 播放器跳到对应时间
>     6. 点击「Finish reviewing」→ 进入 Summary
>     7. 在 Summary 里浏览评论列表 + 评论总数
>     8. 可点击「Back to review room」回去继续看
> - 核心模块说明（更结构化 PRD）：
>     1. Module：ReviewSession
>         - 负责保存这一次审片会话的基本信息：projectTitle, videoUrl, createdAt
>     2. Module：VideoPlayer
>         - 提供 currentTime、seekTo(time) 能力
>     3. Module：TimecodedComments
>         - 添加评论：基于 currentTime 创建 comment
>         - 展示评论列表：按 timestamp 排序
>         - 点击评论 → 调用 VideoPlayer.seekTo(timestamp)（未来可优化）
>     4. Module：ReviewSummary
>         - 读取该会话所有 comments
>         - 显示：总评论数 + 列表

### 3.2 L5 再握手：锁定结构化 Plan

> Agent：
> 「我已经把刚才那条 3 屏闭环抽成了结构化 Plan：
> 
> - Story Map 三块：创建会话 / 时间轴评论 / 汇总
> - Flow 写清楚 8 步
> - 模块拆成 ReviewSession / VideoPlayer / TimecodedComments / ReviewSummary。
> 
> 这一版会作为接下来结构化原型（Design L5）的 Plan。
> 
> 你觉得有哪块 Story 或模块是必须加的？
> 
> 比如：
> 
> - 本轮一定要有 reviewer 名字？
> - 一定要能标记 “已处理” 吗？」

假设用户说：

> 「名字可以后面再说，已处理也可以下一轮。现在这版结构就先锁了。」
> 

✅ Define L5 锁定 → 进入 S5。

---

### Step 4：Design L5 —— 结构化 Prototype

现在 Agent 基于 Define L5，升级 Prototype → 更像「一个有未来扩展余地的产品骨架」。

### 4.1 S5 的样子

相对 L1 的变化：

1. **Create review 页（结构感更强）**
    - 左侧是表单（项目名 + 视频 URL）
    - 右侧出现一个「未来可以列出历史会话」的空白框（这轮只是占位）
    - 有一点小文案：`Future: show past reviews here. Not in this MVP.`
2. **Review room 页**
    - 评论列表每条加上一个未来可扩展区域（比如一个小圆圈，未来可以打勾表示“已处理”）
    - 点击评论时，播放器跳转到对应 timestamp
    - 底部有一行淡文案：`Reviewer name will be supported in future iterations.`
3. **Summary 页**
    - 顶部：`5 comments on this cut`
    - 每条评论下面预留一行位置「未来可用于标注状态或 owner」
    - 布局上更像是一个「将来可以加 filter / sort」的列表页

用户看完：

> 「我已经能想象后续要怎么加 reviewer、状态、筛选了，这版原型 OK。
> 下一步我希望能看到一个真的能跑的 Review room，哪怕只是前端 + mock。」
> 

这就触发下一步：**为 Build 单独开一个 Define（Build Task Plan）。**

---

### Step 5：Define L9 = Build Task Plan（给 Build 用的 Spec）

### 5.1 Agent 生成 Define L9：面向 Build 的任务说明

> Define L9：Build Task Spec（本轮 Build）
> 
> - Scope（这轮 Build 只做什么）：
>     1. 前端实现三页：Create review / Review room / Summary（按 S5）
>     2. 评论数据存放在浏览器内存或 localStorage，不做真正后端
>     3. 支持：
>         - 创建一个会话
>         - 在 Review room 添加时间点评论
>         - 点击评论跳转时间
>         - 在 Summary 查看所有评论和总数
>     4. 不做：
>         - 多会话列表
>         - 用户登录
>         - 真正的分享权限控制
> - Screens & Routes：
>     - `/new` → Create review
>     - `/review/:sessionId` → Review room
>     - `/review/:sessionId/summary` → Summary
> - Data model（前端层面）：
>     
>     ```tsx
>     ReviewSession {
>       id: string
>       projectTitle: string
>       videoUrl: string
>       createdAt: ISOString
>     }
>     
>     Comment {
>       id: string
>       sessionId: string
>       timestamp: number  // 秒
>       text: string
>       createdAt: ISOString
>     }
>     
>     ```
>     
> - Behavior：
>     - 创建会话：
>         - 填完表单 → 生成 sessionId → 存入 localStorage → 跳转到 `/review/:sessionId`
>     - 添加评论：
>         - 从 video player 拿 currentTime（四舍五入到秒）
>         - 创建 Comment → 存入 localStorage → 刷新右侧列表
>     - 点击评论：
>         - 调用 `seekTo(timestamp)`，播放头跳到对应秒
>     - Summary 页：
>         - 读取该 session 的所有 comment
>         - 统计数量，显示 `N comments on this cut`
> - 非目标（本轮 Build 明确不做）：
>     - 评论编辑/删除
>     - 评论状态（已处理/未处理）
>     - 评论作者（reviewer name）
>     - 后端存储
> - 验收标准：
>     1. 在本地 demo 中：从 `/new` → `/review/:id` → `/review/:id/summary` 可以顺利走完
>     2. 至少添加 3 条评论，Summary 能正确显示时间点和总数
>     3. 点击任一评论，视频能跳到对应时间点
>     4. 全程不需要登录 / 注册，也不会出现死路或报错页面

### 5.2 Build 前再握一次手

> Agent：
> 「这份 Define L9 是专门为 Build 准备的任务说明：
> 
> - 只做 3 页
> - 只做本地存储
> - 只做时间轴评论 + 跳转 + 汇总
>     
>     不会做登录、后台、团队管理，也不会做 reviewer 名字。
>     
>     确认用这个 Plan 来驱动本轮 Build 吗？」
>     
> 
> 用户：
> 
> 「确认，这轮就先把这个前端 demo 做出来。」
> 

✅ Define L9 锁定 → Build 开工。

---

### Step 6：Build + 反馈 → 回到下一轮 Define

### 6.1 Build 执行（可以理解为 B5：MVP 实现）

按 Define L9，工程 / Build agent：

- 用 React / Next / whatever 实现 3 个页面
- 用浏览器 video 播放器组件
- 用 localStorage 存 ReviewSession + Comment
- 实现 routes + 基本交互逻辑

最后你有一个可以当 demo 的：

> /new 创一个会话/review/:id 看视频 + 加评论/review/:id/summary 看所有评论 + 总数
> 

### 6.2 真实使用 & 反馈 → 下一轮 Define 的输入

你拿这个 demo 去给真实朋友 / 同事试用：

- 有人说：「评论太多的时候，需要能标记哪些已经改完。」
- 有人说：「我希望客户也能自己打开链接评论，不只是我自己。」
- 你自己发现：「localStorage 有点扛不住换电脑 / 换浏览器。」

这些反馈会变成下一轮的输入：

- 新的 Problem / Goal 补充到 Product charter
- 新的需求进入下一轮的 Step 0 & Step 1：
    - 例如下一轮 D1 可能变成：
        - 「为已有审片会话加上 reviewer 名字 + ‘已处理’ 标记」
        - 或「把当前 demo 升级为支持客户端访问的分享链接」

然后再跑一遍你这套：

> 握手 → 切小任务 → Define L1（这一轮的 MVP） → Fast Prototype → Define L5 → Design L5 → Define L9 → Build → 反馈。
> 

---

## 最后一口气总结一下这个场景

对这个「Video collaboration platform」来说，这轮深度模拟做的事就是：

- 没有瞎上来就想整个「视频协作平台全家桶」，
- 而是通过 **握手 → Product charter + Persona → 小任务 D1**，
    
    把它压成了一条「**3 屏视频审片闭环**」：
    
    > Create review → Review with timecoded comments → Summary
    > 
- 用 Define L1 把这条路讲清楚，再用 Design L1 画出最小原型；
- 然后抽象成 Define L5（Story Map / Flow / 模块），再升级到更有结构感的 Prototype；
- 真要动 Build 时，不拿前面的“故事型 Define”硬上，而是单独开一个 **Define L9：Build Task Spec**；
- Build 完之后，所有新认知（要 reviewer、要状态、要分享）再回灌到下一轮 Define。

这样，「Define 就是 Plan」「MVP 变小」「握手防止乱猜」这三条，在这个视频协作产品上就都落地了一圈。