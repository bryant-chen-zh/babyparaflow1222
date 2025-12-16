import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ChatSidebar } from './components/Chat/ChatSidebar';
import { CanvasContainer } from './components/Canvas/CanvasContainer';
import { AgentStatusPanel } from './components/Canvas/AgentStatusPanel';
import { MarkdownModal } from './components/Editor/MarkdownModal';
import { WhiteboardModal } from './components/Editor/WhiteboardModal';
import { ImmersiveView } from './components/Preview/ImmersiveView';
import { PinModal } from './components/Editor/PinModal';
import { DatabaseModal } from './components/Editor/DatabaseModal';
import { IntegrationModal } from './components/Editor/IntegrationModal';
import { CanvasNode, ChatMessage, NodeType, DocumentData, WhiteboardData, ScreenData, CanvasEdge, CanvasView, PlanStep, CanvasPin, TableData, APIData, IntegrationData, QuestionData, PendingConfirmation, NodeConfirmationStatus } from './types';
import { 
  LAYOUT_CENTER_X, 
  LAYOUT_CENTER_Y, 
  DOCUMENT_SECTION_Y_OFFSET, 
  CHART_SECTION_X_OFFSET, 
  BACKEND_SECTION_X_OFFSET,
  BACKEND_SECTION_Y_OFFSET,
  SECTION_IDS,
  NODE_SPACING_X,
  WEB_NODE_SPACING_X,
  WEB_NODE_SPACING_Y,
  INITIAL_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM
} from './constants';
import { streamTextDynamic } from './utils/streamText';

// --- Step 0: Handshake Questions Configuration ---
// These questions help clarify: Problem, User, Scope before diving into Define
const HANDSHAKE_QUESTIONS: QuestionData[] = [
  {
    questionId: 'problem',
    questionText: '你希望这个平台最优先解决的具体问题是什么？',
    currentPage: 1,
    totalPages: 3,
    options: [
      { id: 'review', label: '远程视频审片', description: '给客户发视频链接，对方能按时间轴留言反馈' },
      { id: 'version', label: '多人版本管理', description: '追踪不同版本、迭代历史' },
      { id: 'task', label: '带任务的协作', description: '分配和追踪修改任务' }
    ]
  },
  {
    questionId: 'user',
    questionText: '第一批目标用户是谁？',
    currentPage: 2,
    totalPages: 3,
    options: [
      { id: 'indie', label: '独立创作者', description: '自由职业视频创作者' },
      { id: 'studio', label: '小型工作室', description: '2-10人的创意团队' },
      { id: 'agency', label: '代理商/大公司', description: '需要复杂权限管理' }
    ]
  },
  {
    questionId: 'scope',
    questionText: '这轮你更想先做什么？',
    currentPage: 3,
    totalPages: 3,
    options: [
      { id: 'mvp', label: '极小闭环 MVP', description: '发链接 → 时间轴评论 → 看汇总 (3屏)' },
      { id: 'framework', label: '功能多但浅的框架', description: '展示平台的整体结构' }
    ]
  }
];

// --- SHARED COMPONENTS (MOCK HTML STRINGS) ---
const NAV_HTML = `
<nav class="h-16 border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 bg-white/90 backdrop-blur z-30">
  <div class="flex items-center gap-8">
    <div class="text-xl font-bold tracking-tighter text-slate-900 flex items-center gap-2" data-to="node-screen-1" style="cursor: pointer">
      <div class="w-6 h-6 bg-emerald-500 rounded-lg"></div> Paraflow
    </div>
    <div class="flex gap-6 text-sm font-medium text-slate-500">
      <button class="hover:text-slate-900 transition-colors" data-to="node-screen-1">Home</button>
      <button class="hover:text-slate-900 transition-colors" data-to="node-screen-2">Explore</button>
      <button class="hover:text-slate-900 transition-colors" data-to="node-screen-5">My Events</button>
    </div>
  </div>
  <div class="flex items-center gap-4">
    <button class="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors" data-to="node-screen-4">+ Create Event</button>
    <button class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 hover:ring-2 ring-indigo-200 transition-all shadow-sm" data-to="node-screen-5"></button>
  </div>
</nav>
`;

const FOOTER_HTML = `
<footer class="py-12 px-8 border-t border-slate-100 bg-slate-50 mt-auto">
  <div class="max-w-5xl mx-auto flex justify-between items-center text-slate-400 text-sm">
    <div>&copy; 2024 Paraflow Inc.</div>
    <div class="flex gap-6">
      <span>Privacy</span>
      <span>Terms</span>
      <span>Twitter</span>
    </div>
  </div>
</footer>
`;

