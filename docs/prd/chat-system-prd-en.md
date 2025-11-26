# Chat System Product Requirements Document

## 1. Product Overview

### 1.1 Product Positioning

Chat is the core interaction entry point of Visual Coding Agent. Users collaborate with AI through natural language conversation to drive automated execution of product planning work.

### 1.2 Core Value

| Value | Description |
|-------|-------------|
| **Conversation-Driven** | Users describe requirements in natural language without learning complex operations |
| **Process Transparency** | Real-time display of AI thinking process, tool calls, and task progress |
| **Context Association** | Precise communication through @ Mention to reference nodes on canvas |
| **Progressive Interaction** | Collect key decisions through Q&A to ensure output meets expectations |

---

## 2. User Scenarios

### 2.1 Typical Workflow: Creating Product Planning from Scratch

Using "Help me build a food delivery app" as an example, this section demonstrates the complete flow from initiating a request to completing the planning.

---

**Phase 1: Requirement Input**

User describes product idea in the input box, such as "Help me build a food delivery app with user ordering, rider delivery, and merchant management". After sending, the message appears as a bubble on the right side of the conversation area.

---

**Phase 2: Requirement Clarification**

AI recognizes this as a new project and needs to understand user intent further. A **Question Card** appears with 3-5 key decision questions:

- Project type (SaaS / E-commerce / Social / Other)
- Target user group
- Technical complexity preference
- Whether backend planning is needed

User selects answers one by one, and the card automatically scrolls to the next question after each selection. User can click "Skip" to skip the current question, or "Continue" to end the Q&A at any time.

After Q&A ends, the card automatically collapses into an answer summary.

---

**Phase 3: Plan Confirmation**

Based on requirements and user answers, AI generates an **Execution Plan**. The plan is displayed as a task list, for example:

1. Create product requirements document
2. Design user flow diagram
3. Create interactive prototype (5 core pages)
4. Write backend architecture plan
5. Design database schema
6. Configure third-party integrations

A "Start Execution" button is displayed at the bottom of the plan. After clicking, the button disappears and AI starts executing tasks automatically.

---

**Phase 4: Task Execution**

After clicking "Start Execution", a **Floating Progress Bar** appears above the input box, showing the current task and completion ratio (e.g., 1/6).

AI executes each task sequentially. During execution, the Chat panel displays different types of messages:

- **Thinking Message**: When AI starts processing complex tasks, shows "Thinking..." animation to let users know the system is working
- **Tool Call Message**: When AI reads reference materials or searches templates, displays as simplified text (e.g., "Read product-template.md")
- **File Operation Message**: When AI creates nodes on canvas, shows a card (e.g., "📄 Product Requirements Doc - Created") with a locate button

After each task completes, the progress bar updates automatically, marks current task as complete, and starts the next task.

---

**Phase 5: Result Review**

After all tasks complete, the progress bar shows "Execution complete".

User can:
- Click the **Locate Button** in file operation messages to auto-pan canvas and focus on the corresponding node
- Continue chatting with AI in the input box to provide feedback or new requirements

---

### 2.2 Message Type Quick Reference

| Message Type | Use Case | User Actions |
|--------------|----------|--------------|
| User Message | Initiate request, follow-up, provide feedback | Input text, @ reference nodes |
| Question Card | Appears when AI needs to clarify key decisions | Select options, navigate pages, skip, continue |
| Execution Plan | Display task list + floating progress bar | Start execution, expand/collapse progress |
| Thinking Message | Shows reasoning process during complex tasks | Expand/collapse to view content after completion |
| Operation Feedback | Feedback after AI executes operations (read, create nodes, etc.) | Click locate button to jump to canvas (if applicable) |

---

## 3. Message Type Definitions

The Chat system supports 5 message types, each with independent display rules and interaction logic.

### 3.1 User Message / AI Message

**Scenario**: User initiates request, AI replies with analysis results

**Purpose**: Basic conversation, user input and AI text response

| Property | User Message | AI Message |
|----------|--------------|------------|
| Alignment | Right-aligned | Left-aligned |
| Background Style | Gray bubble | No background |
| Width Limit | Max 80% | Full width |
| Format Support | Plain text | Full Markdown |

**AI Message Markdown Support**:
- Headings (H1-H6)
- Unordered/Ordered/Task lists
- Blockquotes, Code blocks
- Bold, Italic, Inline code, Links

---

### 3.2 Question Card Message

**Scenario**: AI needs to collect user's product decisions (e.g., project type, technical complexity)

**Purpose**: Collect key decisions through multiple choice to ensure output meets user expectations

**Card Structure**:

Card is divided into three areas:
- **Header**: Question icon and "Questions" title on the left, pagination info (e.g., 1/4) and up/down navigation buttons on the right
- **Content Area**: Displays current question text with A/B/C/D options below; answered questions show checkmark next to title, selected option is highlighted
- **Footer**: Fixed display of "Skip" and "Continue" action buttons

**Interaction Rules**:

After user selects an option, the system waits 300ms to show the selected effect, then automatically scrolls to the next question. If it's the last question, stays at current position waiting for user action.

| Action | Effect |
|--------|--------|
| Select Option | Record answer, auto-scroll to next question |
| ▲▼ Navigate | Browse answered/unanswered questions |
| Skip | Skip current question, go to next |
| Continue | End Q&A, trigger subsequent flow |

**Collapsed State**:
- Automatically collapses to summary after Q&A completes
- Summary content generated by AI based on user answers, e.g., "Question 1/4: E-commerce app"

---

### 3.3 Execution Plan Message

