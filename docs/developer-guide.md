# Developer Documentation

## Architecture Overview

Project Genesis is a **Turborepo monorepo** with the following structure:

```
Artist/
├── apps/
│   ├── web/          # Next.js 14 frontend (App Router)
│   └── api/          # Fastify 5 backend API
├── packages/
│   ├── ui/           # Shared React component library
│   ├── database/     # Prisma schema & client
│   ├── eslint-config/# Shared ESLint config
│   └── typescript-config/ # Shared tsconfig
└── docs/             # Documentation
```

### Tech Stack

| Layer      | Technology                    |
|-----------|-------------------------------|
| Frontend  | Next.js 14, React 18, Tailwind CSS |
| Backend   | Fastify 5, Node.js            |
| Database  | PostgreSQL + Prisma ORM       |
| Auth      | NextAuth.js v4                |
| State     | TanStack Query, React Hook Form |
| Animation | Framer Motion                 |
| Payments  | Stripe                        |
| Real-time | Socket.IO                     |
| Validation| Zod                           |

---

## Setup Instructions

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm 9+
- PostgreSQL 15+ (optional with DEMO_MODE)

### Installation

```bash
git clone https://github.com/Abhiram-1317/ArtistMaker.git
cd ArtistMaker
npm install
```

### Environment Setup

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` with your values. See the env.example for all available variables.

### Development

```bash
# Start all apps in dev mode
npx turbo dev

# Build all packages
npx turbo build

# Build only the web app
npx turbo build --filter=@genesis/web

# Start production server
cd apps/web && npx next start -p 3000
```

### Demo Mode

Set `DEMO_MODE=true` in your `.env.local` to bypass database requirements. This enables:
- Mock authentication (demo@genesis.ai / Demo1234!)
- Mock project creation
- Mock data for dashboard

---

## Database Schema

The Prisma schema defines the following models:

| Model          | Description                        |
|----------------|------------------------------------|
| User           | User accounts with profile data    |
| Account        | OAuth provider accounts            |
| Session        | Active user sessions               |
| Project        | Movie projects with settings       |
| Scene          | Individual scenes within projects  |
| Character      | Character definitions              |
| RenderJob      | Video generation job queue          |
| Comment        | User comments on movies            |
| Like           | User likes on movies               |
| Credit         | Credit balance and transactions    |
| Subscription   | User subscription plans            |

### Running Migrations

```bash
cd packages/database
npx prisma migrate dev
npx prisma generate
```

---

## API Reference

### Next.js API Routes (apps/web)

| Route                      | Method | Description           |
|---------------------------|--------|------------------------|
| `/api/auth/[...nextauth]` | ALL    | Authentication         |
| `/api/projects`           | GET/POST | List/create projects |
| `/api/explore`            | GET    | Public movie feed      |
| `/api/watch/[id]`         | GET    | Movie details          |
| `/api/analytics`          | GET    | User analytics         |
| `/api/credits`            | GET/POST | Credit management    |
| `/api/profile`            | GET/PUT | User profile          |
| `/api/templates`          | GET    | Project templates      |

### Fastify API (apps/api)

The Fastify server at `apps/api` runs on port 3001 and provides:
- WebSocket support via Socket.IO
- Render queue management
- External AI service integration

---

## Security

### Headers
All responses include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (strict allowlist)
- `Strict-Transport-Security` (production only)
- `Referrer-Policy: strict-origin-when-cross-origin`

### CSRF Protection
Mutating API requests (POST/PUT/PATCH/DELETE) validate the `Origin` header against the `Host` header in middleware.

### Input Sanitization
Use `sanitizeText()` and `sanitizeUrl()` from `@/lib/sanitize` for user-provided content.

### Environment Validation
Use `validateEnv()` from `@/lib/env` to validate all environment variables at startup.

---

## Project Structure (apps/web)

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login & Register
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (marketing)/       # Landing page
│   ├── api/               # API routes
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   ├── cookies/           # Cookie policy
│   ├── layout.tsx         # Root layout
│   ├── not-found.tsx      # 404 page
│   ├── global-error.tsx   # 500 error boundary
│   ├── robots.ts          # robots.txt generation
│   └── sitemap.ts         # sitemap.xml generation
├── components/
│   ├── ui/                # Reusable UI primitives
│   ├── editor/            # Project editor components
│   ├── analytics/         # Analytics dashboard
│   ├── seo/               # JSON-LD structured data
│   ├── templates/         # Template system
│   ├── collaboration/     # Real-time collaboration
│   ├── watch/             # Movie player
│   └── credits/           # Credits & billing
├── lib/                   # Utilities
│   ├── env.ts            # Environment validation
│   └── sanitize.ts       # XSS prevention
└── middleware.ts          # Auth, CSRF, security
```

---

## Contributing

### Code Style
- TypeScript strict mode
- Tailwind CSS for styling (no inline styles)
- React Server Components by default; `"use client"` only when needed
- Zod for runtime validation

### Branch Convention
- `main` — production
- `dev` — development
- `feature/*` — feature branches
- `fix/*` — bug fixes

### Pull Request Process
1. Create a feature branch from `dev`
2. Make your changes
3. Ensure `npx turbo build` passes
4. Submit a PR with a clear description
5. Request review

### Commit Messages
Follow conventional commits:
```
feat: add character AI generation
fix: resolve 404 on projects page
docs: update API reference
```
