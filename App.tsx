import React, { useState, useRef } from 'react';
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
import { streamTextDynamic } from './utils/streamText';

// --- Product Decision Questions Configuration (Luma Context) ---
const PRODUCT_QUESTIONS: QuestionData[] = [
  {
    questionId: 'q1',
    questionText: 'What is the primary event strategy?',
    currentPage: 1,
    totalPages: 4,
    options: [
      { id: 'social', label: 'Social & Mixers', description: 'Casual events, party vibe, map integration, guest networking' },
      { id: 'professional', label: 'Professional Webinars', description: 'Zoom/Meet integration, recording gating, Q&A tools' },
      { id: 'conference', label: 'Multi-track Conferences', description: 'Complex schedules, speaker profiles, ticketing tiers' },
      { id: 'community', label: 'Community Series', description: 'Recurring events, newsletter bundling, member directory' }
    ]
  },
  {
    questionId: 'q2',
    questionText: 'Define the visual identity',
    currentPage: 2,
    totalPages: 4,
    options: [
      { id: 'luma-dark', label: 'Dark Glassmorphism', description: 'Signature "Luma" look: dark mode, blurs, neon accents, cinematic' },
      { id: 'swiss', label: 'Swiss Minimalist', description: 'Clean white, bold typography, grid layouts, high contrast' },
      { id: 'playful', label: 'Gen Z / Pop', description: '3D elements, vibrant colors, rounded shapes, stickers' },
      { id: 'corporate', label: 'Enterprise Clean', description: 'Subtle blues, information density, standard reliable UI' }
    ]
  },
  {
    questionId: 'q3',
    questionText: 'Core growth & access model?',
    currentPage: 3,
    totalPages: 4,
    options: [
      { id: 'viral', label: 'Viral / Open', description: 'Magic links, social graph sharing, "I am going" cards, one-click RSVP' },
      { id: 'curated', label: 'Curated / Approval', description: 'Application forms, waitlists, manual approval flow, exclusivity' },
      { id: 'paid', label: 'Paid / Ticketing', description: 'Stripe integration, early bird pricing, promo codes, refunds' },
      { id: 'private', label: 'Private / Invite Only', description: 'Hidden events, password protection, specific email domains' }
    ]
  },
  {
    questionId: 'q4',
    questionText: 'Data & Integration Ecosystem',
    currentPage: 4,
    totalPages: 4,
    options: [
      { id: 'light', label: 'Lightweight Wrapper', description: 'Calendar sync + Email reminders only. Fast & simple.' },
      { id: 'marketing', label: 'Marketing Suite', description: 'Sync with HubSpot/Salesforce, retargeting pixels, analytics' },
      { id: 'content', label: 'Content Heavy', description: 'Host event recordings, slides, speaker notes, post-event gallery' },
      { id: 'community-data', label: 'Member Graph', description: 'Track attendance history, member reputation, loyalty' }
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
  // Act 1: Project Setup
  projectCharter: DocumentData;
  persona: DocumentData;
  // Act 2: Story Map
  storyMap: WhiteboardData;
  // Act 3: User Flow
  userFlow: WhiteboardData;
  // Act 4: PRD Documents
  prdHome: DocumentData;
  prdExplore: DocumentData;
  prdDetail: DocumentData;
  prdCreate: DocumentData;
  prdProfile: DocumentData;
  // Legacy (keeping for backward compatibility)
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
    content: `# Product Charter: Paraflow Clone

## Vision
To build the **Operating System for Communities**. We want to make gathering people together as easy and beautiful as creating a Notion page.

## Core Principles
1. **Design First:** Events are social signaling. They must look amazing.
2. **Minimal Friction:** One-click registration. Magic links. No passwords.
3. **Calendar Centric:** If it's not on the calendar, it doesn't exist.

## Success Metrics
- **Activation Rate:** 60% of signups create their first event within 7 days
- **Viral Coefficient:** 1.5+ (each event brings in 1.5 new users)
- **NPS Score:** 50+ among active hosts
`
  },
  persona: {
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

## The Community Builder
**Demographics:**
- Age: 28-45
- Occupation: Startup Founders, Community Managers
- Location: Tech Hubs

**Goals:**
- Build and nurture a community around their brand.
- Track engagement and attendee insights.
- Create beautiful, shareable event pages.

**Frustrations:**
- Fragmented tools (Notion + Calendly + Mailchimp).
- No unified view of community engagement.
`
  },

  // === Act 2: Story Map ===
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

      // 2. Phase 1: 流式输出交付物计划介绍（不包含 Screen）
      const deliverablesPlan = `## 交付物计划

在开始设计之前，让我介绍一下我们将生成的交付物：

1. **Product Charter** - 项目章程，定义产品愿景和目标
2. **User Persona** - 用户画像，明确目标用户特征和需求
3. **User Story Map** - 用户故事地图，梳理功能范围和优先级
4. **User Flow** - 用户流程图，展示核心交互路径
5. **PRD Documents** - 产品需求文档，详细说明每个功能模块

这些文档将帮助我们确保产品设计的完整性和一致性。

接下来，我需要问您几个问题来更好地理解需求...`;

      await addStreamingAIMessage(deliverablesPlan);
      setIsProcessing(false);

      // 3. Phase 2: 显示问题容器（包含所有问题，一次性加载）
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

    // 添加 AI 确认消息和执行计划
    await new Promise(r => setTimeout(r, 500));

    const planMsgId = 'ai-plan';
    const initialSteps: PlanStep[] = [
      { id: 's1', label: 'Product Charter & Persona', status: 'pending' },
      { id: 's2', label: 'User Story Map', status: 'pending' },           // 需确认 - 范围确认
      { id: 's3', label: 'User Flow', status: 'pending' },                // 需确认 - 范围确认
      { id: 's4', label: 'Feature PRD - Core Module', status: 'pending' }, // 需确认
      { id: 's5', label: 'Feature PRD - User Module', status: 'pending' }, // 需确认
      { id: 's6', label: 'Prototype Design', status: 'pending' },         // 最后执行
    ];

    setMessages(prev => [...prev, {
      id: planMsgId,
      type: 'ai',
      role: 'ai',
      content: "明白了！根据您的需求，这是我的执行计划：",
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
    targetNodeId: string,
    targetNodeType: NodeType,
    title: string,
    summary: string
  ): string => {
    const msgId = `confirmation-${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, {
      id: msgId,
      type: 'confirmation',
      content: '',
      timestamp: Date.now(),
      confirmation: {
        targetNodeId,
        targetNodeType,
        title,
        summary,
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
  const executeWorkflow = async (planMsgId: string) => {
    const cx = LAYOUT_CENTER_X;
    const cy = LAYOUT_CENTER_Y;

    // 开始 Agent 运行
    setAgentIsRunning(true);
    setIsObservationMode(true); // Auto-enable observation mode

    // ============================================
    // PHASE 1: Product Charter & Persona (无需确认)
    // ============================================
    await new Promise(r => setTimeout(r, 600));
    updatePlanStatus(planMsgId, 's1', 'loading');
    setCurrentTaskName('Product Charter & Persona');
    
    // Read todo list first
    await simulateToolCall('todo_read', '', 300);
    
    // Show thinking process
    const thinkingId1 = addThinkingMessage();
    await new Promise(r => setTimeout(r, 800));
    updateThinkingMessage(thinkingId1, '分析需求：社区活动应用，类似 Luma。核心功能：活动创建、RSVP 管理、日历同步、社交发现。', 'done');

    await addStreamingAIMessage("正在建立项目基础，创建项目章程和用户画像...");
    await new Promise(r => setTimeout(r, 500));

    // List project structure
    await simulateToolCall('list_dir', 'src/', 250);
    await simulateToolCall('grep', 'event management SaaS', 350);
    await simulateToolCall('read', 'docs/charter-template.md', 300);

    // Create Document Nodes for Project Setup
    const docY = cy + DOCUMENT_SECTION_Y_OFFSET;
    await new Promise(r => setTimeout(r, 600));
    
    // 创建 Project Charter
    const charterNode: CanvasNode = { id: 'node-charter', type: NodeType.DOCUMENT, x: cx - NODE_SPACING_X / 2, y: docY, title: 'Project Charter', status: 'loading', data: null, sectionId: SECTION_IDS.DOCUMENT };
    setNodes(prev => [...prev, charterNode]);
    markNodeAsJustCreated('node-charter');
    focusOnNode('node-charter', charterNode.x, charterNode.y, 450, 550);
    const charterOpId = addFileOperationMessage('create', 'document', 'Project Charter', 'node-charter');
    await new Promise(r => setTimeout(r, 800));
    updateFileOperationStatus(charterOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-charter' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.projectCharter } : n));

    // 创建 Persona
    await new Promise(r => setTimeout(r, 300));
    const personaNode: CanvasNode = { id: 'node-persona', type: NodeType.DOCUMENT, x: cx + NODE_SPACING_X / 2, y: docY, title: 'User Persona', status: 'loading', data: null, sectionId: SECTION_IDS.DOCUMENT };
    setNodes(prev => [...prev, personaNode]);
    markNodeAsJustCreated('node-persona');
    focusOnNode('node-persona', personaNode.x, personaNode.y, 450, 550);
    const personaOpId = addFileOperationMessage('create', 'document', 'User Persona', 'node-persona');
    await new Promise(r => setTimeout(r, 800));
    updateFileOperationStatus(personaOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-persona' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.persona } : n));
    setOperatingNode(null);

    await addStreamingAIMessage("项目基础已就绪。接下来开始梳理用户故事...");
    updatePlanStatus(planMsgId, 's1', 'done');

    // ============================================
    // PHASE 2: User Story Map (需确认 - 范围确认)
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 's2', 'loading');
    setCurrentTaskName('User Story Map');

    // 流式输出重要性说明
    await addStreamingAIMessage(`## 重要：范围确认

接下来的 **User Story Map** 定义了产品的功能范围，这是非常关键的确认点。

请仔细查看生成的用户故事，确认它们符合您的预期后再继续。`);
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('list_dir', 'templates/', 250);
    await simulateToolCall('grep', 'user story patterns', 300);
    await simulateToolCall('read', 'templates/story-map.json', 350);

    await addStreamingAIMessage("正在创建 Story Map，梳理 Epics 和 User Stories...");
    await new Promise(r => setTimeout(r, 400));

    // Define 阶段布局: Story Map 在左上角
    const storyMapX = cx - 1500;
    const storyMapY = cy - 800;

    await new Promise(r => setTimeout(r, 600));
    const storyMapNode: CanvasNode = {
        id: 'node-story-map', type: NodeType.WHITEBOARD, x: storyMapX, y: storyMapY, title: 'User Story Map', status: 'loading', data: null, sectionId: SECTION_IDS.CHART, confirmationStatus: 'pending'
    };
    setNodes(prev => [...prev, storyMapNode]);
    markNodeAsJustCreated('node-story-map');

    focusOnNode('node-story-map', storyMapX, storyMapY, 850, 700);
    const storyMapOpId = addFileOperationMessage('create', 'whiteboard', 'User Story Map', 'node-story-map');
    await new Promise(r => setTimeout(r, 1200));
    updateFileOperationStatus(storyMapOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-story-map' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.storyMap } : n));
    setOperatingNode(null);

    // 等待 User Story Map 确认
    updatePlanStatus(planMsgId, 's2', 'waiting_confirmation');
    await addStreamingAIMessage("User Story Map 已生成。请确认用户故事是否符合您的预期，这将决定产品的功能范围。");
    
    const storyMapConfirmId = addConfirmationMessage(
      'node-story-map',
      NodeType.WHITEBOARD,
      'User Story Map 确认',
      '包含 3 个 Epics 和 6 个 User Stories。这些故事将决定后续 PRD 和原型的范围，请仔细确认。'
    );
    
    const storyMapConfirmed = await waitForConfirmation(storyMapConfirmId);
    if (storyMapConfirmed) {
      setNodes(prev => prev.map(n => n.id === 'node-story-map' ? { ...n, confirmationStatus: 'confirmed' } : n));
    }
    updatePlanStatus(planMsgId, 's2', 'done');

    // ============================================
    // PHASE 3: User Flow (需确认 - 范围确认)
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 's3', 'loading');
    setCurrentTaskName('User Flow');

    await addStreamingAIMessage("根据确认的 Story Map 设计用户流程图...");
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('grep', 'navigation patterns', 300);
    await simulateToolCall('read', 'templates/flow-diagram.json', 350);

    await addStreamingAIMessage("正在生成页面转换流程图...");
    await new Promise(r => setTimeout(r, 400));

    // Define 阶段布局: User Flow 在 Story Map 下方
    const chartX = cx - 1500;
    const chartY = cy + 500;

    await new Promise(r => setTimeout(r, 600));
    const chartNode: CanvasNode = {
        id: 'node-user-flow', type: NodeType.WHITEBOARD, x: chartX, y: chartY, title: 'User Flow', status: 'loading', data: null, sectionId: SECTION_IDS.CHART, confirmationStatus: 'pending'
    };
    setNodes(prev => [...prev, chartNode]);
    markNodeAsJustCreated('node-user-flow');

    focusOnNode('node-user-flow', chartX, chartY, 850, 700);
    const wbOpId = addFileOperationMessage('create', 'whiteboard', 'User Flow', 'node-user-flow');
    await new Promise(r => setTimeout(r, 1200));
    updateFileOperationStatus(wbOpId, 'success');
    setNodes(prev => prev.map(n => n.id === 'node-user-flow' ? { ...n, status: 'done', data: MOCK_LUMA_DATA.userFlow } : n));
    setOperatingNode(null);

    // 等待 User Flow 确认
    updatePlanStatus(planMsgId, 's3', 'waiting_confirmation');
    await addStreamingAIMessage("User Flow 已生成。请确认用户流程是否符合您的预期，这将影响原型设计的页面结构。");
    
    const userFlowConfirmId = addConfirmationMessage(
      'node-user-flow',
      NodeType.WHITEBOARD,
      'User Flow 确认',
      '包含 5 个核心页面的转换流程。确认后将开始生成各功能模块的 PRD 文档。'
    );
    
    const userFlowConfirmed = await waitForConfirmation(userFlowConfirmId);
    if (userFlowConfirmed) {
      setNodes(prev => prev.map(n => n.id === 'node-user-flow' ? { ...n, confirmationStatus: 'confirmed' } : n));
    }
    updatePlanStatus(planMsgId, 's3', 'done');

    // ============================================
    // PHASE 4: Feature PRD - Core Module (需确认)
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 's4', 'loading');
    setCurrentTaskName('Feature PRD - Core Module');

    await addStreamingAIMessage(`## 核心功能模块 PRD

接下来我将为核心功能模块生成详细的 PRD 文档，包括：
- **Home** - 首页模块
- **Explore** - 探索模块  
- **Event Detail** - 活动详情模块

每个模块的 PRD 将详细说明功能需求、交互逻辑和验收标准。`);
    await new Promise(r => setTimeout(r, 400));

    await simulateToolCall('read', 'templates/prd-template.md', 300);
    await simulateToolCall('grep', 'feature specification', 350);

    // Define 阶段布局: PRD 在 User Flow 下方，横向排列
    const prdBaseX = cx - 1200;
    const prdBaseY = cy + 1400;

    // Core Module PRDs
    const corePrdConfigs = [
      { id: 'node-prd-home', x: prdBaseX, y: prdBaseY, title: 'PRD: Home', data: MOCK_LUMA_DATA.prdHome },
      { id: 'node-prd-explore', x: prdBaseX + NODE_SPACING_X, y: prdBaseY, title: 'PRD: Explore', data: MOCK_LUMA_DATA.prdExplore },
      { id: 'node-prd-detail', x: prdBaseX + NODE_SPACING_X * 2, y: prdBaseY, title: 'PRD: Detail', data: MOCK_LUMA_DATA.prdDetail },
    ];

    for (const prd of corePrdConfigs) {
      await addStreamingAIMessage(`正在创建 ${prd.title}...`);
      await new Promise(r => setTimeout(r, 300));

      const newNode: CanvasNode = {
        id: prd.id,
        type: NodeType.DOCUMENT,
        x: prd.x,
        y: prd.y,
        title: prd.title,
        status: 'loading',
        sectionId: SECTION_IDS.DOCUMENT,
        data: null,
        confirmationStatus: 'pending'
      };
      setNodes(prev => [...prev, newNode]);
      markNodeAsJustCreated(prd.id);
      
      focusOnNode(prd.id, prd.x, prd.y, 450, 550);
      const opId = addFileOperationMessage('create', 'document', prd.title, prd.id);
      await new Promise(r => setTimeout(r, 600));
      updateFileOperationStatus(opId, 'success');
      
      setNodes(prev => prev.map(n => n.id === prd.id ? { ...n, status: 'done', data: prd.data } : n));
      setOperatingNode(null);
      await new Promise(r => setTimeout(r, 200));
    }

    // 等待核心模块 PRD 确认
    updatePlanStatus(planMsgId, 's4', 'waiting_confirmation');
    await addStreamingAIMessage("核心模块 PRD 已生成。请确认这些功能需求是否符合预期。");
    
    const corePrdConfirmId = addConfirmationMessage(
      'node-prd-home',
      NodeType.DOCUMENT,
      '核心模块 PRD 确认',
      '包含 Home、Explore、Detail 三个核心页面的功能需求文档。确认后将继续生成用户模块 PRD。'
    );
    
    const corePrdConfirmed = await waitForConfirmation(corePrdConfirmId);
    if (corePrdConfirmed) {
      setNodes(prev => prev.map(n => 
        corePrdConfigs.some(p => p.id === n.id) ? { ...n, confirmationStatus: 'confirmed' } : n
      ));
    }
    updatePlanStatus(planMsgId, 's4', 'done');

    // ============================================
    // PHASE 5: Feature PRD - User Module (需确认)
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 's5', 'loading');
    setCurrentTaskName('Feature PRD - User Module');

    await addStreamingAIMessage(`## 用户功能模块 PRD

接下来生成用户相关功能模块的 PRD 文档：
- **Create Event** - 创建活动模块
- **Profile** - 用户中心模块`);
    await new Promise(r => setTimeout(r, 400));

    // User Module PRDs
    const userPrdConfigs = [
      { id: 'node-prd-create', x: prdBaseX + NODE_SPACING_X * 0.5, y: prdBaseY + 600, title: 'PRD: Create', data: MOCK_LUMA_DATA.prdCreate },
      { id: 'node-prd-profile', x: prdBaseX + NODE_SPACING_X * 1.5, y: prdBaseY + 600, title: 'PRD: Profile', data: MOCK_LUMA_DATA.prdProfile },
    ];

    for (const prd of userPrdConfigs) {
      await addStreamingAIMessage(`正在创建 ${prd.title}...`);
      await new Promise(r => setTimeout(r, 300));

      const newNode: CanvasNode = {
        id: prd.id,
        type: NodeType.DOCUMENT,
        x: prd.x,
        y: prd.y,
        title: prd.title,
        status: 'loading',
        sectionId: SECTION_IDS.DOCUMENT,
        data: null,
        confirmationStatus: 'pending'
      };
      setNodes(prev => [...prev, newNode]);
      markNodeAsJustCreated(prd.id);
      
      focusOnNode(prd.id, prd.x, prd.y, 450, 550);
      const opId = addFileOperationMessage('create', 'document', prd.title, prd.id);
      await new Promise(r => setTimeout(r, 600));
      updateFileOperationStatus(opId, 'success');
      
      setNodes(prev => prev.map(n => n.id === prd.id ? { ...n, status: 'done', data: prd.data } : n));
      setOperatingNode(null);
      await new Promise(r => setTimeout(r, 200));
    }

    // 等待用户模块 PRD 确认
    updatePlanStatus(planMsgId, 's5', 'waiting_confirmation');
    await addStreamingAIMessage("用户模块 PRD 已生成。请确认这些功能需求后，我们将开始设计原型。");
    
    const userPrdConfirmId = addConfirmationMessage(
      'node-prd-create',
      NodeType.DOCUMENT,
      '用户模块 PRD 确认',
      '包含 Create Event、Profile 两个用户相关页面的功能需求文档。确认后将开始生成原型设计。'
    );
    
    const userPrdConfirmed = await waitForConfirmation(userPrdConfirmId);
    if (userPrdConfirmed) {
      setNodes(prev => prev.map(n => 
        userPrdConfigs.some(p => p.id === n.id) ? { ...n, confirmationStatus: 'confirmed' } : n
      ));
    }
    updatePlanStatus(planMsgId, 's5', 'done');

    // ============================================
    // PHASE 6: Prototype Design (最后执行)
    // ============================================
    await new Promise(r => setTimeout(r, 800));
    updatePlanStatus(planMsgId, 's6', 'loading');
    setCurrentTaskName('Prototype Design');

    await addStreamingAIMessage(`## 原型设计

所有 PRD 已确认，现在开始根据确认的功能需求生成高保真原型界面...`);
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

    await addStreamingAIMessage("正在构建 Home 和 Explore 页面...");
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

    await addStreamingAIMessage("正在创建 Event Detail、表单页面和用户中心...");
    await new Promise(r => setTimeout(r, 400));

    await createAndRevealScreen(screenConfigs[2]); // Event Detail
    await createAndRevealScreen(screenConfigs[3]); // Create Event
    await createAndRevealScreen(screenConfigs[4]); // Profile

    await addStreamingAIMessage("所有原型界面已生成完成，包含完整的页面导航流程。");
    updatePlanStatus(planMsgId, 's6', 'done');

    // ============================================
    // Final Summary
    // ============================================
    await new Promise(r => setTimeout(r, 600));
    panTo(cx, cy, 0.25);

    // 结束 Agent 运行
    setAgentIsRunning(false);
    setIsObservationMode(false); // Auto-disable observation mode
    setCurrentOperatingNodeId(null);
    setCurrentTaskName('');

    setIsProcessing(false);
    await addStreamingAIMessage(`## 设计完成！

您的产品蓝图已准备就绪：

- **Project Charter & User Persona** - 项目章程和用户画像
- **User Story Map** - 用户故事地图（3 个 Epics，6 个 Stories）
- **User Flow** - 用户流程图
- **5 个 PRD 文档** - 各功能模块的产品需求文档
- **5 个高保真原型界面** - 可交互的 UI 设计

您可以点击任意节点进行编辑，或使用工具栏添加更多资源。`);
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