// --- MOCK DATA ---
const MOCK_LUMA_DATA: {
  // Step 0: Handshake outputs
  projectCharter: DocumentData;
  persona: DocumentData;
  
  // D1: MVP Card Plan (Define L1)
  d1MvpCardPlan: DocumentData;
  d1UserFlow: WhiteboardData;  // Simple 3-screen flow
  
  // Execution Plan (after PRD confirmation, before Screen generation)
  executionPlan: DocumentData;
  
  // S1: Fast Prototype - 3 Screen MVP
  s1ScreenA: ScreenData;  // Home/Search
  s1ScreenB: ScreenData;  // Event Detail + Register
  s1ScreenC: ScreenData;  // Success
  
  // D5: Structured Plan (Define L5)
  d5StoryMap: WhiteboardData;
  d5UserFlow: WhiteboardData;
  d5PrdDiscovery: DocumentData;
  d5PrdDetail: DocumentData;
  d5PrdRegistration: DocumentData;
  
  // D9: Build Task Spec (Define L9)
  d9BuildSpec: DocumentData;
  
  // Legacy data (keeping for backward compatibility)
  storyMap: WhiteboardData;
  userFlow: WhiteboardData;
  prdHome: DocumentData;
  prdExplore: DocumentData;
  prdDetail: DocumentData;
  prdCreate: DocumentData;
  prdProfile: DocumentData;
  doc1: DocumentData;
  doc2: DocumentData;
  doc3: DocumentData;
  docDevPlan: DocumentData;
  docTechStack: DocumentData;
  docArchitecture: DocumentData;
  docDataModel: DocumentData;
  whiteboard: WhiteboardData;
  screen1: ScreenData;
  screen2: ScreenData;
  screen3: ScreenData;
  screen4: ScreenData;
  screen5: ScreenData;
  tableUsers: TableData;
  tableEvents: TableData;
  apiLogin: APIData;
} = {
  // === Act 1: Project Setup ===
  projectCharter: {
    content: `# Product Charter（本轮迭代：Remote video review MVP）

## Problem
独立视频创作者给客户/合作者发片子时，反馈散落在不同渠道（微信、邮件、Drive 评论），
时间点、版本、结论都很混乱，反复对齐成本极高。

## Goal（本轮）
做一个「**超轻量视频审片链接**」：
- 创作者可以创建一个 review 链接
- 合作者可以在同一个页面上边看边按时间点留言
- 创作者能在一个地方看到所有时间轴评论

## In Scope（这轮要做）
- 创作者粘贴一个视频链接（或上传占位），生成一个 review 房间
- 在这个房间里，用户可以播放视频，在当前时间点添加评论
- 评论按时间轴展示
- 有一个简单的「评论汇总视图」

## Out of Scope（这轮不做）
- 多项目、多文件管理
- 复杂权限（viewer / editor / client 角色区分）
- 真正的团队工作区、任务分配
- 真正的账号系统（可以先匿名或 magic link）

## Success Criteria
- 在 1 个 URL 内，完成「播放视频 → 添加 3 条以上时间点评论 → 查看评论列表」
- 创作者 demo 给别人看时，可以清楚说明「这就是审片场景的样子」
`
  },
  persona: {
    content: `# Persona（本轮聚焦对象）

## Alex - 独立视频创作者

**身份**：
- 独立视频创作者 / 小型工作室主理人
- 自由职业，习惯远程协作

**场景**：
- 深夜在家剪片
- 想把 rough cut 发给客户/朋友，请他们给反馈
- 时间紧张，不想教客户用复杂工具

**诉求**：
- 只想发一个链接，对方可以边看边说：
  - "这里多 3 秒"
  - "这句对白太小声"
  - "这个转场太突兀了"
- 然后自己能在一个视图里看到所有反馈，按时间排好

**痛点**：
- 反馈散落在微信、邮件、Drive 评论中
- 时间点描述不准确（"大概中间那段"）
- 反复对齐成本高
`
  },

  // === D1: MVP Card Plan (Define L1) ===
  d1MvpCardPlan: {
    content: `# D1: MVP Card Plan（单条视频审片闭环）

## Goal（本轮目标）
让 Alex 可以在一个页面内创建一个视频审片房间，
自己（或合作者）可以在同一页面边看边按时间点添加评论，
最后在一个简单的汇总视图里看到所有评论。

## User / Context
- **用户**: Alex（独立视频创作者）
- **场景**: 桌面端浏览器为主，这轮先不做移动适配

## Happy Path User Story
「作为一个视频创作者，我想快速创建一个视频审片页面，让我和合作者可以在同一个地方边看边按时间点评论，这样我就不会在各个渠道到处翻反馈。」

## User Flow（3 屏）
1. **Screen A: Create review**
   - Alex 输入项目名
   - Alex 粘贴一个视频链接（例如 mp4 / Vimeo 占位）
   - 点击「Create review room」
2. **Screen B: Review room**
   - 展示视频播放器
   - 下方有一个 input：「Add comment at current time」
   - Alex 播放到某一帧，点击暂停，在输入框里打字 → 点击「Add」
   - 评论出现在右侧列表，按时间排序
   - 下方有一个「Finish reviewing」按钮
3. **Screen C: Summary**
   - 展示这个视频下所有评论（时间戳 + 文本），按时间排序
   - 有一个「Back to review room」按钮，可以再回去继续看
   - 有一个「Copy share link」按钮

## 核心功能说明（L1 粒度）
1. **Create review**
   - 字段：projectTitle, videoUrl
   - 行为：点击「Create review room」后，生成一个临时 review ID，并跳转到 Review room

2. **Review room**
   - 播放器：支持播放/暂停/时间拖动（可先用浏览器原生 video）
   - 评论输入框：
     - 「Current time」由播放器提供
     - 点击「Add」时记录（timestamp, text）
   - 评论列表：右侧按 timestamp 升序展示

3. **Summary**
   - 展示这次会话的所有评论
   - 暂时不支持「已处理」状态，只做列表
   - 「Copy share link」可以是一个假按钮，也可以复制当前 URL
`
  },

  d1UserFlow: {
    elements: [
      // Simple 3-screen flow for video review MVP
      { id: 'start', type: 'circle', x: 50, y: 150, width: 80, height: 80, content: 'Alex\\nLands', color: '#0f172a' },
      { id: 'a1', type: 'arrow', x: 130, y: 190, width: 80, height: 0, content: '', color: '#94a3b8' },
      { id: 'screen-a', type: 'rect', x: 210, y: 160, width: 140, height: 60, content: 'A: Create review', color: '#3B82F6' },
      { id: 'a2', type: 'arrow', x: 350, y: 190, width: 80, height: 0, content: 'Create', color: '#94a3b8' },
      { id: 'screen-b', type: 'rect', x: 430, y: 160, width: 140, height: 60, content: 'B: Review room', color: '#3B82F6' },
      { id: 'a3', type: 'arrow', x: 570, y: 190, width: 80, height: 0, content: 'Finish', color: '#94a3b8' },
      { id: 'screen-c', type: 'rect', x: 650, y: 160, width: 120, height: 60, content: 'C: Summary', color: '#10b981' },
      // Label
      { id: 'label', type: 'text', x: 350, y: 80, width: 200, height: 30, content: 'Video Review MVP (3 Screens)', color: '#64748B' },
    ]
  },

  // === Execution Plan (after PRD confirmation, before Screen generation) ===
  executionPlan: {
    content: `# Execution Plan — Video Review — v1

## 0) Plan Status

* Status: Draft
* Owner: Paraflow Agent
* Date: ${new Date().toISOString().split('T')[0]}
* Execution Mode: Design

## 1) Objective (One sentence)

* Objective: 生成一个 3 屏视频审片 MVP 原型，验证"创建 → 评论 → 汇总"的核心闭环

## 2) Scope

### In Scope

* Screen A: Create review（输入项目名+视频链接）
* Screen B: Review room（播放器+时间轴评论）
* Screen C: Summary（评论汇总列表）
* 页面间导航 Edges

### Out of Scope (Hard No)

* 用户登录/注册
* 多文件上传
* 团队权限管理
* Reviewer 名字

## 3) Inputs (Source of Truth — References only)

* Charter: @Product Charter
* Persona: @User Persona
* PRD sections: @PRD: Create Review, @PRD: Review Room, @PRD: Summary
* User Story: @User Story
* User Flow: @User Flow (3屏)

## 4) Outputs (Deliverables)

* Deliverable 1: 3 屏可点击原型（Screen A/B/C）
* Deliverable 2: 页面间导航 Edges
* Where they live: Canvas Prototype Section

## 5) TODO List (Execution Order)

* [ ] TODO-1: 生成 Screen A: Create review
  * Refs: @PRD: Create Review
  * Done when: 页面可点击，包含输入框和按钮

* [ ] TODO-2: 生成 Screen B: Review room
  * Refs: @PRD: Review Room
  * Done when: 播放器+评论列表+添加评论功能

* [ ] TODO-3: 生成 Screen C: Summary
  * Refs: @PRD: Summary
  * Done when: 评论汇总列表+返回按钮

* [ ] TODO-4: 创建页面间导航 Edges
  * Refs: @User Flow (3屏)
  * Done when: A→B→C 导航可点击

## 6) Acceptance Checklist (Iteration-level)

* [ ] AC-1: 3 屏可以完整走通 Happy Path
* [ ] AC-2: 每个屏幕的 UI 符合 PRD 描述
* [ ] AC-3: 没有超出 Scope 的额外功能

## 7) Open Questions / Blockers

（无）

## 8) Change Control (Hard Rule)

* Any scope change must:
  1. update Define (or add a Define TODO)
  2. re-lock Define
  3. generate a new Plan version (v2, v3...)
* Change Log:
  * (Initial version)
`
  },

  // === S1: Fast Prototype - 3 Screen MVP ===
  s1ScreenA: {
    screenName: "Create review",
    variant: 'web',
    plan: `# Screen A: Create review
- **Goal**: 让创作者快速创建一个视频审片房间
- **Layout**: 简洁的表单，输入项目名和视频链接
- **Action**: 点击创建后进入 Review room
`,
    htmlContent: `
      <div class="bg-slate-900 min-h-full font-sans text-white flex flex-col">
        <nav class="h-16 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 bg-slate-900/95 backdrop-blur z-30">
          <div class="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
            <div class="w-6 h-6 bg-violet-500 rounded-lg"></div> FrameFlow
          </div>
          <span class="text-xs text-slate-500">Video Review Platform</span>
        </nav>
        <main class="flex-1 flex items-center justify-center px-8 py-12">
          <div class="w-full max-w-md">
            <h1 class="text-3xl font-bold text-white mb-2">Start a new video review</h1>
            <p class="text-slate-400 mb-8">Share your video and collect feedback with timecoded comments.</p>
            
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Project title</label>
                <input type="text" placeholder="e.g. Brand Video v2 - Rough Cut" 
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none" />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Video URL</label>
                <input type="text" placeholder="Paste video link (mp4, Vimeo, YouTube...)" 
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none" />
              </div>
              
              <button class="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors" data-to="node-s1-b">
                Create review room
              </button>
              
              <p class="text-center text-xs text-slate-500">No login required in this MVP.</p>
            </div>
          </div>
        </main>
      </div>
    `
  },

  s1ScreenB: {
    screenName: "Review room",
    variant: 'web',
    plan: `# Screen B: Review room
- **Goal**: 让用户边看视频边按时间点添加评论
- **Layout**: 左侧视频播放器，右侧评论面板
- **Key CTA**: Add comment 按钮
`,
    htmlContent: `
      <div class="bg-slate-900 min-h-full font-sans text-white flex flex-col">
        <nav class="h-14 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 bg-slate-900/95 backdrop-blur z-30">
          <div class="flex items-center gap-4">
            <div class="text-lg font-bold tracking-tighter text-white flex items-center gap-2">
              <div class="w-5 h-5 bg-violet-500 rounded"></div> FrameFlow
            </div>
            <span class="text-slate-500">•</span>
            <span class="text-sm text-slate-300">Brand Video v2 - Rough Cut</span>
          </div>
          <button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors" data-to="node-s1-c">
            Finish reviewing
          </button>
        </nav>
        <main class="flex-1 flex">
          <!-- Video Player Section -->
          <div class="flex-1 p-6">
            <div class="aspect-video bg-slate-800 rounded-xl overflow-hidden relative">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <p class="text-slate-400 text-sm">Video Player</p>
                </div>
              </div>
              <!-- Playback bar -->
              <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div class="flex items-center gap-3">
                  <button class="text-white"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
                  <span class="text-xs text-white font-mono">01:23</span>
                  <div class="flex-1 h-1 bg-slate-600 rounded-full">
                    <div class="w-1/3 h-full bg-violet-500 rounded-full"></div>
                  </div>
                  <span class="text-xs text-slate-400 font-mono">04:32</span>
                </div>
              </div>
            </div>
            <!-- Comment input -->
            <div class="mt-4 p-4 bg-slate-800 rounded-xl">
              <div class="flex items-center gap-3">
                <span class="px-2 py-1 bg-violet-600 text-white text-xs font-mono rounded">01:23</span>
                <input type="text" placeholder="Add a comment at this timestamp..." 
                  class="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none" />
                <button class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
                  Add
                </button>
              </div>
            </div>
          </div>
          <!-- Comments Panel -->
          <div class="w-80 border-l border-slate-800 flex flex-col">
            <div class="p-4 border-b border-slate-800">
              <h3 class="font-bold text-white">Comments</h3>
              <p class="text-xs text-slate-500">3 comments on this cut</p>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
              <div class="p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750">
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-1.5 py-0.5 bg-violet-600/30 text-violet-400 text-xs font-mono rounded">00:15</span>
                </div>
                <p class="text-sm text-slate-300">这里多了 3 秒，节奏有点拖</p>
              </div>
              <div class="p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750">
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-1.5 py-0.5 bg-violet-600/30 text-violet-400 text-xs font-mono rounded">01:42</span>
                </div>
                <p class="text-sm text-slate-300">这句对白声音太小了</p>
              </div>
              <div class="p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750">
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-1.5 py-0.5 bg-violet-600/30 text-violet-400 text-xs font-mono rounded">03:28</span>
                </div>
                <p class="text-sm text-slate-300">转场有点突兀，可以加个淡出？</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    `
  },

  s1ScreenC: {
    screenName: "Summary",
    variant: 'web',
    plan: `# Screen C: Review Summary
- **Goal**: 展示所有时间轴评论的汇总视图
- **Content**: 评论列表按时间排序，显示总数
- **Action**: 返回 Review room 或复制分享链接
`,
    htmlContent: `
      <div class="bg-slate-900 min-h-full font-sans text-white flex flex-col">
        <nav class="h-14 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 bg-slate-900/95 backdrop-blur z-30">
          <div class="flex items-center gap-4">
            <div class="text-lg font-bold tracking-tighter text-white flex items-center gap-2">
              <div class="w-5 h-5 bg-violet-500 rounded"></div> FrameFlow
            </div>
            <span class="text-slate-500">•</span>
            <span class="text-sm text-slate-300">Review Summary</span>
          </div>
        </nav>
        <main class="flex-1 max-w-2xl mx-auto w-full px-8 py-12">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h1 class="text-2xl font-bold text-white mb-1">Brand Video v2 - Rough Cut</h1>
              <p class="text-slate-400">3 comments on this cut</p>
            </div>
            <div class="flex gap-3">
              <button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors" data-to="node-s1-b">
                Back to review
              </button>
              <button class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
                Copy share link
              </button>
            </div>
          </div>
          
          <div class="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div class="divide-y divide-slate-700">
              <div class="p-4 flex items-start gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <span class="px-2 py-1 bg-violet-600/30 text-violet-400 text-xs font-mono rounded whitespace-nowrap">00:15</span>
                <p class="text-slate-300">这里多了 3 秒，节奏有点拖</p>
              </div>
              <div class="p-4 flex items-start gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <span class="px-2 py-1 bg-violet-600/30 text-violet-400 text-xs font-mono rounded whitespace-nowrap">01:42</span>
                <p class="text-slate-300">这句对白声音太小了</p>
              </div>
              <div class="p-4 flex items-start gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <span class="px-2 py-1 bg-violet-600/30 text-violet-400 text-xs font-mono rounded whitespace-nowrap">03:28</span>
                <p class="text-slate-300">转场有点突兀，可以加个淡出？</p>
              </div>
            </div>
          </div>
          
          <p class="mt-6 text-center text-xs text-slate-500">
            This MVP summary is read-only; resolving comments is in future iterations.
          </p>
        </main>
      </div>
    `
  },

  // === D5: Structured Plan (Define L5) ===
  d5StoryMap: {
    elements: [
      // Epic 1: 创建审片会话
      { id: 'epic-1', type: 'rect', x: 50, y: 50, width: 180, height: 60, content: 'Epic: 创建审片会话', color: '#3B82F6' },
      { id: 'story-1-1', type: 'rect', x: 50, y: 130, width: 160, height: 50, content: '输入项目信息', color: '#93C5FD' },
      { id: 'story-1-2', type: 'rect', x: 50, y: 200, width: 160, height: 50, content: '生成 review 房间', color: '#BFDBFE' },
      // Epic 2: 时间轴评论
      { id: 'epic-2', type: 'rect', x: 280, y: 50, width: 180, height: 60, content: 'Epic: 时间轴评论', color: '#10B981' },
      { id: 'story-2-1', type: 'rect', x: 280, y: 130, width: 160, height: 50, content: '播放视频', color: '#6EE7B7' },
      { id: 'story-2-2', type: 'rect', x: 280, y: 200, width: 160, height: 50, content: '添加时间点评论', color: '#A7F3D0' },
      { id: 'story-2-3', type: 'rect', x: 280, y: 270, width: 160, height: 50, content: '点击评论跳转', color: '#D1FAE5' },
      // Epic 3: 汇总与回看
      { id: 'epic-3', type: 'rect', x: 510, y: 50, width: 180, height: 60, content: 'Epic: 汇总与回看', color: '#F59E0B' },
      { id: 'story-3-1', type: 'rect', x: 510, y: 130, width: 160, height: 50, content: '查看评论汇总', color: '#FCD34D' },
      { id: 'story-3-2', type: 'rect', x: 510, y: 200, width: 160, height: 50, content: '评论总数统计', color: '#FDE68A' },
      // Labels
      { id: 'label-epic', type: 'text', x: -80, y: 70, width: 60, height: 30, content: 'Epics', color: '#64748B' },
      { id: 'label-story', type: 'text', x: -80, y: 160, width: 60, height: 30, content: 'Stories', color: '#64748B' },
    ]
  },

  d5UserFlow: {
    elements: [
      // 8-step video review flow
      { id: 'start', type: 'circle', x: 50, y: 200, width: 80, height: 80, content: 'Alex\\nOpens', color: '#0f172a' },
      { id: 'a1', type: 'arrow', x: 130, y: 240, width: 50, height: 0, content: '', color: '#94a3b8' },
      { id: 'create', type: 'rect', x: 180, y: 210, width: 100, height: 60, content: 'Create\\nreview', color: '#0f172a' },
      { id: 'a2', type: 'arrow', x: 280, y: 240, width: 50, height: 0, content: 'Create', color: '#94a3b8' },
      { id: 'room', type: 'rect', x: 330, y: 210, width: 100, height: 60, content: 'Review\\nroom', color: '#0f172a' },
      { id: 'a3', type: 'arrow', x: 430, y: 240, width: 50, height: 0, content: 'Play', color: '#94a3b8' },
      { id: 'comment', type: 'rect', x: 480, y: 210, width: 100, height: 60, content: 'Add\\ncomment', color: '#0f172a' },
      { id: 'a4', type: 'arrow', x: 580, y: 240, width: 50, height: 0, content: 'Click', color: '#94a3b8' },
      { id: 'jump', type: 'rect', x: 630, y: 210, width: 100, height: 60, content: 'Jump to\\ntime', color: '#0f172a' },
      { id: 'a5', type: 'arrow', x: 730, y: 240, width: 50, height: 0, content: 'Finish', color: '#94a3b8' },
      { id: 'summary', type: 'circle', x: 780, y: 200, width: 80, height: 80, content: 'Summary', color: '#10b981' },
      // Future expansion placeholder
      { id: 'future-label', type: 'text', x: 480, y: 320, width: 260, height: 30, content: '(Future: Reviewer name, Resolve status)', color: '#94a3b8' },
    ]
  },

  d5PrdDiscovery: {
    content: `# PRD: ReviewSession Module

## Overview
负责保存这一次审片会话的基本信息。

## User Stories
- 作为创作者，我可以输入项目名和视频链接，创建一个新的审片会话。

## Functional Requirements
### 会话创建
- 字段：projectTitle (string), videoUrl (string)
- 行为：点击「Create review room」后，生成一个临时 review ID
- 生成后自动跳转到 Review room

### 数据结构
\`\`\`typescript
ReviewSession {
  id: string
  projectTitle: string
  videoUrl: string
  createdAt: ISOString
}
\`\`\`

## Future Enhancements
- 历史会话列表
- 会话编辑/删除
`
  },

  d5PrdDetail: {
    content: `# PRD: VideoPlayer + TimecodedComments Module

## Overview
提供视频播放能力和时间轴评论功能。

## User Stories
- 在播放视频时，我可以在当前时间点添加评论，并在右侧列表中看到它们。
- 点击已有评论，可以跳转到对应时间。

## Functional Requirements
### VideoPlayer
- 提供 currentTime、seekTo(time) 能力
- 支持播放/暂停/时间拖动（可先用浏览器原生 video）
- 显示当前播放时间

### TimecodedComments
- 添加评论：基于 currentTime 创建 comment
- 评论数据结构：{ id, timestamp, text, createdAt }
- 展示评论列表：按 timestamp 升序展示
- 点击评论 → 调用 VideoPlayer.seekTo(timestamp)

### 交互
- 点击「Add」时记录 (timestamp, text)
- 评论列表实时更新
- 点击评论跳转到对应时间

## Data Structure
\`\`\`typescript
Comment {
  id: string
  sessionId: string
  timestamp: number  // 秒
  text: string
  createdAt: ISOString
}
\`\`\`
`
  },

  d5PrdRegistration: {
    content: `# PRD: ReviewSummary Module

## Overview
读取该会话所有 comments，展示汇总视图。

## User Stories
- 我可以在一个 summary 视图里看到所有评论的时间点和内容。
- 看到本次 cut 的评论总数。

## Functional Requirements
### Summary 页面
- 显示：「N comments on this cut」
- 列表：每行显示 [timestamp] + comment text
- 按 timestamp 升序排列
- 可点击评论（未来跳转到对应时间）

### 操作按钮
- 「Back to review room」→ 返回 Review room
- 「Copy share link」→ 复制当前 URL

## Future Enhancements
- 评论状态（已处理/未处理）
- 评论筛选和排序
- 导出评论列表
`
  },

  // === D9: Build Task Spec (Define L9) ===
  d9BuildSpec: {
    content: `# D9: Build Task Spec（3屏视频审片 MVP Build）

## Scope（这轮 Build 只做什么）
1. 前端实现三页：Create review / Review room / Summary（按 S5）
2. 评论数据存放在浏览器内存或 localStorage，不做真正后端
3. 支持：
   - 创建一个会话
   - 在 Review room 添加时间点评论
   - 点击评论跳转时间
   - 在 Summary 查看所有评论和总数
4. 不做：
   - 多会话列表
   - 用户登录
   - 真正的分享权限控制

## Screens & Routes
- \`/new\` → Create review (Screen A)
- \`/review/:sessionId\` → Review room (Screen B)
- \`/review/:sessionId/summary\` → Summary (Screen C)

## Data Model（前端层面）
\`\`\`typescript
ReviewSession {
  id: string
  projectTitle: string
  videoUrl: string
  createdAt: ISOString
}

Comment {
  id: string
  sessionId: string
  timestamp: number  // 秒
  text: string
  createdAt: ISOString
}
\`\`\`

## Behavior Rules
1. 创建会话：
   - 填完表单 → 生成 sessionId → 存入 localStorage → 跳转到 /review/:sessionId
2. 添加评论：
   - 从 video player 拿 currentTime（四舍五入到秒）
   - 创建 Comment → 存入 localStorage → 刷新右侧列表
3. 点击评论：
   - 调用 seekTo(timestamp)，播放头跳到对应秒
4. Summary 页：
   - 读取该 session 的所有 comment
   - 统计数量，显示「N comments on this cut」

## 非目标（本轮 Build 明确不做）
- 评论编辑/删除
- 评论状态（已处理/未处理）
- 评论作者（reviewer name）
- 后端存储

## 验收标准
1. 在本地 demo 中：从 /new → /review/:id → /review/:id/summary 可以顺利走完
2. 至少添加 3 条评论，Summary 能正确显示时间点和总数
3. 点击任一评论，视频能跳到对应时间点
4. 全程不需要登录 / 注册，也不会出现死路或报错页面
`
  },

  // === Legacy data (keeping for backward compatibility) ===
  storyMap: {
    elements: [
      // Epic 1: User Discovery
      { id: 'epic-1', type: 'rect', x: 50, y: 50, width: 180, height: 60, content: 'Epic: User Discovery', color: '#3B82F6' },
      { id: 'story-1-1', type: 'rect', x: 50, y: 130, width: 160, height: 50, content: 'Browse Events', color: '#93C5FD' },
      { id: 'story-1-2', type: 'rect', x: 50, y: 200, width: 160, height: 50, content: 'View Event Details', color: '#93C5FD' },
      { id: 'arrow-1-1', type: 'arrow', x: 130, y: 110, width: 0, height: 20, content: '', color: '#64748B' },
      
      // Epic 2: Event Participation
      { id: 'epic-2', type: 'rect', x: 280, y: 50, width: 180, height: 60, content: 'Epic: Participation', color: '#10B981' },
      { id: 'story-2-1', type: 'rect', x: 280, y: 130, width: 160, height: 50, content: 'Register for Event', color: '#6EE7B7' },
      { id: 'story-2-2', type: 'rect', x: 280, y: 200, width: 160, height: 50, content: 'Manage Bookings', color: '#6EE7B7' },
      { id: 'arrow-2-1', type: 'arrow', x: 360, y: 110, width: 0, height: 20, content: '', color: '#64748B' },
      
      // Epic 3: Event Creation
      { id: 'epic-3', type: 'rect', x: 510, y: 50, width: 180, height: 60, content: 'Epic: Event Creation', color: '#F59E0B' },
      { id: 'story-3-1', type: 'rect', x: 510, y: 130, width: 160, height: 50, content: 'Create New Event', color: '#FCD34D' },
      { id: 'story-3-2', type: 'rect', x: 510, y: 200, width: 160, height: 50, content: 'Manage My Events', color: '#FCD34D' },
      { id: 'arrow-3-1', type: 'arrow', x: 590, y: 110, width: 0, height: 20, content: '', color: '#64748B' },
      
      // Labels
      { id: 'label-epic', type: 'text', x: -80, y: 70, width: 60, height: 30, content: 'Epics', color: '#64748B' },
      { id: 'label-story', type: 'text', x: -80, y: 160, width: 60, height: 30, content: 'Stories', color: '#64748B' },
    ]
  },

  // === Act 3: User Flow ===
  userFlow: {
    elements: [
      // -- Section 1: Discovery --
      { id: 'start', type: 'circle', x: 50, y: 250, width: 100, height: 100, content: 'User\\nLands', color: '#0f172a' },
      { id: 'a1', type: 'arrow', x: 150, y: 300, width: 100, height: 0, content: '', color: '#94a3b8' },
      { id: 'home', type: 'rect', x: 250, y: 270, width: 140, height: 60, content: 'Home Page', color: '#0f172a' },
      { id: 'a2', type: 'arrow', x: 390, y: 300, width: 80, height: 0, content: 'Search', color: '#94a3b8' },
      { id: 'explore', type: 'rect', x: 470, y: 270, width: 140, height: 60, content: 'Explore Feed', color: '#0f172a' },
      
      // -- Section 2: Decision --
      { id: 'a3', type: 'arrow', x: 540, y: 330, width: 0, height: 80, content: '', color: '#94a3b8' },
      { id: 'decide', type: 'diamond', x: 490, y: 410, width: 100, height: 100, content: 'Find\\nEvent?', color: '#0f172a' },
      { id: 'a4', type: 'arrow', x: 590, y: 460, width: 80, height: 0, content: 'Yes', color: '#94a3b8' },
      { id: 'detail', type: 'rect', x: 670, y: 430, width: 140, height: 60, content: 'Event Detail', color: '#0f172a' },

      // -- Section 3: Action --
      { id: 'a5', type: 'arrow', x: 740, y: 490, width: 0, height: 80, content: 'RSVP', color: '#94a3b8' },
      { id: 'rsvp', type: 'circle', x: 690, y: 570, width: 100, height: 100, content: 'Success', color: '#10b981' },

      // -- Section 4: Creation Flow (Branch) --
      { id: 'a6', type: 'arrow', x: 320, y: 270, width: 0, height: -100, content: 'Host', color: '#94a3b8' },
      { id: 'create', type: 'rect', x: 260, y: 70, width: 120, height: 60, content: 'Create Event', color: '#0f172a' },
      { id: 'a7', type: 'arrow', x: 380, y: 100, width: 290, height: 0, content: 'Publish', color: '#94a3b8' },
      { id: 'a8', type: 'arrow', x: 670, y: 100, width: 70, height: 330, content: '', color: '#94a3b8' }
    ]
  },

  // === Act 4: PRD Documents ===
  prdHome: {
    content: `# PRD: Home Page

## Overview
The Home page is the primary landing experience for all users. It should immediately communicate the value proposition and guide users to either explore events or create their own.

## User Stories
- As a visitor, I want to understand what Paraflow does within 5 seconds
- As a user, I want to quickly access the Explore page to find events
- As a host, I want a clear CTA to create a new event

## Functional Requirements
### Hero Section
- Headline: "Host beautiful events. Build community."
- Subheadline: Brief value proposition (max 2 lines)
- Primary CTA: "Start Hosting" → Create Event page
- Secondary CTA: "Explore Events" → Explore page

### Social Proof Section
- Display logos of notable communities using Paraflow
- Optional: Show event count or user statistics

## Design Notes
- Use gradient backgrounds for visual appeal
- Ensure CTAs have hover states with scale effect
- Mobile-responsive: Stack CTAs vertically on small screens
`
  },
  prdExplore: {
    content: `# PRD: Explore Page

## Overview
The Explore page allows users to discover and browse upcoming events. It should support filtering and present events in an appealing card-based layout.

## User Stories
- As a user, I want to browse all upcoming events
- As a user, I want to filter events by category (Tech, Art, Social)
- As a user, I want to click an event card to see its details

## Functional Requirements
### Header
- Page title: "Upcoming Events"
- Filter pills: All, Tech, Art, Social (horizontally scrollable on mobile)

### Event Grid
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Each card displays:
  - Cover image (aspect ratio 4:3)
  - Date/time badge
  - Event title
  - Brief description (max 2 lines, truncated)
  - Price tag (if applicable)

### Interactions
- Card hover: Slight scale effect, image zoom
- Click card: Navigate to Event Detail page

## API Requirements
- GET /api/events?category={category}&page={page}
- Response includes: id, title, description, coverImage, dateTime, price
`
  },
  prdDetail: {
    content: `# PRD: Event Detail Page

## Overview
The Event Detail page provides comprehensive information about a specific event and enables users to register/RSVP.

## User Stories
- As a user, I want to see all details about an event before registering
- As a user, I want to know the exact location and time
- As a user, I want to register with one click

## Functional Requirements
### Hero Section
- Full-width cover image with gradient overlay
- Event title (large, bold)
- Category badge
- Host information with avatar

### Content Section
- "About this event" with full description
- Location with embedded map (or map placeholder)
- Address and venue name

### Registration Sidebar (Sticky on scroll)
- Date and time display
- Register button (prominent CTA)
- Attendee count ("154 people going")
- Calendar add options

## Design Notes
- Use two-column layout on desktop (content + sidebar)
- Sidebar becomes fixed footer on mobile
- Register button should have hover/active states
`
  },
  prdCreate: {
    content: `# PRD: Create Event Page

## Overview
The Create Event page allows hosts to create new events with minimal friction. Focus on essential fields first, with optional advanced settings.

## User Stories
- As a host, I want to create an event quickly (under 2 minutes)
- As a host, I want AI to help generate event descriptions
- As a host, I want to preview my event before publishing

## Functional Requirements
### Required Fields
- Event Name (text input)
- Start Date (date picker)
- Start Time (time picker)
- Location (address search or "Online" toggle)

### Optional Fields
- Description (textarea with AI Generate button)
- Cover Image (upload or URL)
- Capacity limit
- Registration type (Open / Approval required)

### Actions
- Cancel: Return to previous page
- Publish: Create event and navigate to Event Detail
- Save Draft: (Future feature)

## Design Notes
- Clean, form-based layout
- AI Generate button should have pulsing indicator
- Show validation errors inline
- Success state: Redirect to created event page
`
  },
  prdProfile: {
    content: `# PRD: Profile / My Events Page

## Overview
The Profile page serves as the user's dashboard, showing their registered events and hosting history.

## User Stories
- As a user, I want to see all events I'm registered for
- As a host, I want to see events I'm hosting
- As a user, I want to access my past event history

## Functional Requirements
### Profile Header
- User avatar (with gradient fallback)
- User name
- Member since date
- Events attended count
- Edit Profile link

### Tab Navigation
- Upcoming (default active)
- Hosting
- Past

### Event List
Each item displays:
- Date (large, prominent)
- Event title
- Location and time
- Status badge (Registered / Hosting)
- Click navigates to Event Detail

## Design Notes
- Use card-based list layout
- Hover states on event items
- Empty states for each tab ("No upcoming events")
- Upcoming tab should show chronological order
`
  },

  // === Legacy data (keeping for backward compatibility) ===
  doc1: {
    content: `# User Personas

## The Social Explorer
**Demographics:**
- Age: 25-40
- Occupation: Tech/Creative Professionals
- Location: Urban Hubs (SF, NYC, London)

**Goals:**
- Find unique, high-quality events.
- Connect with like-minded peers.
- Avoid "spammy" or generic meetups.

**Frustrations:**
- Clunky RSVP processes (Eventbrite).
- Ugly event pages.
- Disconnected calendars.
`
  },
  doc2: {
    content: `# Product Charter: Paraflow Clone

## Vision
To build the **Operating System for Communities**. We want to make gathering people together as easy and beautiful as creating a Notion page.

## Core Principles
1. **Design First:** Events are social signaling. They must look amazing.
2. **Minimal Friction:** One-click registration. Magic links. No passwords.
3. **Calendar Centric:** If it's not on the calendar, it doesn't exist.
`
  },
  doc3: {
    content: `# Core Requirements (MVP)

### 1. Event Page Builder (CMS)
- [ ] Rich text editor for description.
- [ ] Cover image uploader with auto-cropping.
- [ ] Location picker (Google Maps integration).

### 2. Registration System
- [ ] Guest vs. Approval-only modes.
- [ ] QR Code generation for check-in.

### 3. User Accounts
- [ ] Magic Link login (Email only).
- [ ] "My Events" dashboard.
`
  },
  docDevPlan: {
    content: `# Development Task Plan

## Phase 1: Foundation
- [ ] Set up project repository and CI/CD pipeline
- [ ] Configure development, staging, production environments
- [ ] Initialize database with migration system

## Phase 2: Authentication System
- [ ] Implement magic link generation and validation
- [ ] User session management with Redis
- [ ] Email service integration (SendGrid)

## Phase 3: Event Management
- [ ] Create Event CRUD APIs
- [ ] Image upload and processing pipeline
- [ ] Location geocoding service

## Phase 4: RSVP & Attendees
- [ ] RSVP flow with capacity limits
- [ ] QR code generation for check-in
- [ ] Calendar sync integration (Google/Apple)

## Phase 5: Dashboard & Analytics
- [ ] User dashboard with event history
- [ ] Host analytics and insights
- [ ] Notification system
`
  },
  docTechStack: {
    content: `# Technology Stack

## Backend
**Runtime:** Node.js 20+ (LTS)
**Framework:** Express.js
- Proven, lightweight, large ecosystem
- Easy to scale horizontally

**Database:** PostgreSQL 15+
- Strong ACID guarantees for transactions
- JSON support for flexible event metadata
- Geospatial extensions for location features

**Cache/Queue:** Redis 7+
- Session storage
- Magic link token management
- Background job processing

## Frontend
**Framework:** React 19 + TypeScript
**Styling:** Tailwind CSS
**State:** React Context (minimal dependencies)

## Third-party Services
- **Email:** SendGrid (transactional emails)
- **Storage:** AWS S3 (event images)
- **Calendar:** Google Calendar API
- **Maps:** Google Maps API
- **Monitoring:** Sentry (error tracking)
`
  },
  docArchitecture: {
    content: `# System Architecture

## High-Level Design

\`\`\`
┌─────────────┐
│   Client    │ (React SPA)
└──────┬──────┘
       │ HTTPS
┌──────▼──────────────────┐
│   Load Balancer (Nginx) │
└──────┬──────────────────┘
       │
┌──────▼──────────────────┐
│   API Server (Node.js)  │
│   - Express Routes      │
│   - Business Logic      │
└──┬────────┬─────────────┘
   │        │
   │        └──────────┐
   │                   │
┌──▼──────┐  ┌────────▼─────┐
│PostgreSQL│  │ Redis Cache  │
│ Primary  │  │ + Job Queue  │
└──────────┘  └──────────────┘
\`\`\`

## API Design Patterns
- RESTful conventions
- JWT for session management
- Rate limiting per user/IP
- Pagination for list endpoints

## Data Flow
1. **User creates event** → Upload to S3 → Save metadata to PostgreSQL
2. **User RSVPs** → Update attendance → Queue calendar sync → Send confirmation email
3. **Magic link login** → Generate token (Redis) → Email link → Verify & create session

## Scalability Considerations
- Stateless API servers (horizontal scaling)
- Database read replicas for analytics
- CDN for static assets and images
- Background jobs for email/calendar sync
`
  },
  docDataModel: {
    content: `# Data Model Design

## Core Tables

### users
\`\`\`sql
id            UUID PRIMARY KEY
email         VARCHAR(255) UNIQUE NOT NULL
name          VARCHAR(255)
avatar_url    TEXT
created_at    TIMESTAMP DEFAULT NOW()
last_login    TIMESTAMP
\`\`\`
**Indexes:** email (unique), created_at

### events
\`\`\`sql
id            UUID PRIMARY KEY
title         VARCHAR(255) NOT NULL
description   TEXT
cover_image   TEXT
location      VARCHAR(255)
location_geo  POINT  -- PostGIS for geospatial queries
start_time    TIMESTAMP NOT NULL
end_time      TIMESTAMP
capacity      INTEGER
host_id       UUID REFERENCES users(id)
created_at    TIMESTAMP DEFAULT NOW()
\`\`\`
**Indexes:** host_id, start_time, location_geo (spatial)

### rsvps
\`\`\`sql
id            UUID PRIMARY KEY
event_id      UUID REFERENCES events(id)
user_id       UUID REFERENCES users(id)
status        ENUM('pending', 'confirmed', 'cancelled')
checked_in    BOOLEAN DEFAULT FALSE
qr_code       VARCHAR(64) UNIQUE
created_at    TIMESTAMP DEFAULT NOW()

UNIQUE(event_id, user_id)
\`\`\`
**Indexes:** event_id, user_id, qr_code (unique)

### magic_links
\`\`\`sql
token         VARCHAR(64) PRIMARY KEY
email         VARCHAR(255) NOT NULL
expires_at    TIMESTAMP NOT NULL
used          BOOLEAN DEFAULT FALSE
\`\`\`
**TTL:** Auto-delete after 24 hours (Redis preferred)

## Relationships
- users 1:N events (host)
- users N:M events (attendees via rsvps)
- events 1:N rsvps
`
  },
  whiteboard: {
    elements: [
        // -- Section 1: Discovery --
        { id: 'start', type: 'circle', x: 50, y: 250, width: 100, height: 100, content: 'User\nLands', color: '#0f172a' },
        
        { id: 'a1', type: 'arrow', x: 150, y: 300, width: 100, height: 0, content: '', color: '#94a3b8' },
        
        { id: 'home', type: 'rect', x: 250, y: 270, width: 140, height: 60, content: 'Home Page', color: '#0f172a' },
        
        { id: 'a2', type: 'arrow', x: 390, y: 300, width: 80, height: 0, content: 'Search', color: '#94a3b8' },
        
        { id: 'explore', type: 'rect', x: 470, y: 270, width: 140, height: 60, content: 'Explore Feed', color: '#0f172a' },
        
        // -- Section 2: Decision --
        { id: 'a3', type: 'arrow', x: 540, y: 330, width: 0, height: 80, content: '', color: '#94a3b8' },
        
        { id: 'decide', type: 'diamond', x: 490, y: 410, width: 100, height: 100, content: 'Find\nEvent?', color: '#0f172a' },
        
        { id: 'a4', type: 'arrow', x: 590, y: 460, width: 80, height: 0, content: 'Yes', color: '#94a3b8' },
        
        { id: 'detail', type: 'rect', x: 670, y: 430, width: 140, height: 60, content: 'Event Detail', color: '#0f172a' },

        // -- Section 3: Action --
        { id: 'a5', type: 'arrow', x: 740, y: 490, width: 0, height: 80, content: 'RSVP', color: '#94a3b8' },
        
        { id: 'rsvp', type: 'circle', x: 690, y: 570, width: 100, height: 100, content: 'Success', color: '#10b981' }, // Success state

        // -- Section 4: Creation Flow (Branch) --
        { id: 'a6', type: 'arrow', x: 320, y: 270, width: 0, height: -100, content: 'Host', color: '#94a3b8' },
        
        { id: 'create', type: 'rect', x: 260, y: 70, width: 120, height: 60, content: 'Create Event', color: '#0f172a' },

        { id: 'a7', type: 'arrow', x: 380, y: 100, width: 290, height: 0, content: 'Publish', color: '#94a3b8' },
        
        // Connect back to detail
        { id: 'a8', type: 'arrow', x: 670, y: 100, width: 70, height: 330, content: '', color: '#94a3b8' }
    ]
  },
  screen1: {
    screenName: "Home",
    variant: 'web',
    plan: `# Home Page Strategy
- **Goal**: Convert visitors to "Explorers" or "Hosts".
- **Hero Section**: High impact visual, clear value prop.
- **Visuals**: Minimalist, whitespace heavy, premium feel.
`, 
    htmlContent: `
      <div class="bg-white min-h-full font-sans text-slate-900 flex flex-col">
        ${NAV_HTML}
        <main class="flex-1">
            <!-- Hero -->
            <header class="py-32 px-8 text-center border-b border-slate-50 bg-gradient-to-b from-slate-50 to-white">
                <div class="inline-block mb-6 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide animate-in fade-in slide-in-from-bottom-4">
                    New: Calendar Sync v2.0
                </div>
                <h1 class="text-6xl md:text-7xl font-bold tracking-tight mb-8 text-slate-900 max-w-4xl mx-auto leading-tight">
                    Host beautiful events. <br/>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Build community.</span>
                </h1>
                <p class="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                    The operating system for communities. Delightful event pages, magic one-click registration, and powerful insights.
                </p>
                <div class="flex items-center justify-center gap-4">
                    <button class="px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20" data-to="node-screen-4">
                        Start Hosting
                    </button>
                    <button class="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors" data-to="node-screen-2">
                        Explore Events
                    </button>
                </div>
            </header>

            <!-- Social Proof -->
            <section class="py-16 border-b border-slate-100">
                <p class="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-8">Trusted by world-class communities</p>
                <div class="flex justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                    <div class="h-8 w-24 bg-slate-800 rounded"></div>
                    <div class="h-8 w-24 bg-slate-800 rounded"></div>
                    <div class="h-8 w-24 bg-slate-800 rounded"></div>
                    <div class="h-8 w-24 bg-slate-800 rounded"></div>
                </div>
            </section>
        </main>
        ${FOOTER_HTML}
      </div>
    `
  },
  screen2: { 
    screenName: "Explore", 
    variant: 'web', 
    plan: `# Explore Logic
- **Grid Layout**: Responsive cards.
- **Filters**: Pill-based filtering (Tech, Art, Social).
- **Card Design**: Cover image takes dominance. Date prominence.
`, 
    htmlContent: `
      <div class="bg-white min-h-full font-sans text-slate-900 flex flex-col">
        ${NAV_HTML}
        <main class="flex-1 max-w-7xl mx-auto w-full px-8 py-12">
            <div class="flex items-center justify-between mb-12">
                <h2 class="text-3xl font-bold text-slate-900">Upcoming Events</h2>
                <div class="flex gap-2">
                    <button class="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium">All</button>
                    <button class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-medium transition-colors">Tech</button>
                    <button class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-medium transition-colors">Art</button>
                    <button class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-medium transition-colors">Social</button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="group cursor-pointer" data-to="node-screen-3">
                    <div class="aspect-[4/3] bg-slate-200 rounded-2xl mb-4 overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm">FREE</div>
                    </div>
                    <div class="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wide">Tomorrow, 6:00 PM</div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">Founders & Coffee: SF Edition</h3>
                    <p class="text-slate-500 text-sm line-clamp-2">Join 50+ founders for a casual evening of networking and great coffee at The Center.</p>
                </div>

                 <!-- Card 2 -->
                <div class="group cursor-pointer" data-to="node-screen-3">
                    <div class="aspect-[4/3] bg-slate-200 rounded-2xl mb-4 overflow-hidden relative">
                         <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div class="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Oct 24, 8:00 PM</div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">Neon Nights Gallery Opening</h3>
                    <p class="text-slate-500 text-sm line-clamp-2">Experience the new wave of digital art installations in the heart of the Mission district.</p>
                </div>

                 <!-- Card 3 -->
                <div class="group cursor-pointer" data-to="node-screen-3">
                    <div class="aspect-[4/3] bg-slate-200 rounded-2xl mb-4 overflow-hidden relative">
                         <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div class="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Nov 02, 10:00 AM</div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">AI Systems Design Workshop</h3>
                    <p class="text-slate-500 text-sm line-clamp-2">Deep dive into LLM orchestration. Bring your laptop and your curiosity.</p>
                </div>
            </div>
        </main>
        ${FOOTER_HTML}
      </div>
    `
  },
  screen3: { 
    screenName: "Event Detail", 
    variant: 'web', 
    plan: `# Detail Page Logic
- **Sticky CTA**: Register button always visible or prominently placed.
- **Map**: Visual context.
- **Host Info**: Trust signal.
`, 
    htmlContent: `
      <div class="bg-white min-h-full font-sans text-slate-900 flex flex-col">
        ${NAV_HTML}
        <div class="relative h-[400px] w-full overflow-hidden">
            <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
            <div class="absolute bottom-0 left-0 w-full p-8 md:p-16">
                 <div class="max-w-5xl mx-auto">
                    <div class="inline-block px-3 py-1 rounded-lg bg-white/20 backdrop-blur text-white text-xs font-bold mb-4 border border-white/10">
                        TECH & SOCIAL
                    </div>
                    <h1 class="text-4xl md:text-6xl font-bold text-white mb-4">Founders & Coffee: SF Edition</h1>
                    <div class="flex items-center gap-4 text-white/80">
                        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-indigo-500"></div> Hosted by <strong>Paraflow Team</strong></div>
                    </div>
                 </div>
            </div>
        </div>

        <main class="flex-1 max-w-5xl mx-auto w-full px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div class="lg:col-span-2 space-y-8">
                <div>
                    <h3 class="text-xl font-bold text-slate-900 mb-4">About this event</h3>
                    <div class="prose text-slate-600 leading-relaxed">
                        <p>Join us for a casual evening of networking and great conversations at The Center. Whether you're building a startup, scaling a product, or just curious about the SF tech scene, this is the place to be.</p>
                        <p class="mt-4">No agenda, no speakers, just good vibes and great coffee (or tea!).</p>
                    </div>
                </div>
                
                <div class="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 class="font-bold text-slate-900 mb-4">Location</h3>
                    <div class="aspect-video bg-slate-200 rounded-xl relative overflow-hidden">
                        <!-- Mock Map -->
                         <div class="absolute inset-0 flex items-center justify-center text-slate-400 font-mono text-sm bg-slate-200">
                            Google Maps View
                         </div>
                    </div>
                    <div class="mt-4 font-medium text-slate-900">The Center SF</div>
                    <div class="text-slate-500 text-sm">548 Fillmore St, San Francisco, CA</div>
                </div>
            </div>

            <div class="lg:col-span-1">
                <div class="sticky top-24 p-6 border border-slate-200 rounded-2xl shadow-sm bg-white">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="p-3 bg-slate-100 rounded-lg">
                            <div class="text-center leading-none">
                                <div class="text-xs text-slate-500 uppercase font-bold">OCT</div>
                                <div class="text-xl font-bold text-slate-900">24</div>
                            </div>
                        </div>
                        <div>
                            <div class="font-bold text-slate-900">Thursday</div>
                            <div class="text-sm text-slate-500">6:00 PM - 9:00 PM</div>
                        </div>
                    </div>

                    <button class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]" data-to="node-screen-5">
                        Register for Event
                    </button>
                    
                    <div class="mt-4 text-center text-xs text-slate-400">
                        154 people going
                    </div>
                </div>
            </div>
        </main>
      </div>
    `
  },
  screen4: { 
    screenName: "Create Event", 
    variant: 'web', 
    plan: `# Creator Flow
- **Simple Inputs**: Focus on title and time first.
- **Preview**: Show what they are building.
- **Magic**: AI auto-generates the description.
`, 
    htmlContent: `
      <div class="bg-white min-h-full font-sans text-slate-900 flex flex-col">
        ${NAV_HTML}
        <main class="flex-1 max-w-3xl mx-auto w-full px-8 py-12">
             <div class="mb-10">
                <h1 class="text-4xl font-bold text-slate-900 mb-2">Create Event</h1>
                <p class="text-slate-500">Let's get your event set up in seconds.</p>
             </div>

             <div class="space-y-8">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Event Name</label>
                    <input type="text" placeholder="e.g. Sunday Morning Hike" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-lg" />
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                        <input type="date" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                         <label class="block text-sm font-bold text-slate-700 mb-2">Start Time</label>
                        <input type="time" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                </div>

                 <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Location</label>
                    <div class="flex gap-2">
                        <input type="text" placeholder="Search for a venue..." class="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                        <button class="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-600">Online</button>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between mb-2">
                        <label class="block text-sm font-bold text-slate-700">Description</label>
                        <button class="text-xs font-bold text-emerald-600 flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> AI Generate</button>
                    </div>
                    <textarea rows="4" placeholder="What is this event about?" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
                </div>
                
                <hr class="border-slate-100" />

                <div class="flex justify-end gap-4">
                    <button class="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors" data-to="node-screen-1">Cancel</button>
                    <button class="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform" data-to="node-screen-3">Publish Event</button>
                </div>
             </div>
        </main>
      </div>
    `
  },
  screen5: { 
    screenName: "Profile", 
    variant: 'web', 
    plan: `# User Dashboard
- **Ticket Wallet**: Easy access to QR codes.
- **Past Events**: Social proof of history.
- **Settings**: Notifications and profile edit.
`, 
    htmlContent: `
      <div class="bg-white min-h-full font-sans text-slate-900 flex flex-col">
        ${NAV_HTML}
        <main class="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
             <div class="flex items-center gap-6 mb-12">
                <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 ring-4 ring-white shadow-lg"></div>
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Alex Designer</h1>
                    <p class="text-slate-500">Member since 2023 • 12 Events Attended</p>
                    <button class="mt-2 text-sm font-bold text-slate-900 hover:underline">Edit Profile</button>
                </div>
             </div>

             <div class="border-b border-slate-200 flex gap-8 mb-8">
                <button class="pb-4 border-b-2 border-slate-900 font-bold text-slate-900">Upcoming</button>
                <button class="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Hosting</button>
                <button class="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-900">Past</button>
             </div>

             <div class="space-y-4">
                <!-- Ticket Item -->
                <div class="p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow flex items-center gap-6 cursor-pointer" data-to="node-screen-3">
                    <div class="w-16 text-center">
                        <div class="text-xs font-bold text-slate-400 uppercase">OCT</div>
                        <div class="text-2xl font-bold text-slate-900">24</div>
                    </div>
                    <div class="h-12 w-px bg-slate-100"></div>
                    <div class="flex-1">
                        <h3 class="font-bold text-lg text-slate-900">Founders & Coffee: SF Edition</h3>
                        <p class="text-slate-500 text-sm">The Center SF • 6:00 PM</p>
                    </div>
                    <div class="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-lg">
                        Registered
                    </div>
                </div>

                 <!-- Ticket Item 2 -->
                <div class="p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow flex items-center gap-6 cursor-pointer" data-to="node-screen-2">
                    <div class="w-16 text-center">
                        <div class="text-xs font-bold text-slate-400 uppercase">NOV</div>
                        <div class="text-2xl font-bold text-slate-900">02</div>
                    </div>
                    <div class="h-12 w-px bg-slate-100"></div>
                    <div class="flex-1">
                        <h3 class="font-bold text-lg text-slate-900">AI Systems Design Workshop</h3>
                        <p class="text-slate-500 text-sm">Moscone Center • 10:00 AM</p>
                    </div>
                    <div class="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-lg">
                        Registered
                    </div>
                </div>
             </div>
        </main>
      </div>
    `
  },
  tableUsers: {
    columns: ['id', 'name', 'email', 'avatar_url', 'role'],
    rows: [
        { id: 'u_1', name: 'Alex Designer', email: 'alex@example.com', avatar_url: '/avatars/alex.jpg', role: 'member' },
        { id: 'u_2', name: 'Sarah Founder', email: 'sarah@startup.io', avatar_url: '/avatars/sarah.jpg', role: 'host' },
        { id: 'u_3', name: 'Mike Dev', email: 'mike@code.com', avatar_url: '/avatars/mike.jpg', role: 'member' },
    ]
  },
  tableEvents: {
    columns: ['id', 'title', 'date', 'location', 'price', 'host_id'],
    rows: [
        { id: 'e_1', title: 'Founders & Coffee: SF Edition', date: '2024-10-24 18:00', location: 'The Center SF', price: 'Free', host_id: 'u_2' },
        { id: 'e_2', title: 'Neon Nights Gallery Opening', date: '2024-10-24 20:00', location: 'Mission District', price: 'Free', host_id: 'u_4' },
        { id: 'e_3', title: 'AI Systems Design Workshop', date: '2024-11-02 10:00', location: 'Moscone Center', price: '$50', host_id: 'u_5' },
    ]
  },
  apiLogin: {
      method: 'POST',
      path: '/api/auth/login',
      description: 'Send magic link to user email.',
      params: [{ name: 'email', type: 'string', required: true }],
      response: '{ "success": true, "message": "Magic link sent" }'
  }
};

