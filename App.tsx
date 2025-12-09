import React, { useState } from 'react';
import { ChatSidebar } from './components/Chat/ChatSidebar';
import { CanvasContainer } from './components/Canvas/CanvasContainer';
import { AgentStatusPanel } from './components/Canvas/AgentStatusPanel';
import { MarkdownModal } from './components/Editor/MarkdownModal';
import { WhiteboardModal } from './components/Editor/WhiteboardModal';
import { ImmersiveView } from './components/Preview/ImmersiveView';
import { PinModal } from './components/Editor/PinModal';
import { DatabaseModal } from './components/Editor/DatabaseModal';
import { IntegrationModal } from './components/Editor/IntegrationModal';
import { CanvasNode, ChatMessage, NodeType, DocumentData, WhiteboardData, ScreenData, CanvasEdge, CanvasView, PlanStep, CanvasPin, TableData, APIData, IntegrationData, QuestionData } from './types';
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

// --- Product Decision Questions Configuration ---
const PRODUCT_QUESTIONS: QuestionData[] = [
  {
    questionId: 'q1',
    questionText: 'What type of project do you want to build?',
    currentPage: 1,
    totalPages: 4,
    options: [
      { id: 'saas', label: 'SaaS Product', description: 'CRM, project management tools, collaboration platforms' },
      { id: 'ecommerce', label: 'E-commerce Platform', description: 'Product displays, shopping cart, payment system' },
      { id: 'social', label: 'Social/Content Platform', description: 'User-generated content, feeds, community' },
      { id: 'dashboard', label: 'Data Analytics/Dashboard', description: 'Charts, reports, data visualization' }
    ]
  },
  {
    questionId: 'q2',
    questionText: 'What is your core user scenario?',
    currentPage: 2,
    totalPages: 4,
    options: [
      { id: 'single', label: 'Single-user Operations', description: 'Personal tools, independent use' },
      { id: 'collaboration', label: 'Multi-user Collaboration', description: 'Team workspaces, real-time collaboration' },
      { id: 'marketplace', label: 'Two-sided Market', description: 'Buyers-sellers, creators-consumers' },
      { id: 'admin-user', label: 'Admin-User Separation', description: 'Backend management + user-facing' }
    ]
  },
  {
    questionId: 'q3',
    questionText: 'What is your technical complexity level?',
    currentPage: 3,
    totalPages: 4,
    options: [
      { id: 'mvp', label: 'MVP Quick Validation', description: 'Core features first, rapid launch' },
      { id: 'standard', label: 'Standard Product', description: 'Common feature combinations, mature solutions' },
      { id: 'custom', label: 'Custom Requirements', description: 'Special business logic, unique features' },
      { id: 'enterprise', label: 'Enterprise/High-Performance', description: 'Performance optimization, distributed, large-scale' }
    ]
  },
  {
    questionId: 'q4',
    questionText: 'What is your preferred deployment and architecture?',
    currentPage: 4,
    totalPages: 4,
    options: [
      { id: 'monolith', label: 'Monolithic Application', description: 'Monolithic architecture + relational database' },
      { id: 'restful', label: 'Frontend-Backend Separation', description: 'React/Vue + RESTful API' },
      { id: 'microservices', label: 'Microservices Architecture', description: 'Service splitting + message queues' },
      { id: 'serverless', label: 'Serverless', description: 'Cloud functions + NoSQL database' }
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
  const [currentOperatingNodeId, setCurrentOperatingNodeId] = useState<string | null>(null);
  const [justCreatedNodeIds, setJustCreatedNodeIds] = useState<string[]>([]);
  const [currentTaskName, setCurrentTaskName] = useState<string>('');

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

  // --- THE DIRECTOR: Simulation Sequence ---
  const runSimulation = async () => {
      setSimulationStarted(true);

      // 1. User Request
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        type: 'user',
        role: 'user',
        content: "I want to build a community event app like Luma.",
        timestamp: Date.now()
      }]);
      setIsProcessing(true);

      // Wait a bit...
      await new Promise(r => setTimeout(r, 1000));

      // 2. AI 回复：需要了解更多信息
      setMessages(prev => [...prev, {
        id: 'ai-intro',
        type: 'ai',
        role: 'ai',
        content: "Great! Before I start designing your product, let me ask you a few key questions to better understand your requirements.",
        timestamp: Date.now()
      }]);
      setIsProcessing(false);

      // 3. 显示问题容器（包含所有问题，一次性加载）
      await new Promise(r => setTimeout(r, 800));
      const firstQuestion = {
        ...PRODUCT_QUESTIONS[0],
        allQuestions: PRODUCT_QUESTIONS, // 传递所有问题
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

  const updatePlanStatus = (msgId: string, stepId: string, status: 'pending' | 'loading' | 'done') => {
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
  const handleAnswerQuestion = (messageId: string, optionId: string) => {
    // 组件内部已经管理答案状态，这里只需记录到全局状态（如果需要）
    // 暂时保持简单，因为答案在组件内部管理
  };

  const handleContinueQuestion = async (messageId: string) => {
    // 用户点击 Continue，提交所有已回答的问题
    // 将问题容器标记为折叠状态，而不是移除
    setQuestionsCompleted(true);
    setMessages(prev => prev.map(msg =>
      msg.id === 'question-container' ? { ...msg, collapsed: true } : msg
    ));

    // 添加 AI 确认消息和执行计划
    await new Promise(r => setTimeout(r, 500));

    const planMsgId = 'ai-plan';
    const initialSteps: PlanStep[] = [
      { id: 's1', label: 'Drafting Product Strategy', status: 'pending' },
      { id: 's2', label: 'Designing User Flow', status: 'pending' },
      { id: 's3', label: 'Generating Prototype', status: 'pending' },
      { id: 's4', label: 'Planning Backend Architecture', status: 'pending' },
      { id: 's5', label: 'Designing Data & Resources', status: 'pending' },
      { id: 's6', label: 'Integrating Third-party Services', status: 'pending' },
    ];

    setMessages(prev => [...prev, {
      id: planMsgId,
      type: 'ai',
      role: 'ai',
      content: "Got it! Based on your requirements, here's my execution plan:",
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
    
    // 获取视窗尺寸（考虑左侧聊天栏，假设宽度约 420px）
    const sidebarWidth = 420;
    const viewportWidth = window.innerWidth - sidebarWidth;
    const viewportHeight = window.innerHeight;
    const targetRatio = 0.5; // 节点应占视窗宽高的 50%
    
    // 分别计算基于宽度和高度的缩放级别
    const scaleByWidth = (viewportWidth * targetRatio) / nodeWidth;
    const scaleByHeight = (viewportHeight * targetRatio) / nodeHeight;
    
    // 取较小值，确保节点完全可见
    let calculatedScale = Math.min(scaleByWidth, scaleByHeight);
    
    // 限制缩放范围在 MIN_ZOOM 和 MAX_ZOOM 之间
    calculatedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, calculatedScale));
    
    // 将镜头中心点偏移到节点中心（考虑节点尺寸）
    const nodeCenterX = nodeX + nodeWidth / 2;
    const nodeCenterY = nodeY + nodeHeight / 2;
    
    panTo(nodeCenterX, nodeCenterY, calculatedScale);
  };

  // 辅助函数：标记节点刚被创建（用于弹出动画）
  const markNodeAsJustCreated = (nodeId: string) => {
    setJustCreatedNodeIds(prev => [...prev, nodeId]);
    // 动画结束后移除标记
    setTimeout(() => {
      setJustCreatedNodeIds(prev => prev.filter(id => id !== nodeId));
    }, 600);
  };

  // 执行工作流（增强版：穿插更多工具调用和 AI 消息）
  const executeWorkflow = async (planMsgId: string) => {
    const cx = LAYOUT_CENTER_X;
    const cy = LAYOUT_CENTER_Y;

    // 开始 Agent 运行
    setAgentIsRunning(true);

    // ============================================
    // PHASE 1: Drafting Product Strategy
    // ============================================
    await new Promise(r => setTimeout(r, 600));
    updatePlanStatus(planMsgId, 's1', 'loading');
    setCurrentTaskName('Drafting Product Strategy');
    
    // Read todo list first
    await simulateToolCall('todo_read', '', 300);
    
    // Show thinking process
    const thinkingId1 = addThinkingMessage();
    await new Promise(r => setTimeout(r, 800));
    updateThinkingMessage(thinkingId1, 'Analyzing requirements: community event app similar to Luma. Key features needed: event creation, RSVP management, calendar integration, and social discovery.', 'done');

    addAIMessage("Analyzing your requirements and researching similar platforms...");
    await new Promise(r => setTimeout(r, 500));

    // List project structure
    await simulateToolCall('list_dir', 'src/', 250);
    await simulateToolCall('grep', 'event management SaaS', 350);
    await simulateToolCall('read', 'docs/product-templates.md', 300);

    addAIMessage("Creating user personas and product charter based on community event patterns...");
    await new Promise(r => setTimeout(r, 400));

    // Create Document Nodes (Loading) - 镜头跟随每个新创建的节点
    const docY = cy + DOCUMENT_SECTION_Y_OFFSET;
    await new Promise(r => setTimeout(r, 600));
    
    // 创建第一个文档节点并聚焦
    const doc1: CanvasNode = { id: 'node-doc-1', type: NodeType.DOCUMENT, x: cx - NODE_SPACING_X, y: docY, title: 'User Personas', status: 'loading', data: null, sectionId: SECTION_IDS.DOCUMENT };
    setNodes(prev => [...prev, doc1]);
    markNodeAsJustCreated('node-doc-1');
    focusOnNode('node-doc-1', doc1.x, doc1.y, 450, 550); // Document: 450 x 550
    const docOpId1 = addFileOperationMessage('create', 'document', 'User Personas', 'node-doc-1');
    await new Promise(r => setTimeout(r, 800));
    updateFileOperationStatus(docOpId1, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-doc-1' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.doc1 } : n));

    // 创建第二个文档节点并聚焦
    await new Promise(r => setTimeout(r, 300));
    const doc2: CanvasNode = { id: 'node-doc-2', type: NodeType.DOCUMENT, x: cx, y: docY, title: 'Product Charter', status: 'loading', data: null, sectionId: SECTION_IDS.DOCUMENT };
    setNodes(prev => [...prev, doc2]);
    markNodeAsJustCreated('node-doc-2');
    focusOnNode('node-doc-2', doc2.x, doc2.y, 450, 550); // Document: 450 x 550
    const docOpId2 = addFileOperationMessage('create', 'document', 'Product Charter', 'node-doc-2');
    await new Promise(r => setTimeout(r, 800));
    updateFileOperationStatus(docOpId2, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-doc-2' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.doc2 } : n));

    // 创建第三个文档节点并聚焦
    await new Promise(r => setTimeout(r, 300));
    const doc3: CanvasNode = { id: 'node-doc-3', type: NodeType.DOCUMENT, x: cx + NODE_SPACING_X, y: docY, title: 'Core Requirements', status: 'loading', data: null, sectionId: SECTION_IDS.DOCUMENT };
    setNodes(prev => [...prev, doc3]);
    markNodeAsJustCreated('node-doc-3');
    focusOnNode('node-doc-3', doc3.x, doc3.y, 450, 550); // Document: 450 x 550
    const docOpId3 = addFileOperationMessage('create', 'document', 'Core Requirements', 'node-doc-3');
    await new Promise(r => setTimeout(r, 800));
    updateFileOperationStatus(docOpId3, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-doc-3' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.doc3 } : n));
    setOperatingNode(null);

    addAIMessage("Product strategy documents ready. Moving to user flow design...");
    updatePlanStatus(planMsgId, 's1', 'done');

    // ============================================
    // PHASE 2: Designing User Flow
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 's2', 'loading');
    setCurrentTaskName('Designing User Flow');

    addAIMessage("Mapping user journey based on your requirements...");
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('list_dir', 'templates/', 250);
    await simulateToolCall('grep', 'user flow patterns', 300);
    await simulateToolCall('read', 'templates/flow-diagram.json', 350);

    addAIMessage("Generating flow chart with key decision points and navigation paths...");
    await new Promise(r => setTimeout(r, 400));

    const chartX = cx + CHART_SECTION_X_OFFSET;
    const chartY = cy - 300;

    await new Promise(r => setTimeout(r, 600));
    const chartNode: CanvasNode = {
        id: 'node-whiteboard-1', type: NodeType.WHITEBOARD, x: chartX, y: chartY, title: 'User Flow Chart', status: 'loading', data: null, sectionId: SECTION_IDS.CHART
    };
    setNodes(prev => [...prev, chartNode]);
    markNodeAsJustCreated('node-whiteboard-1');

    // 聚焦到白板节点
    focusOnNode('node-whiteboard-1', chartX, chartY, 850, 700); // Whiteboard: 850 x 700
    const wbOpId = addFileOperationMessage('create', 'whiteboard', 'User Flow Chart', 'node-whiteboard-1');
    await new Promise(r => setTimeout(r, 1200));
    updateFileOperationStatus(wbOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-whiteboard-1' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.whiteboard } : n));
    setOperatingNode(null);

    addAIMessage("User flow diagram complete. Now designing the UI screens...");
    updatePlanStatus(planMsgId, 's2', 'done');

    // ============================================
    // PHASE 3: Generating Prototype
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 's3', 'loading');
    setCurrentTaskName('Generating Prototype');

    addAIMessage("Designing high-fidelity screens with Tailwind CSS...");
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('list_dir', 'design-system/', 250);
    await simulateToolCall('read', 'design-system/colors.css', 300);
    await simulateToolCall('grep', 'navigation component', 350);

    // Create Skeleton Screens - 每个屏幕单独创建并跟随
    await new Promise(r => setTimeout(r, 600));
    const sY1 = cy;
    const sY2 = cy + WEB_NODE_SPACING_Y;
    const sXStart = cx - WEB_NODE_SPACING_X;

    // 定义所有屏幕节点的配置
    const screenConfigs = [
        { id: 'node-screen-1', x: sXStart, y: sY1, title: 'Home', data: MOCK_LUMA_DATA.screen1 },
        { id: 'node-screen-2', x: sXStart + WEB_NODE_SPACING_X, y: sY1, title: 'Explore', data: MOCK_LUMA_DATA.screen2 },
        { id: 'node-screen-3', x: sXStart + (WEB_NODE_SPACING_X * 2), y: sY1, title: 'Event Detail', data: MOCK_LUMA_DATA.screen3 },
        { id: 'node-screen-4', x: cx - (WEB_NODE_SPACING_X * 0.5), y: sY2, title: 'Create Event', data: MOCK_LUMA_DATA.screen4 },
        { id: 'node-screen-5', x: cx + (WEB_NODE_SPACING_X * 0.5), y: sY2, title: 'Profile', data: MOCK_LUMA_DATA.screen5 },
    ];

    // Render Edges first
    const flowEdges: CanvasEdge[] = [
      { id: 'e1', fromNode: 'node-screen-1', toNode: 'node-screen-2' },
      { id: 'e2', fromNode: 'node-screen-2', toNode: 'node-screen-3' },
      { id: 'e3', fromNode: 'node-screen-1', toNode: 'node-screen-4' },
      { id: 'e4', fromNode: 'node-screen-1', toNode: 'node-screen-5' },
    ];
    setEdges(flowEdges);

    addAIMessage("Building Home and Explore pages with hero sections and event grids...");
    await new Promise(r => setTimeout(r, 400));

    // 创建每个屏幕节点并逐个聚焦
    const createAndRevealScreen = async (config: typeof screenConfigs[0]) => {
        // 创建 loading 状态的节点
        const screenNode: CanvasNode = {
            id: config.id,
            type: NodeType.SCREEN,
            x: config.x,
            y: config.y,
            title: config.title,
            status: 'loading',
            data: null,
            sectionId: SECTION_IDS.SCREEN,
            variant: 'web'
        };
        setNodes(prev => [...prev, screenNode]);
        markNodeAsJustCreated(config.id);
        
        // 聚焦到新创建的屏幕节点
        focusOnNode(config.id, config.x, config.y, 1000, 780); // Web Screen: 1000 x 780
        const fileOpId = addFileOperationMessage('create', 'screen', config.title, config.id);
        await new Promise(r => setTimeout(r, 1000));
        updateFileOperationStatus(fileOpId, 'success');
        await new Promise(r => setTimeout(r, 200));
        setNodes(prev => prev.map(n => n.id === config.id ? { ...n, status: 'done', data: config.data } : n));
        setOperatingNode(null);
        await new Promise(r => setTimeout(r, 300));
    };

    await createAndRevealScreen(screenConfigs[0]); // Home
    await createAndRevealScreen(screenConfigs[1]); // Explore

    await simulateToolCall('read', 'templates/form-patterns.tsx', 300);

    addAIMessage("Creating Event Detail, form screens, and user profile...");
    await new Promise(r => setTimeout(r, 400));

    await createAndRevealScreen(screenConfigs[2]); // Event Detail
    await createAndRevealScreen(screenConfigs[3]); // Create Event
    await createAndRevealScreen(screenConfigs[4]); // Profile

    addAIMessage("All screens connected with navigation flow. Moving to backend architecture...");
    updatePlanStatus(planMsgId, 's3', 'done');

    // ============================================
    // PHASE 4: Planning Backend Architecture
    // ============================================
    await new Promise(r => setTimeout(r, 1000));
    updatePlanStatus(planMsgId, 's4', 'loading');
    setCurrentTaskName('Planning Backend Architecture');

    // Show thinking for architecture decisions
    const thinkingId2 = addThinkingMessage();
    await new Promise(r => setTimeout(r, 600));
    updateThinkingMessage(thinkingId2, 'Evaluating architecture options: monolithic vs microservices. For MVP, recommending Node.js + PostgreSQL with horizontal scaling capability. Redis for session management and job queues.', 'done');

    addAIMessage("Designing system architecture for scalability...");
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('list_dir', 'docs/', 250);
    await simulateToolCall('grep', 'RESTful API patterns', 350);
    await simulateToolCall('read', 'docs/architecture-guide.md', 300);

    addAIMessage("Documenting tech stack and data flow...");
    await new Promise(r => setTimeout(r, 400));

    // Define backend region layout
    const backendBaseX = cx + BACKEND_SECTION_X_OFFSET;
    const backendBaseY = cy + BACKEND_SECTION_Y_OFFSET;
    const backendDocX = backendBaseX;
    const backendDocY = backendBaseY;
    const backendDocSpacing = 500;

    // Create and reveal backend documents one by one - 每个节点都聚焦跟随
    const backendDocs = [
      { id: 'node-doc-dev-plan', x: backendDocX, y: backendDocY, title: 'Development Plan', data: MOCK_LUMA_DATA.docDevPlan },
      { id: 'node-doc-tech-stack', x: backendDocX + backendDocSpacing, y: backendDocY, title: 'Tech Stack', data: MOCK_LUMA_DATA.docTechStack },
      { id: 'node-doc-architecture', x: backendDocX, y: backendDocY + 600, title: 'Architecture Design', data: MOCK_LUMA_DATA.docArchitecture },
      { id: 'node-doc-data-model', x: backendDocX + backendDocSpacing, y: backendDocY + 600, title: 'Data Model', data: MOCK_LUMA_DATA.docDataModel }
    ];

    for (const doc of backendDocs) {
      // Create node in loading state
      const newNode: CanvasNode = {
        id: doc.id,
        type: NodeType.DOCUMENT,
        x: doc.x,
        y: doc.y,
        title: doc.title,
        status: 'loading',
        sectionId: SECTION_IDS.BACKEND,
        data: null
      };
      setNodes(prev => [...prev, newNode]);
      markNodeAsJustCreated(doc.id);
      
      // 聚焦到新创建的后端文档节点
      focusOnNode(doc.id, doc.x, doc.y, 450, 550); // Document: 450 x 550
      const opId = addFileOperationMessage('create', 'document', doc.title, doc.id);
      await new Promise(r => setTimeout(r, 800));
      updateFileOperationStatus(opId, 'success');
      
      // Reveal with data
      await new Promise(r => setTimeout(r, 200));
      setNodes(prev => prev.map(n => n.id === doc.id ? { ...n, status: 'done', data: doc.data } : n));
      setOperatingNode(null);
      await new Promise(r => setTimeout(r, 300));
    }

    addAIMessage("Architecture documentation complete. Now designing database schemas...");
    updatePlanStatus(planMsgId, 's4', 'done');

    // ============================================
    // PHASE 5: Designing Data & Resources
    // ============================================
    await new Promise(r => setTimeout(r, 1000));
    updatePlanStatus(planMsgId, 's5', 'loading');
    setCurrentTaskName('Designing Data & Resources');

    addAIMessage("Modeling database schemas for PostgreSQL...");
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('list_dir', 'schemas/', 250);
    await simulateToolCall('read', 'schemas/postgres-types.sql', 300);
    await simulateToolCall('grep', 'foreign key constraints', 350);

    addAIMessage("Creating Users and Events tables with relationships...");
    await new Promise(r => setTimeout(r, 400));

    // Create Database nodes one by one - 每个表节点都聚焦跟随
    const dbY = backendDocY + 1300;
    const dbSpacingX = 350;

    const tables = [
      { id: 'node-table-users', x: backendBaseX + 100, y: dbY, title: 'Users', data: MOCK_LUMA_DATA.tableUsers },
      { id: 'node-table-events', x: backendBaseX + 100 + dbSpacingX, y: dbY, title: 'Events', data: MOCK_LUMA_DATA.tableEvents }
    ];

    for (const table of tables) {
      // Create node in loading state
      const newNode: CanvasNode = {
        id: table.id,
        type: NodeType.TABLE,
        x: table.x,
        y: table.y,
        title: table.title,
        status: 'loading',
        sectionId: SECTION_IDS.BACKEND,
        data: null
      };
      setNodes(prev => [...prev, newNode]);
      markNodeAsJustCreated(table.id);
      
      // 聚焦到新创建的数据库表节点
      focusOnNode(table.id, table.x, table.y, 280, 320); // Table: 280 x 320
      const opId = addFileOperationMessage('create', 'table', table.title, table.id);
      await new Promise(r => setTimeout(r, 800));
      updateFileOperationStatus(opId, 'success');
      
      // Reveal with data
      await new Promise(r => setTimeout(r, 200));
      setNodes(prev => prev.map(n => n.id === table.id ? { ...n, status: 'done', data: table.data } : n));
      setOperatingNode(null);
      await new Promise(r => setTimeout(r, 300));
    }

    addAIMessage("Database models defined. Setting up third-party integrations...");
    updatePlanStatus(planMsgId, 's5', 'done');

    // ============================================
    // PHASE 6: Integrating Third-party Services
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 's6', 'loading');
    setCurrentTaskName('Integrating Third-party Services');

    addAIMessage("Configuring external service integrations...");
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('list_dir', 'config/', 250);
    await simulateToolCall('grep', 'SendGrid API', 300);
    await simulateToolCall('read', 'config/services.json', 350);

    addAIMessage("Setting up email notifications and calendar sync...");
    await new Promise(r => setTimeout(r, 400));

    // Create Integration nodes (below databases) - 每个集成节点都聚焦跟随
    const integrationX = backendBaseX + 100;
    const integrationY = dbY + 400;

    // 创建并逐个聚焦 Integration 节点
    const integrationConfigs = [
      {
        id: 'node-integration-sendgrid',
        x: integrationX,
        y: integrationY,
        title: 'SendGrid',
        data: {
          provider: 'SendGrid',
          category: 'Email',
          description: 'Send magic link emails',
          apiEndpoint: 'https://api.sendgrid.com/v3',
          requiredKeys: ['SENDGRID_API_KEY'],
          documentation: 'https://docs.sendgrid.com'
        }
      },
      {
        id: 'node-integration-googlecal',
        x: integrationX + 380,
        y: integrationY,
        title: 'Google Calendar',
        data: {
          provider: 'Google Calendar API',
          category: 'Calendar',
          description: 'Sync events to user calendar',
          apiEndpoint: 'https://www.googleapis.com/calendar/v3',
          requiredKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
          documentation: 'https://developers.google.com/calendar'
        }
      }
    ];

    for (const config of integrationConfigs) {
      // 创建 loading 状态的节点
      const newNode: CanvasNode = {
        id: config.id,
        type: NodeType.INTEGRATION,
        x: config.x,
        y: config.y,
        title: config.title,
        status: 'loading',
        sectionId: SECTION_IDS.BACKEND,
        data: config.data
      };
      setNodes(prev => [...prev, newNode]);
      markNodeAsJustCreated(config.id);
      
      // 聚焦到新创建的集成节点
      focusOnNode(config.id, config.x, config.y, 320, 240); // Integration: 320 x 240
      const opId = addFileOperationMessage('create', 'integration', config.title, config.id);
      await new Promise(r => setTimeout(r, 800));
      updateFileOperationStatus(opId, 'success');
      
      // Reveal with done status
      await new Promise(r => setTimeout(r, 200));
      setNodes(prev => prev.map(n => n.id === config.id ? { ...n, status: 'done' } : n));
      setOperatingNode(null);
      await new Promise(r => setTimeout(r, 300));
    }

    addAIMessage("All integrations configured successfully.");
    
    // Clean up temporary files
    addAIMessage("Cleaning up temporary configuration files...");
    await new Promise(r => setTimeout(r, 300));
    const deleteOpId = addFileOperationMessage('delete', 'file', 'temp-config.json', undefined);
    await new Promise(r => setTimeout(r, 400));
    updateFileOperationStatus(deleteOpId, 'success');
    
    updatePlanStatus(planMsgId, 's6', 'done');

    // ============================================
    // Final Summary
    // ============================================
    await new Promise(r => setTimeout(r, 600));
    panTo(cx + 1000, cy, 0.16);

    // 结束 Agent 运行
    setAgentIsRunning(false);
    setCurrentOperatingNodeId(null);
    setCurrentTaskName('');

    setIsProcessing(false);
    addAIMessage("Complete! Your full-stack prototype is ready with:\n• 3 Product Strategy Documents\n• User Flow Diagram\n• 5 High-fidelity UI Screens\n• Backend Architecture & Data Models\n• Database Schemas\n• Third-party Integrations\n\nYou can click on any node to edit, or use the toolbar to add more resources.");
  };

  // --- Standard Handlers ---
  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleBatchUpdateNodePosition = (updates: {id: string, dx: number, dy: number}[]) => {
     setNodes(prev => {
         const map = new Map(prev.map(n => [n.id, n]));
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
        currentPlan={currentPlan}
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
        />

        {/* Agent Status Panel - 画布顶部居中 */}
        <AgentStatusPanel
          plan={currentPlan}
          isRunning={agentIsRunning}
          currentTaskName={currentTaskName}
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
