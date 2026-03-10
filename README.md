<div align="center">

# 🎬 Project Genesis

### Cinematic AI Movie Generation Platform

Transform your creative vision into cinematic reality with AI-powered movie generation.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-202020?logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.12-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.0-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Getting Started](#getting-started) · [Features](#features) · [Architecture](#architecture) · [API Reference](#api-reference) · [Contributing](#contributing)

</div>

---

## Overview

Project Genesis is a full-stack platform for AI-driven cinematic content creation. Users write a story concept in natural language, design characters with AI-generated reference images, configure cinematic settings, and render production-quality movies — all from a single unified interface.

The platform is built as a **Turborepo monorepo** with a Next.js 14 frontend, Fastify 5 API backend, PostgreSQL database, and a shared component library.

---

## Features

### 🎥 Movie Creation Wizard
- **5-step guided workflow**: Concept → Style → Characters → Settings → Review
- Natural language story prompts with genre selection
- AI-powered character generation with genre-specific templates
- Cinematic settings: resolution (720p/1080p/4K), frame rate, aspect ratio, color grading
- Cost estimation based on complexity

### 🎭 Character Designer
- AI-generated character profiles with personality traits, voice styles, and appearance
- Reference image generation (front, side, 3/4 view, expressions)
- 12 genre-specific character template sets
- Custom trait system with voice preview

### 🎬 Editor Suite
- **Script Editor** — Write and structure screenplays
- **Scene Configurator** — Set lighting, weather, time of day, camera work
- **Character Designer** — Full character design with reference images
- **Timeline Editor** — Arrange scenes and manage pacing

### 📊 Analytics Dashboard
- Project statistics and engagement metrics
- Watch time tracking and viewer demographics
- Activity feed with render status updates

### 🤝 Real-time Collaboration
- Multi-user project editing with WebSocket sync
- Role-based access control (Owner / Editor / Viewer)
- Character-level locking to prevent conflicts

### 🎨 Template System
- Browse and use community templates
- Categories: Story Starters, Character Archetypes, Scene Compositions, Full Movies, Style Presets, Camera Movements
- Rating and usage tracking

### 💳 Credits & Billing
- Credit-based rendering system with Stripe integration
- Tiered subscriptions: Free, Starter, Pro, Enterprise
- Transaction history and usage analytics

### 🌐 Explore & Watch
- Public movie gallery with search and filtering
- Video player with like, comment, and share functionality
- Creator profiles with filmography

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion |
| **Backend** | Fastify 5, Socket.IO, Bull (job queues) |
| **Database** | PostgreSQL, Prisma ORM 5.12 |
| **Auth** | NextAuth.js v4 (Credentials + Google + GitHub OAuth) |
| **Payments** | Stripe (subscriptions + one-time credits) |
| **State** | TanStack React Query v5, React Hook Form, Zod |
| **Charts** | Recharts v3 |
| **Caching** | Redis (via ioredis) |
| **Monorepo** | Turborepo 2.0, npm workspaces |
| **Language** | TypeScript 5.4 (strict mode throughout) |

---

## Architecture

```
project-genesis/
├── apps/
│   ├── web/                        # Next.js 14 frontend (App Router)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/         # Login & registration
│   │   │   │   ├── (dashboard)/    # Dashboard, projects, settings, analytics
│   │   │   │   ├── (marketing)/    # Landing page
│   │   │   │   ├── api/            # Next.js API routes (auth, projects, credits, etc.)
│   │   │   │   ├── profile/        # Public creator profiles
│   │   │   │   └── watch/          # Video player & comments
│   │   │   ├── components/
│   │   │   │   ├── editor/         # CharacterDesigner, SceneConfigurator, ScriptEditor, TimelineEditor
│   │   │   │   ├── analytics/      # Charts & metrics components
│   │   │   │   ├── collaboration/  # Real-time collaboration UI
│   │   │   │   ├── templates/      # Template browser & previews
│   │   │   │   ├── credits/        # Billing & transaction components
│   │   │   │   ├── watch/          # Video player, comments, reactions
│   │   │   │   └── wizard-step-*.tsx  # 5-step movie creation wizard
│   │   │   └── lib/                # Data fetching, auth, utilities
│   │   ├── tailwind.config.ts
│   │   └── next.config.js
│   │
│   └── api/                        # Fastify 5 backend API
│       └── src/
│           ├── routes/             # REST endpoints (projects, characters, scenes, etc.)
│           ├── services/           # AI service, credit service
│           ├── websocket/          # Socket.IO handlers (render updates, collaboration)
│           ├── queues/             # Bull job queues for render pipeline
│           ├── workers/            # Background render workers
│           ├── plugins/            # Fastify plugins (Prisma, auth)
│           └── config/             # Environment & Redis config
│
├── packages/
│   ├── ui/                         # @genesis/ui — Shared React component library
│   │   └── src/                    #   Button, Badge, Card, Input, Modal, Spinner, Toast
│   ├── database/                   # @genesis/database — Prisma schema & client
│   │   └── prisma/
│   │       ├── schema.prisma       #   20+ models, 20+ enums
│   │       └── seed.ts             #   Database seeder
│   ├── typescript-config/          # @genesis/typescript-config — Shared tsconfigs
│   └── eslint-config/              # @genesis/eslint-config — Shared lint rules
│
├── turbo.json                      # Turborepo pipeline configuration
├── package.json                    # Root workspace config
└── tsconfig.json                   # Root TypeScript config
```

---

## Database Schema

The Prisma schema defines a cinematic production data model:

| Model | Description |
|---|---|
| **User** | Accounts with subscription tiers (Free/Starter/Pro/Enterprise), credit balances, Stripe integration |
| **Project** | Movies with status pipeline (Draft → Pre-Production → In Production → Rendering → Completed) |
| **Script** | Raw prompts and structured screenplay content |
| **Character** | Characters with appearance, personality traits, voice profiles, and reference images |
| **Scene** | Scenes with lighting, weather, time of day, mood, and location |
| **Shot** | Individual shots with camera type, angle, movement, and AI generation prompts |
| **AudioTrack** | Dialogue, music, SFX, ambient, foley, and voiceover tracks |
| **RenderJob** | Queued rendering tasks (shot generation, upscaling, interpolation, compositing) |
| **Template** | Reusable project/character/scene templates with ratings |
| **ProjectMember** | Collaboration with role-based access (Owner/Editor/Viewer) |
| **Analytics** | Engagement tracking with view events and demographics |

**Supported Genres**: Action, Comedy, Drama, Horror, Sci-Fi, Fantasy, Thriller, Romance, Animation, Documentary, Experimental

**Camera System**: 10+ shot types, 6 camera angles, 15+ camera movements, 8 time-of-day presets, 9 weather conditions

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 10.0.0
- **PostgreSQL** 14+ (for full database mode)
- **Redis** (optional — for job queues and caching)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd project-genesis

# Install dependencies
npm install

# Generate Prisma client
npm run -w @genesis/database db:generate
```

### Environment Setup

**Web** (`apps/web/.env.local`):

```env
# Auth
NEXTAUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Demo mode (runs without database)
DEMO_MODE=true
```

**API** (`apps/api/.env`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/genesis

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Auth
JWT_SECRET=your-jwt-secret-min-32-chars

# Redis (optional)
REDIS_URL=redis://127.0.0.1:6379

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Database Setup

```bash
# Push schema to database
npm run -w @genesis/database db:push

# (Optional) Seed with sample data
npm run -w @genesis/database db:seed

# (Optional) Open Prisma Studio
npm run -w @genesis/database db:studio
```

### Running the App

```bash
# Development (starts all apps in parallel)
npm run dev

# Or run individually:
npm run -w @genesis/web dev      # Frontend on http://localhost:3000
npm run -w @genesis/api dev      # API on http://localhost:3001
```

```bash
# Production build
npm run build

# Start production server
npm run -w @genesis/web start    # Frontend
npm run -w @genesis/api start    # API
```

### Demo Mode

To run without PostgreSQL, set `DEMO_MODE=true` in `apps/web/.env.local`. This enables:
- **Demo login**: `demo@genesis.ai` / `Demo1234!` (PRO tier account)
- Mock dashboard data (projects, stats, activity)
- Mock template data
- Project creation without database persistence

---

## Available Scripts

### Root Commands

| Command | Description |
|---|---|
| `npm run dev` | Start all apps in development mode (Turbo) |
| `npm run build` | Build all apps and packages |
| `npm run lint` | Lint all packages |
| `npm run clean` | Remove all build artifacts |
| `npm run format` | Format code with Prettier |

### Database Commands

| Command | Description |
|---|---|
| `npm run -w @genesis/database db:generate` | Generate Prisma client |
| `npm run -w @genesis/database db:push` | Push schema to database |
| `npm run -w @genesis/database db:migrate` | Run database migrations (dev) |
| `npm run -w @genesis/database db:migrate:prod` | Deploy migrations (production) |
| `npm run -w @genesis/database db:seed` | Seed database with sample data |
| `npm run -w @genesis/database db:studio` | Open Prisma Studio GUI |
| `npm run -w @genesis/database db:reset` | Reset database (destructive) |

### App-specific Commands

| Command | Description |
|---|---|
| `npm run -w @genesis/web dev` | Start Next.js dev server |
| `npm run -w @genesis/web build` | Build Next.js for production |
| `npm run -w @genesis/api dev` | Start Fastify dev server (with tsx watch) |
| `npm run -w @genesis/api build` | Compile API TypeScript |

---

## API Reference

### Fastify Backend (`apps/api`, port 3001)

| Module | Endpoints | Description |
|---|---|---|
| **Health** | `GET /api/health` | Server health check |
| **Projects** | `GET/POST/PUT/DELETE /api/projects` | Project CRUD and management |
| **Characters** | `GET/POST/PUT/DELETE /api/characters` | Character CRUD with reference image generation |
| **Scenes** | `GET/POST/PUT/DELETE /api/scenes` | Scene management |
| **Templates** | `GET/POST /api/templates` | Template browsing, rating, and usage |
| **Analytics** | `GET /api/analytics` | Engagement and viewer data |
| **Credits** | `GET/POST /api/credits` | Credit balance and Stripe purchases |
| **Collaboration** | `GET/POST /api/collaboration` | Project sharing and member management |
| **Admin** | `GET/POST /api/admin` | Admin-only operations |
| **Webhooks** | `POST /api/webhooks` | Stripe payment webhooks |

### Next.js API Routes (`apps/web/src/app/api/`)

| Route | Description |
|---|---|
| `/api/auth/[...nextauth]` | NextAuth.js authentication (credentials + OAuth) |
| `/api/projects` | Project creation from wizard |
| `/api/credits/*` | Credit management |
| `/api/explore` | Public movie browsing |
| `/api/templates/*` | Template operations (get, rate, use) |
| `/api/watch/[id]/*` | Video analytics, comments, likes |
| `/api/profile/[username]` | Public profile data |

### WebSocket Events

| Namespace | Events | Description |
|---|---|---|
| **Render** | `render:progress`, `render:complete`, `render:failed` | Real-time render job updates |
| **Collaboration** | `collab:join`, `collab:lock`, `collab:update`, `collab:cursor` | Multi-user editing sync |

---

## Packages

### `@genesis/ui`
Shared React component library built with Radix UI primitives and Tailwind CSS.

| Component | Description |
|---|---|
| `Button` | Primary, secondary, ghost, danger variants with icon support |
| `Badge` | Status indicators (default, success, warning, error, info) |
| `Card` | Content container with glass morphism style |
| `Input` | Form input with label and validation |
| `Modal` | Dialog with overlay, powered by Radix UI Dialog |
| `Spinner` | Loading indicator |
| `Toast` | Notification system with success/error/warning variants |

### `@genesis/database`
Prisma schema, client, and migrations for PostgreSQL. Exports the Prisma client instance and all model/enum types.

### `@genesis/typescript-config`
Shared TypeScript configurations: `base.json`, `nextjs.json`, `node.json`, `react-library.json`.

### `@genesis/eslint-config`
Shared ESLint configurations: `base.js`, `next.js`, `node.js`, `react-internal.js`.

---

## Design System

The UI uses a custom dark theme with the **Genesis** color palette:

| Token | Usage |
|---|---|
| `genesis-*` | Primary purple gradient (brand color) |
| `neon-pink/purple/blue/cyan` | Accent colors for highlights |
| `surface-*` | Dark background layers (`#0a0a0f` base) |

**Fonts**: Inter (body), Space Grotesk (headings)

**Responsive**: Mobile-first with breakpoints at 475px (xs), 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl)

**Animations**: Framer Motion for page transitions, staggered lists, and micro-interactions

---

## Image Optimization

- **Formats**: WebP and AVIF with automatic negotiation
- **Device sizes**: 640, 750, 828, 1080, 1200, 1920px
- **Caching**: 30-day minimum cache TTL for static assets
- **Lazy loading**: Blur placeholder data URLs for progressive image loading

---

## Turborepo Pipeline

```
build
├── @genesis/database (prisma generate)
├── @genesis/ui (type check)
├── @genesis/api (tsc compile)
└── @genesis/web (next build, depends on ui + database)
```

- **Caching**: Build outputs cached locally (`.next/`, `dist/`, `.prisma/`)
- **Environment awareness**: Builds invalidate on env variable changes
- **Parallel execution**: Independent tasks run concurrently

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and ensure builds pass: `npm run build`
4. Lint and format: `npm run lint && npm run format`
5. Commit with a descriptive message
6. Push and open a Pull Request

### Code Style

- TypeScript strict mode throughout
- Prettier for formatting (configured at root)
- ESLint with shared configs per package
- Component files use PascalCase, utilities use kebab-case

---

## License

MIT