const App = () => {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [pins, setPins] = useState<CanvasPin[]>([]);
  const [sections, setSections] = useState<any[]>([]); // Will be populated during simulation or user creation
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'welcome', type: 'ai', role: 'ai', content: 'Hi! I can help you turn your idea into a full product prototype. Just describe your app idea to get started!', timestamp: Date.now() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // 从 localStorage 恢复用户偏好
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 420;
  });
  const [simulationStarted, setSimulationStarted] = useState(false);

  // 新增状态：问题流程和执行控制
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsCompleted, setQuestionsCompleted] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanStep[] | null>(null);

  // Agent 进程可视化状态
  const [agentIsRunning, setAgentIsRunning] = useState(false);
  const [isObservationMode, setIsObservationMode] = useState(false);
  const [currentOperatingNodeId, setCurrentOperatingNodeId] = useState<string | null>(null);
  const [justCreatedNodeIds, setJustCreatedNodeIds] = useState<string[]>([]);
  const [currentTaskName, setCurrentTaskName] = useState<string>('');

  // Sync observation mode with agent running state
  // - Auto-enter observation mode when agent starts
  // - Force exit observation mode when agent stops (prevent residual state)
  const prevAgentIsRunningRef = useRef(false);
  useEffect(() => {
    if (agentIsRunning && !prevAgentIsRunningRef.current) {
      // Agent just started → auto enter observation mode
      setIsObservationMode(true);
    } else if (!agentIsRunning && prevAgentIsRunningRef.current) {
      // Agent just stopped → force exit observation mode
      setIsObservationMode(false);
    }
    prevAgentIsRunningRef.current = agentIsRunning;
  }, [agentIsRunning]);

  // Canvas @ Mention State
  const [isCanvasSelectionMode, setIsCanvasSelectionMode] = useState(false);
  const [mentionedNodeIds, setMentionedNodeIds] = useState<string[]>([]);
  const [selectedNodeForMention, setSelectedNodeForMention] = useState<{ nodeId: string; nodeTitle: string } | null>(null);

  // Screen Element Mention State (Blue - @ Mention for ImmersiveView only)
  const [mentionedScreenElements, setMentionedScreenElements] = useState<Record<string, any>>({});

  // Camera State (Lifted)
  const [view, setView] = useState<CanvasView>({ 
      x: -(LAYOUT_CENTER_X - (window.innerWidth / 2)) * INITIAL_ZOOM, 
      y: -(LAYOUT_CENTER_Y - (window.innerHeight / 2)) * INITIAL_ZOOM, 
      scale: INITIAL_ZOOM 
  });

  // Editor & Preview States
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingWhiteboardId, setEditingWhiteboardId] = useState<string | null>(null);
  const [runningScreenId, setRunningScreenId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);

  // Pin Modal State
  const [newPinPos, setNewPinPos] = useState<{x: number, y: number} | null>(null);

  // ========== Derived Confirmation State for Canvas ==========
  // Find the current pending confirmation message (if any)
  const pendingConfirmation = useMemo<PendingConfirmation | null>(() => {
    const pendingMsg = messages.find(
      msg => msg.type === 'confirmation' && msg.confirmation?.status === 'pending'
    );
    if (!pendingMsg || !pendingMsg.confirmation) return null;
    return {
      msgId: pendingMsg.id,
      title: pendingMsg.confirmation.title,
      description: pendingMsg.confirmation.description,
      items: pendingMsg.confirmation.items,
      intent: pendingMsg.confirmation.intent,
      primaryActionLabel: pendingMsg.confirmation.primaryActionLabel
    };
  }, [messages]);

  // The primary node for showing the confirmation widget (first item of pending confirmation)
  // Other nodes in the same confirmation will only show visual highlight, not the interactive widget
  const primaryConfirmationNodeId = useMemo<string | null>(() => {
    if (!pendingConfirmation || pendingConfirmation.items.length === 0) return null;
    return pendingConfirmation.items[0].nodeId;
  }, [pendingConfirmation]);

  // Build nodeId -> confirmation status mapping for all confirmation messages
  const confirmationStatusByNodeId = useMemo<Record<string, NodeConfirmationStatus>>(() => {
    const mapping: Record<string, NodeConfirmationStatus> = {};
    messages.forEach(msg => {
      if (msg.type === 'confirmation' && msg.confirmation) {
        const { status, title, revisionNote, items } = msg.confirmation;
        items.forEach(item => {
          mapping[item.nodeId] = {
            status,
            title,
            msgId: msg.id,
            revisionNote
          };
        });
      }
    });
    return mapping;
  }, [messages]);

  // Auto-focus on confirmation nodes when a new pending confirmation appears
  const prevPendingConfirmationRef = useRef<string | null>(null);
  useEffect(() => {
    // Only trigger when a NEW pending confirmation appears (not on every render)
    const currentMsgId = pendingConfirmation?.msgId ?? null;
    if (currentMsgId && currentMsgId !== prevPendingConfirmationRef.current) {
      // Calculate bounding box of all confirmation nodes
      const confirmationNodeIds = pendingConfirmation!.items.map(item => item.nodeId);
      const confirmationNodes = nodes.filter(n => confirmationNodeIds.includes(n.id));
      
      if (confirmationNodes.length > 0) {
        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        confirmationNodes.forEach(node => {
          const width = node.width || 450; // Default width
          const height = node.height || 550; // Default height
          if (node.x < minX) minX = node.x;
          if (node.y < minY) minY = node.y;
          if (node.x + width > maxX) maxX = node.x + width;
          if (node.y + height > maxY) maxY = node.y + height;
        });
        
        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const centerX = minX + boundsWidth / 2;
        const centerY = minY + boundsHeight / 2;
        
        // Calculate scale to fit all nodes with some padding
        const screenW = window.innerWidth - 420; // Account for sidebar
        const screenH = window.innerHeight;
        const padding = 150; // Extra padding around the group
        
        const scaleByWidth = (screenW - padding * 2) / boundsWidth;
        const scaleByHeight = (screenH - padding * 2) / boundsHeight;
        let targetScale = Math.min(scaleByWidth, scaleByHeight, 0.6); // Max scale 0.6 to not zoom in too much
        targetScale = Math.max(0.2, Math.min(1, targetScale)); // Clamp between 0.2 and 1
        
        // Pan to center the group
        const newX = (screenW / 2) - (centerX * targetScale);
        const newY = (screenH / 2) - (centerY * targetScale);
        
        setView({ x: newX, y: newY, scale: targetScale });
      }
    }
    prevPendingConfirmationRef.current = currentMsgId;
  }, [pendingConfirmation, nodes]);

  // --- THE DIRECTOR: Simulation Sequence ---
  const runSimulation = async () => {
      setSimulationStarted(true);

      // 1. User Request
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        type: 'user',
        role: 'user',
        content: "我想制作一个应用，brief 是这个：Video collaboration platform built by creatives, for how creatives actually work. Designed and developed solo (no investors, no team).",
        timestamp: Date.now()
      }]);
      setIsProcessing(true);

      // Wait a bit...
      await new Promise(r => setTimeout(r, 1000));

      // 2. Phase 1: 流式输出握手澄清（问题通过组件显示，这里只输出引导语和建议）
      const deliverablesPlan = `收到你的需求！这是一个视频协作平台，在开始之前，我想先确认几件事，确保我理解正确：`;

      await addStreamingAIMessage(deliverablesPlan);
      setIsProcessing(false);

      // 3. Phase 2: 显示 Step 0 握手问题（澄清 Problem/User/Scope）
      await new Promise(r => setTimeout(r, 800));
      const firstQuestion = {
        ...HANDSHAKE_QUESTIONS[0],
        allQuestions: HANDSHAKE_QUESTIONS, // 传递所有握手问题
        currentIndex: 0
      };
      setMessages(prev => [...prev, {
        id: 'question-container',  // 固定 ID，用于更新问题
        type: 'question',
        content: '',
        timestamp: Date.now(),
        question: firstQuestion
      }]);

      // Note: Actual workflow execution triggered via handleStartExecution -> executeWorkflow
  };

  const updatePlanStatus = (msgId: string, stepId: string, status: 'pending' | 'loading' | 'waiting_confirmation' | 'done') => {
      setMessages(prev => prev.map(msg => {
          if (msg.id === msgId && msg.plan) {
              const updatedPlan = msg.plan.map(s => s.id === stepId ? { ...s, status } : s);
              // 同时更新 currentPlan 状态
              setCurrentPlan(updatedPlan);
              return {
                  ...msg,
                  plan: updatedPlan
              };
          }
          return msg;
      }));
  };

  const panTo = (targetX: number, targetY: number, targetScale: number) => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      const newX = -(targetX * targetScale) + (screenW / 2);
      const newY = -(targetY * targetScale) + (screenH / 2);

      setView({ x: newX, y: newY, scale: targetScale });
  };

  // --- 问题处理函数 ---
  const handleAnswerQuestion = (messageId: string, questionId: string, optionId: string) => {
    // 1. 更新全局 selectedAnswers 状态（方便其他逻辑使用）
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));

    // 2. 更新 messages 中的问题状态，确保 UI 重新渲染时能保留选择
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.question) {
        // 更新 allQuestions 数组中对应问题的 selectedOptionId
        const updatedAllQuestions = (msg.question.allQuestions || [msg.question]).map(q => 
          q.questionId === questionId ? { ...q, selectedOptionId: optionId } : q
        );
        
        return {
          ...msg,
          question: {
            ...msg.question,
            allQuestions: updatedAllQuestions,
            // 如果是单题模式，也更新外层的 selectedOptionId
            selectedOptionId: msg.question.questionId === questionId ? optionId : msg.question.selectedOptionId
          }
        };
      }
      return msg;
    }));
  };

  const handleContinueQuestion = async (messageId: string) => {
    // 用户点击 Continue，提交所有已回答的问题
    // 将问题容器标记为折叠状态，而不是移除
    setQuestionsCompleted(true);
    setMessages(prev => prev.map(msg =>
      msg.id === 'question-container' ? { ...msg, collapsed: true } : msg
    ));

    // 1. 显示思考消息
    await new Promise(r => setTimeout(r, 500));
    const thinkingId = `thinking-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: thinkingId,
      type: 'thinking',
      content: '',
      timestamp: Date.now(),
      thinking: { content: '', status: 'thinking' }
    }]);
    
    await new Promise(r => setTimeout(r, 800));
    setMessages(prev => prev.map(msg => 
      msg.id === thinkingId ? {
        ...msg,
        thinking: { 
          content: '根据握手问答，确认：解决远程视频审片问题、目标用户是独立创作者、本轮做极小闭环 MVP (3 屏)', 
          status: 'done' 
        }
      } : msg
    ));

    // 2. 显示"好的，我确认了..."消息
    await new Promise(r => setTimeout(r, 300));
    await addStreamingAIMessage(`好的，我确认了：

- **问题**：远程视频审片的反馈混乱问题，大家各种用微信、邮件、Drive 评论，信息很散
- **用户**：自由职业视频创作者 / 小型工作室，先不管大公司多用户权限那种
- **范围**：做一个「**分享视频 → 收集时间轴评论 → 自己看汇总**」的闭环，不做团队管理、项目空间这些复杂的

接下来我会生成：

1. **Product Charter** - 把你的需求写成一份任务说明
2. **Persona** - 目标用户是谁
3. **✅ User Story** - 用户要完成什么任务（需要你确认）
4. **✅ User Flow** - 操作路径是怎样的（需要你确认）
5. **✅ PRD** - 每个模块的功能说明（需要你确认）
6. **Prototype** - 可以点击的原型`);

    // 3. 显示 TODO 组件 + Start 按钮
    await new Promise(r => setTimeout(r, 500));
    const planMsgId = 'ai-plan';
    const initialSteps: PlanStep[] = [
      { id: 'charter', label: 'Product Charter', status: 'pending' },
      { id: 'persona', label: 'Persona', status: 'pending' },
      { id: 'user-story', label: '✅ User Story（需确认）', status: 'pending' },
      { id: 'user-flow', label: '✅ User Flow（需确认）', status: 'pending' },
      { id: 'prd', label: '✅ PRD（需确认）', status: 'pending' },
      { id: 'prototype', label: 'Prototype', status: 'pending' }
    ];

    setMessages(prev => [...prev, {
      id: planMsgId,
      type: 'ai',
      role: 'ai',
      content: "点击下方按钮开始生成：",
      timestamp: Date.now(),
      plan: initialSteps,
      executionStarted: false
    }]);
  };

  const handleSkipQuestion = async (messageId: string) => {
    // 跳过所有问题，直接进入执行计划
    handleContinueQuestion(messageId);
  };

  const handleStartExecution = async (messageId: string) => {
    // 标记执行已开始
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        // 设置当前 plan，同时标记执行已开始
        if (msg.plan) {
          setCurrentPlan(msg.plan);
        }
        return { ...msg, executionStarted: true };
      }
      return msg;
    }));

    // 开始执行 6-Act 流程
    await new Promise(r => setTimeout(r, 500));
    executeWorkflow(messageId);
  };

  // 添加工具调用消息的辅助函数
  const addToolCallMessage = (tool: any, action: string, filePath?: string, status: 'loading' | 'success' | 'error' = 'loading') => {
    const msgId = `tool-${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, {
      id: msgId,
      type: 'tool_call',
      content: '',
      timestamp: Date.now(),
      toolCall: { tool, action, filePath, status }
    }]);
    return msgId;
  };

  const updateToolCallStatus = (msgId: string, status: 'loading' | 'success' | 'error') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.toolCall) {
        return {
          ...msg,
          toolCall: { ...msg.toolCall, status }
        };
      }
      return msg;
    }));
  };

  // 添加 AI 消息的辅助函数
  const addAIMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: `ai-${Date.now()}-${Math.random()}`,
      type: 'ai',
      role: 'ai',
      content,
      timestamp: Date.now()
    }]);
  };

  // 添加流式 AI 消息的辅助函数（模拟 LLM 输出效果）
  const addStreamingAIMessage = async (content: string): Promise<string> => {
    const msgId = `ai-${Date.now()}-${Math.random()}`;
    
    // 先创建空消息
    setMessages(prev => [...prev, {
      id: msgId,
      type: 'ai',
      role: 'ai',
      content: '',
      timestamp: Date.now()
    }]);

    // 流式更新消息内容
    await streamTextDynamic(content, (partial) => {
      setMessages(prev => prev.map(msg => 
        msg.id === msgId ? { ...msg, content: partial } : msg
      ));
    });

    return msgId;
  };

  // 添加 Thinking 消息的辅助函数
  const addThinkingMessage = (content: string = '', status: 'thinking' | 'done' = 'thinking') => {
    const msgId = `thinking-${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, {
      id: msgId,
      type: 'thinking',
      content: '',
      timestamp: Date.now(),
      thinking: { content, status }
    }]);
    return msgId;
  };

  const updateThinkingMessage = (msgId: string, content: string, status: 'thinking' | 'done') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.thinking) {
        return {
          ...msg,
          thinking: { content, status }
        };
      }
      return msg;
    }));
  };

  // ========== Confirmation Helpers ==========
  
  // Map to store confirmation resolve functions
  const confirmationResolversRef = useRef<Map<string, (confirmed: boolean) => void>>(new Map());

  // Add a confirmation message
  const addConfirmationMessage = (
    title: string,
    description: string,
    items: { nodeId: string; nodeType: NodeType; title: string; preview?: string }[]
  ): string => {
    const msgId = `confirmation-${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, {
      id: msgId,
      type: 'confirmation',
      content: '',
      timestamp: Date.now(),
      confirmation: {
        title,
        description,
        items,
        status: 'pending'
      }
    }]);
    return msgId;
  };

  // Wait for user confirmation (Promise-based)
  const waitForConfirmation = (msgId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmationResolversRef.current.set(msgId, resolve);
    });
  };

  // Handle confirm action
  const handleConfirm = (msgId: string) => {
    // Update message status
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.confirmation) {
        return {
          ...msg,
          confirmation: { ...msg.confirmation, status: 'confirmed' as const }
        };
      }
      return msg;
    }));
    // Resolve the promise
    const resolver = confirmationResolversRef.current.get(msgId);
    if (resolver) {
      resolver(true);
      confirmationResolversRef.current.delete(msgId);
    }
  };

  // Handle request revision action
  const handleRequestRevision = (msgId: string, note: string) => {
    // Update message status
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.confirmation) {
        return {
          ...msg,
          confirmation: { ...msg.confirmation, status: 'revision_requested' as const, revisionNote: note }
        };
      }
      return msg;
    }));
    // For now, still resolve as true to continue workflow (revision handling would need more complex logic)
    const resolver = confirmationResolversRef.current.get(msgId);
    if (resolver) {
      resolver(true);
      confirmationResolversRef.current.delete(msgId);
    }
  };

  // 添加文件操作消息的辅助函数
  type FileOperationType = 'create' | 'write' | 'edit' | 'delete' | 'move';
  type FileOperationTarget = 'file' | 'document' | 'whiteboard' | 'screen' | 'table' | 'integration' | 'section';

  const addFileOperationMessage = (
    operation: FileOperationType,
    target: FileOperationTarget,
    title: string,
    nodeId?: string,
    status: 'loading' | 'success' | 'error' = 'loading'
  ) => {
    const msgId = `file-op-${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, {
      id: msgId,
      type: 'file_operation',
      content: '',
      timestamp: Date.now(),
      fileOperation: { operation, target, title, nodeId, status }
    }]);
    return msgId;
  };

  const updateFileOperationStatus = (msgId: string, status: 'loading' | 'success' | 'error') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.fileOperation) {
        return {
          ...msg,
          fileOperation: { ...msg.fileOperation, status }
        };
      }
      return msg;
    }));
  };

  // 定位到画布节点的处理函数
  const handleLocateNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // 使用 panTo 将节点居中显示
      panTo(node.x, node.y, 0.5);
    }
  };

  // 定位并编辑节点的处理函数
  const handleLocateAndEditNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // 先定位到节点
      panTo(node.x, node.y, 0.5);
      // 延迟一点打开编辑器，让用户看到定位动画
      setTimeout(() => {
        handleEditNode(nodeId);
      }, 300);
    }
  };

  // 模拟工具调用的辅助函数
  const simulateToolCall = async (tool: 'grep' | 'read' | 'list_dir' | 'todo_read' | 'todo_write', filePath: string, delay: number = 400) => {
    const getActionText = () => {
      switch (tool) {
        case 'grep': return 'Search Code';
        case 'read': return 'Read File';
        case 'list_dir': return 'List Directory';
        case 'todo_read': return 'Read todo list';
        case 'todo_write': return 'Update todo list';
        default: return tool;
      }
    };
    const msgId = addToolCallMessage(tool, getActionText(), filePath || undefined);
    await new Promise(r => setTimeout(r, delay));
    updateToolCallStatus(msgId, 'success');
  };

  // 辅助函数：标记节点为正在操作
  const setOperatingNode = (nodeId: string | null) => {
    setCurrentOperatingNodeId(nodeId);
  };

  // 辅助函数：聚焦到节点（设置 operating 状态 + 镜头跟随）
  // 根据节点宽高动态计算缩放级别，确保节点占据视窗宽高的 50%
  const focusOnNode = (nodeId: string, nodeX: number, nodeY: number, nodeWidth: number, nodeHeight: number) => {
    setCurrentOperatingNodeId(nodeId);
    // Camera pan logic is now handled in CanvasContainer via useEffect listening to currentOperatingNodeId
  };

  // 辅助函数：标记节点刚被创建（用于弹出动画）
  const markNodeAsJustCreated = (nodeId: string) => {
    setJustCreatedNodeIds(prev => [...prev, nodeId]);
    // 动画结束后移除标记
    setTimeout(() => {
      setJustCreatedNodeIds(prev => prev.filter(id => id !== nodeId));
    }, 600);
  };

  // 执行工作流（新版：渐进式确认 + 流式输出）
  // ========== Define-Centric Workflow Engine ==========
  // Step 0 → D1 → S1 → D5 → S5 → D9 → Build
  const executeWorkflow = async (planMsgId: string) => {
    const cx = LAYOUT_CENTER_X;
    const cy = LAYOUT_CENTER_Y;

    // 开始 Agent 运行
    setAgentIsRunning(true);
    setIsObservationMode(true);

    // ============================================
    // 开始生成产物
    // ============================================
    await new Promise(r => setTimeout(r, 600));
    
    await addStreamingAIMessage(`我先来写 Product Charter 和 Persona...`);
    
    // 开始生成 Product Charter
    updatePlanStatus(planMsgId, 'charter', 'loading');
    setCurrentTaskName('Product Charter');
    
    await simulateToolCall('read', 'docs/charter-template.md', 300);

    // Define 区域布局
    const defineY = cy + DOCUMENT_SECTION_Y_OFFSET;
    
    // 创建 Project Charter
    const charterNode: CanvasNode = { 
      id: 'node-charter', 
      type: NodeType.DOCUMENT, 
      x: cx - NODE_SPACING_X / 2, 
      y: defineY, 
      title: 'Product Charter', 
      status: 'loading', 
      data: null, 
      sectionId: SECTION_IDS.DEFINE 
    };
    setNodes(prev => [...prev, charterNode]);
    markNodeAsJustCreated('node-charter');
    focusOnNode('node-charter', charterNode.x, charterNode.y, 450, 550);
    const charterOpId = addFileOperationMessage('create', 'document', 'Product Charter', 'node-charter');
    await new Promise(r => setTimeout(r, 800));
    updateFileOperationStatus(charterOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-charter' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.projectCharter } : n));
    updatePlanStatus(planMsgId, 'charter', 'done');

    await addStreamingAIMessage(`Product Charter 已生成。

这份文档明确了：
- **Problem**：远程审片反馈散落在各个渠道
- **Goal**：做一个超轻量视频审片链接
- **Scope**：创建房间 → 时间轴评论 → 汇总

你可以点击左侧的文档查看详情。`);

    // 创建 Persona
    await new Promise(r => setTimeout(r, 300));
    updatePlanStatus(planMsgId, 'persona', 'loading');
    setCurrentTaskName('Persona');
    const personaNode: CanvasNode = { 
      id: 'node-persona', 
      type: NodeType.DOCUMENT, 
      x: cx + NODE_SPACING_X / 2, 
      y: defineY, 
      title: 'User Persona', 
      status: 'loading', 
      data: null, 
      sectionId: SECTION_IDS.DEFINE 
    };
    setNodes(prev => [...prev, personaNode]);
    markNodeAsJustCreated('node-persona');
    focusOnNode('node-persona', personaNode.x, personaNode.y, 450, 550);
    const personaOpId = addFileOperationMessage('create', 'document', 'User Persona', 'node-persona');
    await new Promise(r => setTimeout(r, 800));
    updateFileOperationStatus(personaOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-persona' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.persona } : n));
    setOperatingNode(null);

    updatePlanStatus(planMsgId, 'persona', 'done');

    await addStreamingAIMessage(`Persona 已生成。

目标用户是 **Alex**：
- 独立视频创作者 / 小型工作室主理人
- 想发一个链接给客户，让对方边看边按时间点反馈
- 然后自己能在一个视图里看到所有反馈

接下来我会生成 User Story，需要你确认做什么、不做什么。`);

    // ============================================
    // User Story (需确认)
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 'user-story', 'loading');
    setCurrentTaskName('User Story');

    // D1 布局：在 Charter 下方，分两行排列避免遮挡
    // 第一行：User Story (左) + User Flow (右)
    // 第二行：PRD x3
    const d1X = cx;
    const d1Y = defineY + 700;
    const d1Row2Y = d1Y + 750; // 第二行位置，为 User Flow (高700) 留出空间

    await simulateToolCall('grep', 'user story template', 300);

    // 创建 User Story 文档 (第一行左侧)
    const userStoryNode: CanvasNode = { 
      id: 'node-user-story', 
      type: NodeType.DOCUMENT, 
      x: d1X - 550, // 左移，与 User Flow 保持间距
      y: d1Y, 
      title: 'User Story', 
      status: 'loading', 
      data: null, 
      sectionId: SECTION_IDS.DEFINE
    };
    setNodes(prev => [...prev, userStoryNode]);
    markNodeAsJustCreated('node-user-story');
    focusOnNode('node-user-story', userStoryNode.x, userStoryNode.y, 450, 550);
    const userStoryOpId = addFileOperationMessage('create', 'document', 'User Story', 'node-user-story');
    await new Promise(r => setTimeout(r, 1000));
    updateFileOperationStatus(userStoryOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-user-story' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.d1MvpCardPlan } : n));
    setOperatingNode(null);

    await addStreamingAIMessage(`User Story 已生成。

这轮我们先做最核心的部分：

- **创建审片房间** → Alex 输入项目名和视频链接
- **时间点评论** → 在播放器里添加带时间戳的评论
- **评论汇总** → 查看所有评论的汇总列表

不做项目列表，不做多文件上传，不做复杂权限。

你可以点击左侧文档查看详细内容。`);

    // User Story 确认
    const userStoryConfirmId = addConfirmationMessage(
      'User Story 确认',
      'User Story 确认后，我会继续生成 User Flow。',
      [{ nodeId: 'node-user-story', nodeType: NodeType.DOCUMENT, title: 'User Story' }]
    );
    
    const userStoryConfirmed = await waitForConfirmation(userStoryConfirmId);
    if (userStoryConfirmed) {
      await addStreamingAIMessage(`✅ **User Story 锁定** → 继续生成 User Flow 和 PRD。`);
    }
    updatePlanStatus(planMsgId, 'user-story', 'done');

    // ============================================
    // User Flow
    // ============================================
    await new Promise(r => setTimeout(r, 500));
    updatePlanStatus(planMsgId, 'user-flow', 'loading');
    setCurrentTaskName('User Flow');

    // 创建 User Flow (第一行右侧，与 User Story 保持间距)
    // User Story 宽度 450px，在 x = d1X - 550，右边界在 d1X - 100
    // User Flow 从 d1X + 50 开始，保证 150px 间距
    const userFlowNode: CanvasNode = {
      id: 'node-user-flow',
      type: NodeType.WHITEBOARD,
      x: d1X + 50,
      y: d1Y,
      title: 'User Flow (3屏)',
      status: 'loading',
      data: null,
      sectionId: SECTION_IDS.DEFINE
    };
    setNodes(prev => [...prev, userFlowNode]);
    markNodeAsJustCreated('node-user-flow');
    focusOnNode('node-user-flow', userFlowNode.x, userFlowNode.y, 850, 400);
    const userFlowOpId = addFileOperationMessage('create', 'whiteboard', 'User Flow', 'node-user-flow');
    await new Promise(r => setTimeout(r, 800));
    updateFileOperationStatus(userFlowOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-user-flow' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.d1UserFlow } : n));
    setOperatingNode(null);

    await addStreamingAIMessage(`User Flow 已生成。

这是一条 3 屏的操作路径：

1. **Create review** → Alex 输入项目名和视频链接，创建审片房间
2. **Review room** → 播放视频，在时间点添加评论
3. **Summary** → 查看所有评论汇总

你可以点击左侧的白板查看详细流程图。`);

    // User Flow 确认
    const userFlowConfirmId = addConfirmationMessage(
      'User Flow 确认',
      '这是 3 屏的操作路径：Create review → Review room → Summary。确认后将继续生成 PRD。',
      [{ nodeId: 'node-user-flow', nodeType: NodeType.WHITEBOARD, title: 'User Flow' }]
    );
    
    const userFlowConfirmed = await waitForConfirmation(userFlowConfirmId);
    if (userFlowConfirmed) {
      await addStreamingAIMessage(`✅ **User Flow 锁定** → 继续生成 PRD。`);
    }
    updatePlanStatus(planMsgId, 'user-flow', 'done');

    // ============================================
    // PRD (3 个独立文档)
    // ============================================
    await new Promise(r => setTimeout(r, 500));
    updatePlanStatus(planMsgId, 'prd', 'loading');
    setCurrentTaskName('PRD');

    // 创建 3 个 PRD 文档 (第二行，水平均匀分布)
    // 每个 Document 宽度 450px，间距 100px
    // 总宽度 = 450 * 3 + 100 * 2 = 1550px，居中起始 x = d1X - 775
    const prdConfigs = [
      { id: 'node-prd-create', x: d1X - 775, y: d1Row2Y, title: 'PRD: Create Review', data: MOCK_LUMA_DATA.d5PrdDiscovery },
      { id: 'node-prd-room', x: d1X - 225, y: d1Row2Y, title: 'PRD: Review Room', data: MOCK_LUMA_DATA.d5PrdDetail },
      { id: 'node-prd-summary', x: d1X + 325, y: d1Row2Y, title: 'PRD: Summary', data: MOCK_LUMA_DATA.d5PrdRegistration },
    ];

    for (const prd of prdConfigs) {
      await new Promise(r => setTimeout(r, 300));
      const prdNode: CanvasNode = {
        id: prd.id,
        type: NodeType.DOCUMENT,
        x: prd.x,
        y: prd.y,
        title: prd.title,
        status: 'loading',
        data: null,
        sectionId: SECTION_IDS.DEFINE
      };
      setNodes(prev => [...prev, prdNode]);
      markNodeAsJustCreated(prd.id);
      focusOnNode(prd.id, prd.x, prd.y, 450, 550);
      const prdOpId = addFileOperationMessage('create', 'document', prd.title, prd.id);
      await new Promise(r => setTimeout(r, 500));
      updateFileOperationStatus(prdOpId, 'success');
      setNodes(prev => prev.map(n => n.id === prd.id ? { ...n, status: 'done', data: prd.data } : n));
    }
    setOperatingNode(null);

    await addStreamingAIMessage(`PRD 已生成，共 3 个文档：

---

**PRD: Create Review**
- 输入：项目名称、视频链接（URL）
- 逻辑：校验链接有效性 → 创建 ReviewSession → 生成房间 ID
- 输出：跳转到 Review Room 页面

---

**PRD: Review Room**
- 播放器：支持播放/暂停、拖动进度条
- 评论：点击「添加评论」按钮，自动捕获当前时间点，输入评论内容
- 评论列表：右侧显示所有评论，点击可跳转到对应时间

---

**PRD: Summary**
- 读取该 Session 的所有评论
- 按时间顺序展示：时间点 + 评论内容
- 显示评论总数

---

你可以点击左侧的文档查看详细内容。`);

    // PRD 确认
    const prdConfirmId = addConfirmationMessage(
      'PRD 确认',
      'PRD 确认后，我会开始生成 Prototype。',
      [
        { nodeId: 'node-prd-create', nodeType: NodeType.DOCUMENT, title: 'PRD: Create Review' },
        { nodeId: 'node-prd-room', nodeType: NodeType.DOCUMENT, title: 'PRD: Review Room' },
        { nodeId: 'node-prd-summary', nodeType: NodeType.DOCUMENT, title: 'PRD: Summary' }
      ]
    );
    
    const prdConfirmed = await waitForConfirmation(prdConfirmId);
    if (prdConfirmed) {
      await addStreamingAIMessage(`✅ **PRD 锁定** → 正在生成 Execution Plan...`);
    }
    updatePlanStatus(planMsgId, 'prd', 'done');

    // ============================================
    // Execution Plan: 生成长期有效的执行计划文档
    // ============================================
    await new Promise(r => setTimeout(r, 600));
    setCurrentTaskName('Execution Plan');

    await addStreamingAIMessage(`## Execution Plan

现在所有 Define 产物都已确认，我来生成一份 **Execution Plan**：

这份计划将作为后续执行的**单一事实源**，包含：
- 目标与范围
- 输入引用（Charter/Persona/PRD...）
- 输出交付物
- TODO 列表（执行顺序）
- 验收标准`);

    // 创建 Execution Plan 文档节点
    // 布局：放在 PRD 第三个文档右侧
    const epX = d1X + 825; // PRD: Summary 右边 500px
    const epY = d1Row2Y;

    const executionPlanNode: CanvasNode = {
      id: 'node-execution-plan-v1',
      type: NodeType.DOCUMENT,
      x: epX,
      y: epY,
      title: 'Execution Plan — Video Review — v1',
      status: 'loading',
      data: null,
      sectionId: SECTION_IDS.DEFINE
    };
    setNodes(prev => [...prev, executionPlanNode]);
    markNodeAsJustCreated('node-execution-plan-v1');
    focusOnNode('node-execution-plan-v1', executionPlanNode.x, executionPlanNode.y, 450, 700);
    const epOpId = addFileOperationMessage('create', 'document', 'Execution Plan — Video Review — v1', 'node-execution-plan-v1');
    await new Promise(r => setTimeout(r, 1000));
    updateFileOperationStatus(epOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-execution-plan-v1' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.executionPlan } : n));
    setOperatingNode(null);

    await addStreamingAIMessage(`Execution Plan 已生成。

这份计划包含了接下来要做的 **4 个 TODO**：
1. 生成 Screen A: Create review
2. 生成 Screen B: Review room
3. 生成 Screen C: Summary
4. 创建页面间导航 Edges

点击 **Start** 开始执行！`);

    // Start 门禁确认
    const planStartMsgId = `start-plan-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: planStartMsgId,
      type: 'confirmation',
      content: '',
      timestamp: Date.now(),
      confirmation: {
        title: 'Execution Plan 已就绪',
        description: '点击 Start 开始执行计划，生成 3 屏原型。',
        items: [{ nodeId: 'node-execution-plan-v1', nodeType: NodeType.DOCUMENT, title: 'Execution Plan — Video Review — v1' }],
        status: 'pending',
        intent: 'start',
        primaryActionLabel: 'Start'
      }
    }]);

    // 等待用户点击 Start
    const planStarted = await waitForConfirmation(planStartMsgId);
    if (!planStarted) {
      // 用户要求修改，暂停工作流（未来可以生成 v2）
      setAgentIsRunning(false);
      return;
    }

    // ============================================
    // Plan TODO: 生成新的 Chat Plan TODO 消息
    // ============================================
    const planTodoSteps: PlanStep[] = [
      { id: 'plan-todo-1', label: 'Screen A: Create review', status: 'pending' },
      { id: 'plan-todo-2', label: 'Screen B: Review room', status: 'pending' },
      { id: 'plan-todo-3', label: 'Screen C: Summary', status: 'pending' },
      { id: 'plan-todo-4', label: '创建页面间导航 Edges', status: 'pending' },
    ];

    const planTodoMsgId = `plan-todo-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: planTodoMsgId,
      type: 'ai',
      role: 'ai',
      content: '开始执行 Execution Plan：',
      timestamp: Date.now(),
      plan: planTodoSteps,
      executionStarted: true // 隐藏 Start Execution 按钮
    }]);
    setCurrentPlan(planTodoSteps);

    await addStreamingAIMessage(`✅ **Plan 已启动** → 开始生成 Prototype！`);

    // ============================================
    // Prototype: 可以点击的原型 (3 屏 MVP)
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 'prototype', 'loading');
    setCurrentTaskName('Prototype');

    await addStreamingAIMessage(`## Step 2: Design L1 = Fast Prototype