**Scenario**: After AI analyzes requirements, displays work plan for user confirmation

**Purpose**: Let users understand upcoming tasks and actively trigger execution

**Card Structure**:

Card is divided into three areas:
- **Header**: Displays "EXECUTION PLAN" title
- **Task List**: All tasks arranged vertically, each with status icon
- **Footer**: Contains "Start Execution" button on first display, disappears after clicking

**Task States**:

| State | Icon | Description |
|-------|------|-------------|
| pending | ○ | Waiting to execute |
| loading | ⏳ | Currently executing (with spinning animation) |
| done | ✓ | Completed (green) |

**Start & Execution**:

After user clicks "Start Execution" button:
1. Button disappears immediately (prevents repeated triggers)
2. Floating progress bar appears above input box
3. Current task status changes to loading
4. AI executes task, sends operation feedback messages
5. After task completes, status changes to done, automatically proceeds to next task
6. Repeats until all tasks complete

**Floating Progress Bar**:

After execution plan starts, a floating progress bar appears above the input box to track overall progress.

Collapsed State (single line layout):
- Current task status icon
- Current task name
- Status text (Processing... or Execution complete)
- Progress ratio (e.g., 2/6)
- Expand/collapse button

Expanded State:
- Click to show complete task list below
- Completed tasks show checkmark icon with strikethrough text
- Currently executing task is highlighted
- Pending tasks show empty circle icon

Completion Animation:
- Single task completion: Brief highlight + scale effect
- All complete: Shows "Execution complete"

---

### 3.4 Thinking Message

**Scenario**: When AI starts processing tasks, shows reasoning process

**Purpose**: Enhance transparency and explainability, let users know AI is "thinking"

**Two States**:

| State | Display Form | Description |
|-------|--------------|-------------|
| Thinking | 🧠 Thinking... | Bouncing animation, indicates processing |
| Complete | 🧠 Thought process ▶ | Expandable to view thinking content |

**Interaction Rules**:
- After thinking completes, content is collapsed by default
- Click to expand/collapse to view detailed reasoning process

---

### 3.5 Operation Feedback Message

**Scenario**: When AI executes various operations, provides execution status feedback to user

**Purpose**: Show specific operations AI is executing, enhance transparency and trust

Operation feedback messages are divided into two display forms based on importance:

---

#### 3.5.1 Lightweight Operations (Simplified Text)

Suitable for high-frequency auxiliary operations that don't affect results, displayed as simplified text to not interrupt user reading.

| Operation Type | Display Text | Corresponding Commands | Example |
|----------------|--------------|------------------------|---------|
| Search Code | Search | grep | Search user-stories |
| Read File | Read | read, cat, head, tail | Read product-template.md |
| Browse Directory | Browsing files | ls, list_dir | Browsing files in /src |

---

#### 3.5.2 Important Operations (Full Card)

Suitable for operations that produce actual results, displayed as cards with status indicators and interaction buttons.

**Card Structure** (single-line compact layout):
- **Left**: Operation type icon
- **Middle**: Operation name + status text (Creating.../Created/Failed)
- **Right**: Locate button shown after successful operation (if applicable)

**Operation Types**:

| Operation Type | Icon | Description | Locate Button |
|----------------|------|-------------|---------------|
| Create Document Node | 📄 | Create Document on canvas | ✓ |
| Create Whiteboard Node | 🎨 | Create Whiteboard on canvas | ✓ |
| Create Prototype Node | 📱 | Create Screen on canvas | ✓ |
| Create Table Node | 📊 | Create Table on canvas | ✓ |
| Create Integration Node | 🔌 | Create Integration on canvas | ✓ |
| Move Node | 📦 | Move or rename canvas node | ✓ |
| Create Section | 📁 | Create Section on canvas | ✓ |
| Delete Node | 🗑️ | Delete canvas node | - |
| Edit File | 📝 | Edit code/config file | - |
| Create File | 📝 | Create code/config file | - |

**Status Indicators**:
- Executing: Spinning loader icon
- Success: Green checkmark icon
- Failed: Red error icon

**Interaction Rules**:
- "Locate" button shown after canvas node creation succeeds
- Clicking locate button auto-pans canvas and focuses on that node

---

## 4. @ Mention Feature

Users can reference nodes or internal elements on the canvas through @ in the input box for precise context association.

### 4.1 Trigger Methods

| Method | Action | Description |
|--------|--------|-------------|
| Text Trigger | Type `@` | Must be at start or after space |
| Canvas Selection | Click "Select from Canvas" | Enter selection mode |

### 4.2 Mention Panel

After typing `@`, a selection panel pops up with content sorted:
1. "Select from Canvas" option (top, distinctive background)
2. Sections
3. Various nodes (grouped by type)

Keyboard operations:
- ↑/↓: Select up/down
- Enter: Confirm selection
- Esc: Close panel
- Continue typing: Real-time filtering

### 4.3 Canvas Selection Mode

After clicking "Select from Canvas", enters selection mode where you can select nodes or internal elements within nodes (e.g., div in Screen).

Visual Feedback:
- Cursor changes to pointer
- Hovered element shows blue highlight border

Exit Methods:
- Click target element (complete selection)
- Press Esc key (cancel)
- Click blank area (cancel)

### 4.4 Reference Effects

**Input Box**: Inserts `@NodeName` or `@NodeName-ElementIdentifier`

**Canvas**:
- Referenced node/element shows blue border
- Blue label `@Name ×` appears at top-left
- Click × to delete reference

**Message History**:
- Shows blue highlight by node type

