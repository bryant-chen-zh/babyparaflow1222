# 🎨 Visual Coding Agent

> An infinite canvas-based AI agent that transforms ideas into complete product workflows - from strategy docs to interactive prototypes to backend architecture.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Timsamapf/babyparaflow)

## 🌐 Live Demo

**[Try it now →](https://babyparaflow.vercel.app)**

## ✨ What is Visual Coding Agent?

Visual Coding Agent is an **intelligent visual workspace** that helps you rapidly prototype and plan full-stack applications. Simply describe your idea, and watch as the AI orchestrates a complete product development workflow on an infinite canvas.

### The 6-Act Workflow

1. **📄 Product Strategy** - Generates user personas, product charter, and core requirements
2. **🔀 User Flow Design** - Creates visual flow diagrams mapping user journeys
3. **📱 Frontend Prototyping** - Builds interactive, high-fidelity UI prototypes
4. **📋 Backend Planning** - Produces technical documentation (Dev Plan, Tech Stack, Architecture, Data Model)
5. **🗄️ Data Design** - Designs database schemas and relationships
6. **🔌 Third-party Integration** - Plans external service integrations (SendGrid, Google Calendar, etc.)

## 🚀 Key Features

- **Infinite Canvas** - Pan, zoom, and organize your entire product on a boundless workspace
- **AI-Powered Generation** - Automatically creates documents, flows, and prototypes
- **Interactive Prototypes** - Click through working UI mockups with navigation
- **Visual Sections** - Auto-groups related content with color-coded sections
- **Rich Node Types** - Documents, whiteboards, screens, databases, integrations
- **Collaborative Planning** - Pin notes and comments anywhere on the canvas
- **Export-Ready** - Edit any node content for refinement

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **AI**: Google Gemini (for future AI features)
- **Icons**: Lucide React

## 🏃 Quick Start

### Prerequisites
- Node.js 18+

### Installation

```bash
# Clone the repository
git clone https://github.com/Timsamapf/babyparaflow.git
cd babyparaflow

# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 🎮 Usage Guide

### Starting the Demo

1. Click **"Start Simulation"** in the chat sidebar
2. Watch the AI orchestrate a complete product workflow
3. Navigate the canvas using mouse/trackpad

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `H` | Hand tool (pan canvas) |
| `Space` | Temporary hand tool |
| `P` | Pin/annotation tool |
| `+` / `-` | Zoom in/out |
| `Ctrl/Cmd + Scroll` | Zoom (centered) |

### Canvas Interactions

- **Pan**: Drag with hand tool or hold Space + drag
- **Zoom**: Ctrl/Cmd + scroll, or use +/- buttons
- **Edit Node**: Double-click or click edit button
- **Run Prototype**: Click "Run" button on screen nodes
- **Create Node**: Click + menu and select type
- **Move Sections**: Drag section headers to reorganize

### Node Types

| Type | Icon | Purpose |
|------|------|---------|
| Document | 📄 | Markdown documents (PRDs, specs) |
| Whiteboard | 🎨 | Flow diagrams and visual charts |
| Screen | 📱 | Interactive UI prototypes |
| Table | 🗄️ | Database schema visualization |
| Integration | 🔌 | Third-party service configurations |

## 📁 Project Structure

```
visual-coding-agent/
├── App.tsx                    # Main application orchestrator
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Layout and configuration constants
│
├── components/
│   ├── Canvas/                # Infinite canvas system
│   │   ├── CanvasContainer.tsx
│   │   ├── PinMarker.tsx
│   │   └── nodes/             # All node type components
│   │       ├── DocumentNode.tsx
│   │       ├── WhiteboardNode.tsx
│   │       ├── ScreenNode.tsx
│   │       ├── TableNode.tsx
│   │       └── IntegrationNode.tsx
│   │
│   ├── Chat/                  # AI chat interface
│   │   └── ChatSidebar.tsx
│   │
│   ├── Editor/                # Modal editors for each node type
│   │   ├── MarkdownModal.tsx
│   │   ├── WhiteboardModal.tsx
│   │   ├── DatabaseModal.tsx
│   │   └── IntegrationModal.tsx
│   │
│   └── Preview/               # Full-screen prototype viewer
│       └── ImmersiveView.tsx
│
├── services/
│   └── geminiService.ts       # AI service integration
│
└── utils/
    └── markdownUtils.ts
```

## 📚 Documentation

For detailed technical documentation, see:
- [Development Guide](./docs/DEVELOPMENT.md)
- [PRD Documentation](./docs/prd/) - Feature specifications by module
- [AI Coding Guide](./docs/AI_CODING_GUIDE.md)

## 🎯 Use Cases

- **Product Managers**: Visualize entire product workflows
- **Designers**: Create interactive prototypes rapidly
- **Developers**: Plan system architecture and data models
- **Founders**: Communicate MVP scope to team
- **Consultants**: Present comprehensive proposals

## 🗺️ Roadmap

- [ ] Real-time collaboration (multiplayer)
- [ ] Export to Figma/code
- [ ] Custom node types
- [ ] Version history
- [ ] Template library
- [ ] AI-powered code generation from prototypes

## 🤝 Contributing

Contributions are welcome! Please read our [Development Guide](./docs/DEVELOPMENT.md) for details.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with inspiration from tools like Figma, Miro, and AI Studio.

---

**Made with ❤️ for the vibe coding community**