基于 Execution Plan，我来快速生成 **极简 3 屏原型**：

1. **Screen A: Create review**
   - 顶部文案：Start a new video review
   - 输入框：Project title、Video URL
   - 按钮：Create review room

2. **Screen B: Review room**
   - 左侧：video player
   - 右侧：Comments panel + 评论列表
   - 底部：Add comment at [当前时间] + Finish reviewing 按钮

3. **Screen C: Summary**
   - 标题：Review summary for "Project title"
   - 列表：[时间戳] 评论内容
   - 按钮：Back to review room、Copy share link`);
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('read', 'design-system/colors.css', 300);

    // S1 Prototype 布局：在 D1 第二行 (PRD) 下方
    // D1 第二行在 d1Row2Y = defineY + 1450，PRD 高度约 550px，底部约在 defineY + 2000
    // S1 从 d1Row2Y + 700 开始，确保有足够间距
    const s1Y = d1Row2Y + 700;
    // Screen 宽度 1000px，使用 1100px 间距确保不重叠（100px padding）
    const screenSpacing = 1100;
    const s1XStart = cx - screenSpacing; // 居中：3 屏总宽度 = 1000*3 + 100*2 = 3200，起始 x = cx - 1100

    // 定义 3 屏 MVP，包含 Plan TODO ID 用于进度更新
    const s1ScreenConfigs = [
      { id: 'node-s1-a', x: s1XStart, y: s1Y, title: 'A: Create review', data: MOCK_LUMA_DATA.s1ScreenA, planTodoId: 'plan-todo-1' },
      { id: 'node-s1-b', x: s1XStart + screenSpacing, y: s1Y, title: 'B: Review room', data: MOCK_LUMA_DATA.s1ScreenB, planTodoId: 'plan-todo-2' },
      { id: 'node-s1-c', x: s1XStart + screenSpacing * 2, y: s1Y, title: 'C: Summary', data: MOCK_LUMA_DATA.s1ScreenC, planTodoId: 'plan-todo-3' },
    ];

    // 创建导航 Edges
    const s1Edges: CanvasEdge[] = [
      { id: 's1-e1', fromNode: 'node-s1-a', toNode: 'node-s1-b', label: 'Create room' },
      { id: 's1-e2', fromNode: 'node-s1-b', toNode: 'node-s1-c', label: 'Finish' },
    ];
    setEdges(s1Edges);

    // 创建每个屏幕，同时更新 Plan TODO 进度
    for (const screen of s1ScreenConfigs) {
      // 更新 Plan TODO 状态为 loading
      updatePlanStatus(planTodoMsgId, screen.planTodoId, 'loading');
      
      await addStreamingAIMessage(`正在创建 ${screen.title}...`);
      await new Promise(r => setTimeout(r, 300));

      const screenNode: CanvasNode = {
        id: screen.id,
        type: NodeType.SCREEN,
        x: screen.x,
        y: screen.y,
        title: screen.title,
        status: 'loading',
        data: null,
        sectionId: SECTION_IDS.PROTOTYPE
      };
      setNodes(prev => [...prev, screenNode]);
      markNodeAsJustCreated(screen.id);
      
      focusOnNode(screen.id, screen.x, screen.y, 1000, 780);
      const opId = addFileOperationMessage('create', 'screen', screen.title, screen.id);
      await new Promise(r => setTimeout(r, 800));
      updateFileOperationStatus(opId, 'success');
      setNodes(prev => prev.map(n => n.id === screen.id ? { ...n, status: 'done', data: screen.data } : n));
      setOperatingNode(null);
      
      // 更新 Plan TODO 状态为 done
      updatePlanStatus(planTodoMsgId, screen.planTodoId, 'done');
      await new Promise(r => setTimeout(r, 300));
    }

    // 更新 Edges TODO
    updatePlanStatus(planTodoMsgId, 'plan-todo-4', 'loading');
    await new Promise(r => setTimeout(r, 300));
    updatePlanStatus(planTodoMsgId, 'plan-todo-4', 'done');

    await addStreamingAIMessage(`这个 3 屏 MVP 闭环很清楚。

