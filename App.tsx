import React, { useState } from 'react';
import { ChatSidebar } from './components/Chat/ChatSidebar';
import { CanvasContainer } from './components/Canvas/CanvasContainer';
import { MarkdownModal } from './components/Editor/MarkdownModal';
import { WhiteboardModal } from './components/Editor/WhiteboardModal';
import { ImmersiveView } from './components/Preview/ImmersiveView';
import { PinModal } from './components/Editor/PinModal';
import { DatabaseModal } from './components/Editor/DatabaseModal';
import { IntegrationModal } from './components/Editor/IntegrationModal';
import { CanvasNode, ChatMessage, NodeType, DocumentData, WhiteboardData, ScreenData, CanvasEdge, CanvasView, PlanStep, CanvasPin, TableData, APIData, TaskData, IntegrationData } from './types';
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
  INITIAL_ZOOM
} from './constants';

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
  taskLogin: TaskData;
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
  },
  taskLogin: {
      description: 'Implement passwordless login flow using magic links (SendGrid + Redis).',
      status: 'todo'
  }
};

const App = () => {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [pins, setPins] = useState<CanvasPin[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'welcome', role: 'ai', content: 'Hi! I can help you turn your idea into a full product prototype. Click "Start Simulation" to see me in action!', timestamp: Date.now() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [simulationStarted, setSimulationStarted] = useState(false);

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
      setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: "I want to build a community event app like Luma.", timestamp: Date.now() }]);
      setIsProcessing(true);

      // Wait a bit...
      await new Promise(r => setTimeout(r, 1000));

      // 2. AI Response + Plan
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
          role: 'ai', 
          content: "Sure! I'll help you build a Luma clone. Here is the execution plan:", 
          timestamp: Date.now(),
          plan: initialSteps
      }]);

      // --- PHASE 1: DOCUMENT ---
      await new Promise(r => setTimeout(r, 1000));
      updatePlanStatus(planMsgId, 's1', 'loading');
      
      // Pan Camera to Doc Section
      const cx = LAYOUT_CENTER_X;
      const cy = LAYOUT_CENTER_Y;
      const docY = cy + DOCUMENT_SECTION_Y_OFFSET;
      panTo(cx, docY, 0.5);

      // Create Document Nodes (Loading)
      await new Promise(r => setTimeout(r, 800));
      const docNodes: CanvasNode[] = [
        { id: 'node-doc-1', type: NodeType.DOCUMENT, x: cx - NODE_SPACING_X, y: docY, title: 'User Personas', status: 'loading', data: null, sectionId: SECTION_IDS.DOCUMENT },
        { id: 'node-doc-2', type: NodeType.DOCUMENT, x: cx, y: docY, title: 'Product Charter', status: 'loading', data: null, sectionId: SECTION_IDS.DOCUMENT },
        { id: 'node-doc-3', type: NodeType.DOCUMENT, x: cx + NODE_SPACING_X, y: docY, title: 'Core Requirements', status: 'loading', data: null, sectionId: SECTION_IDS.DOCUMENT },
      ];
      setNodes(prev => [...prev, ...docNodes]);

      // Reveal Doc Content
      await new Promise(r => setTimeout(r, 1500));
      setNodes(prev => prev.map(n => {
          if (n.id === 'node-doc-1') return { ...n, status: 'done', data: MOCK_LUMA_DATA.doc1 };
          if (n.id === 'node-doc-2') return { ...n, status: 'done', data: MOCK_LUMA_DATA.doc2 };
          if (n.id === 'node-doc-3') return { ...n, status: 'done', data: MOCK_LUMA_DATA.doc3 };
          return n;
      }));
      updatePlanStatus(planMsgId, 's1', 'done');

      // --- PHASE 2: CHART ---
      await new Promise(r => setTimeout(r, 1000));
      updatePlanStatus(planMsgId, 's2', 'loading');

      // Pan Camera to Chart
      const chartX = cx + CHART_SECTION_X_OFFSET;
      const chartY = cy - 300;
      panTo(chartX + 400, chartY + 300, 0.6); // Center on chart roughly

      // Create Chart Node (Loading)
      await new Promise(r => setTimeout(r, 800));
      const chartNode: CanvasNode = { 
          id: 'node-whiteboard-1', type: NodeType.WHITEBOARD, x: chartX, y: chartY, title: 'User Flow Chart', status: 'loading', data: null, sectionId: SECTION_IDS.CHART 
      };
      setNodes(prev => [...prev, chartNode]);

      // Reveal Chart
      await new Promise(r => setTimeout(r, 1500));
      setNodes(prev => prev.map(n => n.id === 'node-whiteboard-1' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.whiteboard } : n));
      updatePlanStatus(planMsgId, 's2', 'done');

      // --- PHASE 3: PROTOTYPE ---
      await new Promise(r => setTimeout(r, 1000));
      updatePlanStatus(planMsgId, 's3', 'loading');

      // Pan Camera to Screens (Center)
      panTo(cx, cy + 400, 0.25); // Zoom out to see grid

      // Create Skeleton Screens
      await new Promise(r => setTimeout(r, 800));
      const sY1 = cy;
      const sY2 = cy + WEB_NODE_SPACING_Y;
      const sXStart = cx - WEB_NODE_SPACING_X; 
      
      const screenNodes: CanvasNode[] = [
          { id: 'node-screen-1', type: NodeType.SCREEN, x: sXStart, y: sY1, title: 'Home', status: 'loading', data: null, sectionId: SECTION_IDS.SCREEN },
          { id: 'node-screen-2', type: NodeType.SCREEN, x: sXStart + WEB_NODE_SPACING_X, y: sY1, title: 'Explore', status: 'loading', data: null, sectionId: SECTION_IDS.SCREEN },
          { id: 'node-screen-3', type: NodeType.SCREEN, x: sXStart + (WEB_NODE_SPACING_X * 2), y: sY1, title: 'Event Detail', status: 'loading', data: null, sectionId: SECTION_IDS.SCREEN },
          { id: 'node-screen-4', type: NodeType.SCREEN, x: cx - (WEB_NODE_SPACING_X * 0.5), y: sY2, title: 'Create Event', status: 'loading', data: null, sectionId: SECTION_IDS.SCREEN },
          { id: 'node-screen-5', type: NodeType.SCREEN, x: cx + (WEB_NODE_SPACING_X * 0.5), y: sY2, title: 'Profile', status: 'loading', data: null, sectionId: SECTION_IDS.SCREEN },
      ];
      setNodes(prev => [...prev, ...screenNodes]);
      
      // Render Edges
      const flowEdges: CanvasEdge[] = [
        { id: 'e1', fromNode: 'node-screen-1', toNode: 'node-screen-2' },
        { id: 'e2', fromNode: 'node-screen-2', toNode: 'node-screen-3' },
        { id: 'e3', fromNode: 'node-screen-1', toNode: 'node-screen-4' },
        { id: 'e4', fromNode: 'node-screen-1', toNode: 'node-screen-5' },
      ];
      setEdges(flowEdges);

      // Reveal Screens Sequentially
      const revealScreen = async (id: string, data: any) => {
          await new Promise(r => setTimeout(r, 600));
          setNodes(prev => prev.map(n => n.id === id ? { ...n, status: 'done', data } : n));
      };

      await revealScreen('node-screen-1', MOCK_LUMA_DATA.screen1);
      await revealScreen('node-screen-2', MOCK_LUMA_DATA.screen2);
      await revealScreen('node-screen-3', MOCK_LUMA_DATA.screen3);
      await revealScreen('node-screen-4', MOCK_LUMA_DATA.screen4);
      await revealScreen('node-screen-5', MOCK_LUMA_DATA.screen5);

      updatePlanStatus(planMsgId, 's3', 'done');

      // --- PHASE 4: BACKEND PLANNING (Documents) ---
      await new Promise(r => setTimeout(r, 1500));
      updatePlanStatus(planMsgId, 's4', 'loading');

      // Pan to backend documents area
      panTo(cx + 2800, cy - 100, 0.4);

      // 4.1 Define backend region layout
      const backendBaseX = cx + BACKEND_SECTION_X_OFFSET;
      const backendBaseY = cy + BACKEND_SECTION_Y_OFFSET;

      // 4.2 Create Backend Planning Documents (Loading)
      const backendDocX = backendBaseX;
      const backendDocY = backendBaseY;
      const backendDocSpacing = 500;

      const backendDocNodes: CanvasNode[] = [
        { 
          id: 'node-doc-dev-plan', 
          type: NodeType.DOCUMENT, 
          x: backendDocX, 
          y: backendDocY,
          title: 'Development Plan',
          status: 'loading',
          sectionId: SECTION_IDS.BACKEND,
          data: null
        },
        { 
          id: 'node-doc-tech-stack', 
          type: NodeType.DOCUMENT, 
          x: backendDocX + backendDocSpacing, 
          y: backendDocY,
          title: 'Tech Stack',
          status: 'loading',
          sectionId: SECTION_IDS.BACKEND,
          data: null
        },
        { 
          id: 'node-doc-architecture', 
          type: NodeType.DOCUMENT, 
          x: backendDocX, 
          y: backendDocY + 600,
          title: 'Architecture Design',
          status: 'loading',
          sectionId: SECTION_IDS.BACKEND,
          data: null
        },
        { 
          id: 'node-doc-data-model', 
          type: NodeType.DOCUMENT, 
          x: backendDocX + backendDocSpacing, 
          y: backendDocY + 600,
          title: 'Data Model',
          status: 'loading',
          sectionId: SECTION_IDS.BACKEND,
          data: null
        }
      ];

      setNodes(prev => [...prev, ...backendDocNodes]);

      // Reveal Backend Documents
      await new Promise(r => setTimeout(r, 1500));
      setNodes(prev => prev.map(n => {
        if (n.id === 'node-doc-dev-plan') return { ...n, status: 'done', data: MOCK_LUMA_DATA.docDevPlan };
        if (n.id === 'node-doc-tech-stack') return { ...n, status: 'done', data: MOCK_LUMA_DATA.docTechStack };
        if (n.id === 'node-doc-architecture') return { ...n, status: 'done', data: MOCK_LUMA_DATA.docArchitecture };
        if (n.id === 'node-doc-data-model') return { ...n, status: 'done', data: MOCK_LUMA_DATA.docDataModel };
          return n;
      }));

      updatePlanStatus(planMsgId, 's4', 'done');

      // --- PHASE 5: BACKEND RESOURCES (Database & Tasks) ---
      await new Promise(r => setTimeout(r, 1500));
      updatePlanStatus(planMsgId, 's5', 'loading');

      // Pan to database area
      panTo(cx + 2750, cy + 300, 0.4);
      
      // 5.1 Create Database nodes
      const dbY = backendDocY + 1300;
      const dbSpacingX = 350;

      const databaseNodes: CanvasNode[] = [
        { 
          id: 'node-table-users', 
          type: NodeType.TABLE, 
          x: backendBaseX + 100, 
          y: dbY,
          title: 'Users',
          status: 'loading',
          sectionId: SECTION_IDS.BACKEND,
          data: MOCK_LUMA_DATA.tableUsers
        },
        { 
          id: 'node-table-events', 
          type: NodeType.TABLE, 
          x: backendBaseX + 100 + dbSpacingX, 
          y: dbY,
          title: 'Events',
          status: 'loading',
          sectionId: SECTION_IDS.BACKEND,
          data: MOCK_LUMA_DATA.tableEvents
        }
      ];

      setNodes(prev => [...prev, ...databaseNodes]);

      // Reveal database nodes
      await new Promise(r => setTimeout(r, 1000));
      setNodes(prev => prev.map(n => 
        n.sectionId === SECTION_IDS.BACKEND && n.type === NodeType.TABLE
          ? { ...n, status: 'done' } 
          : n
      ));

      updatePlanStatus(planMsgId, 's5', 'done');

      // --- PHASE 6: THIRD-PARTY INTEGRATION ---
      await new Promise(r => setTimeout(r, 1000));
      updatePlanStatus(planMsgId, 's6', 'loading');

      // Pan to integration area
      panTo(cx + 2700, cy + 600, 0.35);

      // 6.1 Create Integration nodes (below databases)
      const integrationX = backendBaseX + 100;
      const integrationY = dbY + 400;

      const integrationNodes: CanvasNode[] = [
        { 
          id: 'node-integration-sendgrid', 
          type: NodeType.INTEGRATION, 
          x: integrationX, 
          y: integrationY,
          title: 'SendGrid',
          status: 'loading',
          sectionId: SECTION_IDS.BACKEND,
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
          type: NodeType.INTEGRATION, 
          x: integrationX + 380, 
          y: integrationY,
          title: 'Google Calendar',
          status: 'loading',
          sectionId: SECTION_IDS.BACKEND,
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

      setNodes(prev => [...prev, ...integrationNodes]);

      // 6.2 No edges to integrations (removed)
      await new Promise(r => setTimeout(r, 800));

      // Gradually reveal integrations
      await new Promise(r => setTimeout(r, 1000));
      setNodes(prev => prev.map(n => 
        n.sectionId === SECTION_IDS.BACKEND && n.type === NodeType.INTEGRATION
          ? { ...n, status: 'done' } 
          : n
      ));

      updatePlanStatus(planMsgId, 's6', 'done');

      // 6.4 Final zoom out to see global view
      await new Promise(r => setTimeout(r, 800));
      panTo(cx + 1000, cy, 0.16);

      setIsProcessing(false);
      setMessages(prev => [...prev, { 
        id: 'final', 
        role: 'ai', 
        content: "Complete! You now have a full-stack prototype with backend infrastructure, task breakdown, and third-party integrations mapped out. You can manually adjust connections and add more resources as needed.", 
        timestamp: Date.now() 
      }]);
  };

  const updatePlanStatus = (msgId: string, stepId: string, status: 'pending' | 'loading' | 'done') => {
      setMessages(prev => prev.map(msg => {
          if (msg.id === msgId && msg.plan) {
              return {
                  ...msg,
                  plan: msg.plan.map(s => s.id === stepId ? { ...s, status } : s)
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

  return (
    <div className="flex w-full h-screen bg-slate-50 overflow-hidden">
      <ChatSidebar 
        messages={messages} 
        onSendMessage={(msg) => setMessages(p => [...p, { id: Date.now().toString(), role: 'user', content: msg, timestamp: Date.now() }])} 
        onStartSimulation={runSimulation}
        isProcessing={isProcessing}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        simulationStarted={simulationStarted}
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
        />

        {runningScreenId && (
          <ImmersiveView 
             data={getRunningScreenData()!}
             onClose={() => setRunningScreenId(null)}
             onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Pin Creation Modal */}
      {newPinPos && (
          <PinModal 
              isOpen={true}
              position={newPinPos}
              nodes={nodes}
              onSave={handleSavePin}
              onClose={() => { setNewPinPos(null); setPendingPinCanvasPos(null); }}
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
    </div>
  );
};

export default App;