您可以点击任意屏幕预览交互流程。

---

**目前的这些内容是否符合预期？有没有需要添加或者修改的内容？**

如果没有，我会扩充其他的 User Story，来增添更多功能。`);
    updatePlanStatus(planMsgId, 'prototype', 'done');

    // ============================================
    // S1 完成后暂停，等待用户确认
    // ============================================
    const s1ConfirmId = addConfirmationMessage(
      'S1 原型确认',
      '确认后将继续 D5 结构化设计，或可提出修改意见。',
      [
        { nodeId: 'node-s1-a', nodeType: NodeType.SCREEN, title: 'Screen A: Create review' },
        { nodeId: 'node-s1-b', nodeType: NodeType.SCREEN, title: 'Screen B: Review room' },
        { nodeId: 'node-s1-c', nodeType: NodeType.SCREEN, title: 'Screen C: Summary' }
      ]
    );

    const s1Confirmed = await waitForConfirmation(s1ConfirmId);
    if (!s1Confirmed) {
      // 用户需要修改，暂停工作流
      setAgentIsRunning(false);
      return;
    }

    // ============================================
    // D5: Define L5 - Structured Plan (后续循环)
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    setCurrentTaskName('Define L5: Structured Plan');

    await addStreamingAIMessage(`✅ **S1 原型已确认** → 继续 D5 结构化设计。

## 继续：Define L5 = 结构化 Plan

我已经把刚才那条 3 屏闭环抽成了结构化 Plan：

- **Story Map 三块**：创建会话 / 时间轴评论 / 汇总
- **Flow 写清楚 8 步**
- **模块拆成** ReviewSession / VideoPlayer / TimecodedComments / ReviewSummary

这一版会作为接下来结构化原型（Design L5）的 Plan。

你觉得有哪块 Story 或模块是必须加的？

比如：
- 本轮一定要有 reviewer 名字？
- 一定要能标记 "已处理" 吗？`);
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('grep', 'story map template', 300);
    await simulateToolCall('read', 'templates/prd-template.md', 350);

    // D5 布局：在 S1 下方，避免遮挡
    // S1 在 s1Y = cy + 500，加上 Screen 高度约 800px，底部约在 cy + 1300
    // D5 从 s1Y + 900 开始，确保有足够间距
    const d5Y = s1Y + 900;
    const d5XStart = cx - 800;

    // 创建 D5 Story Map
    const d5StoryMapNode: CanvasNode = { 
      id: 'node-d5-storymap', 
      type: NodeType.WHITEBOARD, 
      x: d5XStart, 
      y: d5Y, 
      title: 'D5: Story Map', 
      status: 'loading', 
      data: null, 
      sectionId: SECTION_IDS.DEFINE
    };
    setNodes(prev => [...prev, d5StoryMapNode]);
    markNodeAsJustCreated('node-d5-storymap');
    focusOnNode('node-d5-storymap', d5StoryMapNode.x, d5StoryMapNode.y, 850, 350);
    const d5StoryMapOpId = addFileOperationMessage('create', 'whiteboard', 'D5: Story Map', 'node-d5-storymap');
    await new Promise(r => setTimeout(r, 1000));
    updateFileOperationStatus(d5StoryMapOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-d5-storymap' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.d5StoryMap } : n));

    // 创建 D5 PRDs
    const d5PrdConfigs = [
      { id: 'node-d5-prd-discovery', x: d5XStart + 900, y: d5Y, title: 'PRD: ReviewSession', data: MOCK_LUMA_DATA.d5PrdDiscovery },
      { id: 'node-d5-prd-detail', x: d5XStart + 900 + NODE_SPACING_X * 0.8, y: d5Y, title: 'PRD: VideoPlayer', data: MOCK_LUMA_DATA.d5PrdDetail },
      { id: 'node-d5-prd-registration', x: d5XStart + 900 + NODE_SPACING_X * 1.6, y: d5Y, title: 'PRD: Summary', data: MOCK_LUMA_DATA.d5PrdRegistration },
    ];

    for (const prd of d5PrdConfigs) {
      await new Promise(r => setTimeout(r, 200));
      const prdNode: CanvasNode = {
        id: prd.id,
        type: NodeType.DOCUMENT,
        x: prd.x,
        y: prd.y,
        title: prd.title,
        status: 'loading',
        sectionId: SECTION_IDS.DEFINE,
        data: null
      };
      setNodes(prev => [...prev, prdNode]);
      markNodeAsJustCreated(prd.id);
      focusOnNode(prd.id, prd.x, prd.y, 450, 550);
      const opId = addFileOperationMessage('create', 'document', prd.title, prd.id);
      await new Promise(r => setTimeout(r, 600));
      updateFileOperationStatus(opId, 'success');
      setNodes(prev => prev.map(n => n.id === prd.id ? { ...n, status: 'done', data: prd.data } : n));
    }
    setOperatingNode(null);

    // D5 确认
    const d5ConfirmId = addConfirmationMessage(
      'D5 结构化计划确认',
      '包含 Story Map（3 个 Epics）和模块拆分。确认后将升级 Prototype 为结构化版本。',
      [{ nodeId: 'node-d5-storymap', nodeType: NodeType.WHITEBOARD, title: 'Story Map' }]
    );

    const d5Confirmed = await waitForConfirmation(d5ConfirmId);
    if (d5Confirmed) {
      await addStreamingAIMessage(`✅ **Define L5 锁定** → 进入 S5。`);
    }

    // ============================================
    // S5: Design L5 - Structured Prototype
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    setCurrentTaskName('Design L5: Structured Prototype');

    await addStreamingAIMessage(`## S5: Design L5 = Structured Prototype

基于 Define L5 的结构化 Plan，我来升级原型：

- 评论列表每条加上**未来可扩展区域**（可以打勾表示"已处理"）
- 点击评论时，播放器**跳转到对应 timestamp**
- **预留** reviewer name 和 resolve 状态的位置`);
    await new Promise(r => setTimeout(r, 500));

    // S5: 添加一个说明文档，放在 S1 Screen B 下方
    // S1 高度约 800px，S5 Note 放在 S1 底部 + 100px 间距
    const s5NoteNode: CanvasNode = {
      id: 'node-s5-note',
      type: NodeType.DOCUMENT,
      x: s1XStart + screenSpacing, // 与 Screen B 对齐
      y: s1Y + 900,
      title: 'S5: Prototype Notes',
      status: 'loading',
      data: null,
      sectionId: SECTION_IDS.PROTOTYPE
    };
    setNodes(prev => [...prev, s5NoteNode]);
    markNodeAsJustCreated('node-s5-note');
    focusOnNode('node-s5-note', s5NoteNode.x, s5NoteNode.y, 450, 300);
    const s5NoteOpId = addFileOperationMessage('create', 'document', 'S5: Prototype Notes', 'node-s5-note');
    await new Promise(r => setTimeout(r, 600));
    updateFileOperationStatus(s5NoteOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-s5-note' ? { 
      ...n, 
      status: 'done', 
      data: { content: `# S5: Structured Prototype Notes

## 当前状态
S5 基于 S1 的 3 屏视频审片 MVP，已确认可用。

## 预留扩展
- **Create review 页**: 预留「历史会话列表」的占位区域
- **Review room 页**: 每条评论预留「已处理」复选框位置
- **Summary 页**: 预留筛选/排序和导出功能入口

## 未来迭代
- Reviewer name（评论者名字）
- Resolve status（已处理状态）
- 真正的分享权限控制

## 下一步
确认 D9 Build Spec 后开始构建。
` } 
    } : n));
    setOperatingNode(null);

    await addStreamingAIMessage(`我已经能想象后续要怎么加 reviewer、状态、筛选了，这版原型 OK。

下一步我希望能看到一个**真的能跑的 Review room**，哪怕只是前端 + mock。

接下来进入 **Define L9 = Build Task Spec**。`);

    // ============================================
    // D9: Define L9 - Build Task Spec
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    setCurrentTaskName('Define L9: Build Task Spec');

    await addStreamingAIMessage(`## D9: Define L9 = Build Task Spec

这份 Define L9 是专门为 Build 准备的任务说明：

- 只做 **3 页**
- 只做**本地存储**
- 只做**时间轴评论 + 跳转 + 汇总**

不会做登录、后台、团队管理，也不会做 reviewer 名字。

确认用这个 Plan 来驱动本轮 Build 吗？`);
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('read', 'templates/build-spec.md', 300);

    // D9 布局
    const d9X = cx;
    const d9Y = d5Y + 700;

    const d9SpecNode: CanvasNode = { 
      id: 'node-d9-spec', 
      type: NodeType.DOCUMENT, 
      x: d9X, 
      y: d9Y, 
      title: 'D9: Build Task Spec', 
      status: 'loading', 
      data: null, 
      sectionId: SECTION_IDS.BUILD
    };
    setNodes(prev => [...prev, d9SpecNode]);
    markNodeAsJustCreated('node-d9-spec');
    focusOnNode('node-d9-spec', d9SpecNode.x, d9SpecNode.y, 450, 700);
    const d9SpecOpId = addFileOperationMessage('create', 'document', 'D9: Build Task Spec', 'node-d9-spec');
    await new Promise(r => setTimeout(r, 1000));
    updateFileOperationStatus(d9SpecOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-d9-spec' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.d9BuildSpec } : n));
    setOperatingNode(null);

    // D9 确认
    const d9ConfirmId = addConfirmationMessage(
      'D9 Build Task Spec 确认',
      '这轮 Build 只做 3 屏视频审片 MVP：本地存储、无后端、无登录。确认后开始 Build。',
      [{ nodeId: 'node-d9-spec', nodeType: NodeType.DOCUMENT, title: 'Build Task Spec' }]
    );
    
    const d9Confirmed = await waitForConfirmation(d9ConfirmId);
    if (d9Confirmed) {
      await addStreamingAIMessage(`✅ **Define L9 锁定** → Build 开工。`);
    }

    // ============================================
    // Build: Working App
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    setCurrentTaskName('Build: Working App');

    await addStreamingAIMessage(`## Build = Working App

这就是我想要的「**最小可跑版本**」。

按 D9 规格开始 Build：
- 3 个页面：Create review / Review room / Summary
- 用 localStorage 存 ReviewSession + Comment
- 实现 routes + 基本交互逻辑

在实际开发中，这里会调用代码生成工具。本演示中，我们已经有了可运行的原型！`);
    await new Promise(r => setTimeout(r, 500));

    await simulateToolCall('grep', 'react component template', 300);
    await simulateToolCall('read', 'src/components/index.tsx', 350);

    // ============================================
    // Final Summary
    // ============================================
    await new Promise(r => setTimeout(r, 600));
    panTo(cx, cy, 0.2);

    // 结束 Agent 运行
    setAgentIsRunning(false);
    setIsObservationMode(false);
    setCurrentOperatingNodeId(null);
    setCurrentTaskName('');

    setIsProcessing(false);
    await addStreamingAIMessage(`## 🎉 流程完成！

我已经帮你完成了完整的产品定义流程：

**第一个循环**：
1. ✅ Product Charter - 任务说明
2. ✅ Persona - 目标用户 Alex
3. ✅ User Story - 3 屏审片闭环（已确认）
4. ✅ User Flow - 操作路径
5. ✅ PRD - 模块功能说明
6. ✅ Prototype - 可点击原型

**后续循环**：
7. ✅ D5 - 结构化 Plan（Story Map + PRDs）
8. ✅ S5 - 结构化 Prototype
9. ✅ D9 - Build Task Spec
10. ✅ Build - 可运行的代码

---

你可以点击任意原型屏幕进行预览！`);
  };

  // --- Standard Handlers ---
  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleBatchUpdateNodePosition = (updates: {id: string, dx: number, dy: number}[]) => {
     setNodes(prev => {
         const map = new Map<string, CanvasNode>(prev.map(n => [n.id, n]));
         updates.forEach(({id, dx, dy}) => {
             const node = map.get(id);
             if (node) {
                 map.set(id, { ...node, x: node.x + dx, y: node.y + dy });
             }
         });
         return Array.from(map.values());
     });
  };

  const handleUpdateNodeSection = (nodeId: string, sectionId: string | undefined) => {
     setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, sectionId } : n));
  };

  const handleAddNode = (node: CanvasNode) => {
      setNodes(prev => [...prev, node]);
  };

  const handleEditNode = (id: string) => {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      if (node.type === NodeType.DOCUMENT) setEditingDocId(id);
      else if (node.type === NodeType.WHITEBOARD) setEditingWhiteboardId(id);
      else if (node.type === NodeType.SCREEN) setEditingDocId(id); // Re-use markdown modal for plan editing
      else if (node.type === NodeType.TABLE) setEditingTableId(id);
      else if (node.type === NodeType.INTEGRATION) setEditingIntegrationId(id);
  };

  const handleDeleteNodes = (ids: string[]) => {
      // Delete nodes
      setNodes(prev => prev.filter(n => !ids.includes(n.id)));
      // Delete related edges
      setEdges(prev => prev.filter(e => !ids.includes(e.from) && !ids.includes(e.to)));
      // Delete related pins
      setPins(prev => prev.filter(p => !ids.includes(p.targetNodeId)));
  };

  const handleNavigate = (targetId: string) => {
    setRunningScreenId(targetId);
  };

  // --- Pin Logic ---
  const handleAddPinClick = (x: number, y: number) => {
      const screenX = x * view.scale + view.x;
      const screenY = y * view.scale + view.y;
      setNewPinPos({ x: screenX, y: screenY }); 
  };
  
  const [pendingPinCanvasPos, setPendingPinCanvasPos] = useState<{x: number, y: number} | null>(null);

  const onAddPinStart = (x: number, y: number) => {
      setPendingPinCanvasPos({ x, y });
      const screenX = x * view.scale + view.x;
      const screenY = y * view.scale + view.y;
      setNewPinPos({ x: screenX, y: screenY });
  };

  const handleSavePin = (content: string) => {
      if (pendingPinCanvasPos) {
          const newPin: CanvasPin = {
              id: `pin-${Date.now()}`,
              x: pendingPinCanvasPos.x,
              y: pendingPinCanvasPos.y,
              content
          };
          setPins(prev => [...prev, newPin]);
          setPendingPinCanvasPos(null);
          setNewPinPos(null);
      }
  };

  const handleDeletePin = (id: string) => {
      setPins(prev => prev.filter(p => p.id !== id));
  };


  // --- Getters for Modals ---
  const getMarkdownModalProps = () => {
    const node = nodes.find(n => n.id === editingDocId);
    if (!node) return { title: '', content: '' };
    if (node.type === NodeType.DOCUMENT) return { title: node.title, content: (node.data as DocumentData).content };
    if (node.type === NodeType.SCREEN) return { title: `Plan: ${node.title}`, content: (node.data as ScreenData).plan || '' };
    return { title: '', content: '' };
  };

  const getRunningScreenData = () => {
    const node = nodes.find(n => n.id === runningScreenId);
    return node && node.type === NodeType.SCREEN ? node.data as ScreenData : null;
  };

  const getTableData = () => {
      const node = nodes.find(n => n.id === editingTableId);
      return node && node.type === NodeType.TABLE ? node.data as TableData : null;
  }

  // Canvas @ Mention Handlers
  const handleEnterCanvasSelection = () => {
    setIsCanvasSelectionMode(true);
  };

  const handleNodeMentionSelect = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Add to mentioned nodes if not already there
      if (!mentionedNodeIds.includes(nodeId)) {
        setMentionedNodeIds(prev => [...prev, nodeId]);
      }
      // Set selected node for mention (to trigger input insertion in ChatSidebar)
      setSelectedNodeForMention({ nodeId: node.id, nodeTitle: node.title });
      // Exit selection mode
      setIsCanvasSelectionMode(false);
    }
  };

  const handleClearSelectedNode = () => {
    setSelectedNodeForMention(null);
  };

  const handleRemoveMention = (nodeId: string) => {
    // Remove from mentioned nodes
    setMentionedNodeIds(prev => prev.filter(id => id !== nodeId));

    // Note: Removing from input text is handled by ChatSidebar's internal logic
    // We set a flag to trigger text removal
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNodeForMention({ nodeId: node.id, nodeTitle: `REMOVE:${node.title}` });
    }
  };

  // Screen Element Mention Handlers (Blue - @ Mention Mode for ImmersiveView)
  const handleScreenElementMentionSelect = (nodeId: string, element: any) => {
    const screenNode = nodes.find(n => n.id === nodeId);
    if (screenNode) {
      const elementId = `${nodeId}-${element.cssPath}`;
      const fullLabel = `${screenNode.title}-${element.label}`;

      // Add to mentioned screen elements
      setMentionedScreenElements(prev => ({
        ...prev,
        [elementId]: {
          id: elementId,
          nodeId,
          cssPath: element.cssPath,
          label: element.label,
          boundingBox: element.boundingBox
        }
      }));

      // Insert to chat input
      setSelectedNodeForMention({
        nodeId: elementId,
        nodeTitle: fullLabel
      });

      // Exit selection mode
      setIsCanvasSelectionMode(false);
    }
  };

  const handleRemoveScreenElementMention = (elementId: string) => {
    const element = mentionedScreenElements[elementId];
    if (element) {
      // Remove from state
      setMentionedScreenElements(prev => {
        const newState = { ...prev };
        delete newState[elementId];
        return newState;
      });

      // Trigger removal from input
      const screenNode = nodes.find(n => n.id === element.nodeId);
      if (screenNode) {
        const fullLabel = `${screenNode.title}-${element.label}`;
        setSelectedNodeForMention({
          nodeId: elementId,
          nodeTitle: `REMOVE:${fullLabel}`
        });
      }
    }
  };

  const handleSendMessage = (content: string) => {
    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() }]);
    // Clear mentioned nodes and elements after sending
    setMentionedNodeIds([]);
    setMentionedScreenElements({});
  };

  // Sidebar width change handler with localStorage persistence
  const handleSidebarWidthChange = (width: number) => {
    setSidebarWidth(width);
    localStorage.setItem('sidebarWidth', width.toString());
  };

  // ESC key to exit canvas selection mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCanvasSelectionMode) {
        setIsCanvasSelectionMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCanvasSelectionMode]);

  return (
    <div className="flex w-full h-screen bg-moxt-theme-bg overflow-hidden">
      <ChatSidebar
        messages={messages}
        onSendMessage={handleSendMessage}
        onStartSimulation={runSimulation}
        isProcessing={isProcessing}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        width={sidebarWidth}
        onWidthChange={handleSidebarWidthChange}
        nodes={nodes}
        sections={sections}
        onEnterCanvasSelection={handleEnterCanvasSelection}
        mentionedNodeIds={mentionedNodeIds}
        selectedNodeForMention={selectedNodeForMention}
        onClearSelectedNode={handleClearSelectedNode}
        onStartExecution={handleStartExecution}
        onAnswerQuestion={handleAnswerQuestion}
        onSkipQuestion={handleSkipQuestion}
        onContinueQuestion={handleContinueQuestion}
        onLocateNode={handleLocateNode}
        onEditNode={handleLocateAndEditNode}
        currentPlan={currentPlan}
        onConfirm={handleConfirm}
        onRequestRevision={handleRequestRevision}
      />

      <main className="flex-1 relative h-full">
        <CanvasContainer
            nodes={nodes}
            edges={edges}
            pins={pins}
            view={view}
            onViewChange={setView}
            onNodeMove={handleUpdateNodePosition}
            onBatchNodeMove={handleBatchUpdateNodePosition}
            onNodeSectionChange={handleUpdateNodeSection}
            onAddNode={handleAddNode}
            onEditNode={handleEditNode}
            onRunNode={setRunningScreenId}
            onAddPinClick={onAddPinStart}
            onDeletePin={handleDeletePin}
            onDeleteNodes={handleDeleteNodes}
            isCanvasSelectionMode={isCanvasSelectionMode}
            mentionedNodeIds={mentionedNodeIds}
            onNodeMentionSelect={handleNodeMentionSelect}
            onRemoveMention={handleRemoveMention}
            currentOperatingNodeId={currentOperatingNodeId}
            justCreatedNodeIds={justCreatedNodeIds}
            isObservationMode={isObservationMode}
            onExitObservationMode={() => setIsObservationMode(false)}
            currentTaskName={currentTaskName}
            pendingConfirmation={pendingConfirmation}
            primaryConfirmationNodeId={primaryConfirmationNodeId}
            confirmationStatusByNodeId={confirmationStatusByNodeId}
            onConfirm={handleConfirm}
            onRequestRevision={handleRequestRevision}
        />

        {/* Agent Status Panel - 画布顶部居中 */}
        <AgentStatusPanel
          plan={currentPlan}
          isRunning={agentIsRunning}
          currentTaskName={currentTaskName}
          isObservationMode={isObservationMode}
          onToggleObservation={() => setIsObservationMode(!isObservationMode)}
        />

        {runningScreenId && (
          <ImmersiveView
             data={getRunningScreenData()!}
             onClose={() => setRunningScreenId(null)}
             onNavigate={handleNavigate}
             nodeId={runningScreenId}
             isCanvasSelectionMode={isCanvasSelectionMode}
             onElementMentionSelect={(element) => handleScreenElementMentionSelect(runningScreenId, element)}
             mentionedElements={Object.values(mentionedScreenElements).filter((el: any) => el.nodeId === runningScreenId)}
             onRemoveElementMention={(elementId) => handleRemoveScreenElementMention(elementId)}
          />
        )}

        {editingDocId && (
          <MarkdownModal
              isOpen={true}
              title={getMarkdownModalProps().title}
              initialContent={getMarkdownModalProps().content}
              onSave={(c) => setNodes(prev => prev.map(n => n.id === editingDocId ? { ...n, data: { ...n.data, [n.type === NodeType.SCREEN ? 'plan' : 'content']: c } as any } : n))}
              onClose={() => setEditingDocId(null)}
          />
        )}

        {editingWhiteboardId && (
          <WhiteboardModal
              isOpen={true}
              title="Chart Editor"
              initialData={nodes.find(n => n.id === editingWhiteboardId)?.data as WhiteboardData}
              onSave={(d) => setNodes(prev => prev.map(n => n.id === editingWhiteboardId ? { ...n, data: d } : n))}
              onClose={() => setEditingWhiteboardId(null)}
          />
        )}

        {editingTableId && (
          <DatabaseModal
              isOpen={true}
              title={nodes.find(n => n.id === editingTableId)?.title || 'Table'}
              data={getTableData()}
              onClose={() => setEditingTableId(null)}
          />
        )}

        {editingIntegrationId && (
          <IntegrationModal
              isOpen={true}
              title={nodes.find(n => n.id === editingIntegrationId)?.title || 'Integration'}
              initialData={nodes.find(n => n.id === editingIntegrationId)?.data as IntegrationData}
              onSave={(d) => setNodes(prev => prev.map(n =>
                n.id === editingIntegrationId ? { ...n, data: d } : n
              ))}
              onClose={() => setEditingIntegrationId(null)}
          />
        )}
      </main>

      {/* Pin Creation Modal - stays outside main, uses fixed positioning with calculated coords */}
      {newPinPos && (
          <PinModal
              isOpen={true}
              position={newPinPos}
              nodes={nodes}
              onSave={handleSavePin}
              onClose={() => { setNewPinPos(null); setPendingPinCanvasPos(null); }}
          />
      )}
    </div>
  );
};

export default App;
