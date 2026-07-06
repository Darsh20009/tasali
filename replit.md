# Tasali Qurumsh — Café/POS Management System

## Overview
Full-stack café management and point-of-sale system. React (Vite) frontend + Express backend + MongoDB via Mongoose. Supports multi-branch operations, menu management, inventory, recipe costing, accounting, loyalty, and more.

## Stack
- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui, TanStack Query, Wouter
- **Backend**: Express, Mongoose (MongoDB), TypeScript (`tsx` in dev)
- **Session store**: connect-mongo (MongoDB-backed sessions)
- **Real-time**: WebSocket (`/ws/orders`)

## How to Run
```
npm run dev          # development (port 5000)
npm run build        # production build
npm start            # serve production build
```

The workflow "Start application" runs `npm run dev` and exposes port 5000.

## Required Secrets
| Secret | Description |
|--------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Express session secret |

## Optional Secrets / Env Vars
| Key | Description |
|-----|-------------|
| `OWNER_INITIAL_PASSWORD` | Seed the initial owner account password |
| `QIROX_ADMIN_PASSWORD` | Qirox super-admin password (default: `qirox`) |
| `PAYMOB_SECRET_KEY` / `PAYMOB_PUBLIC_KEY` / `PAYMOB_HMAC_SECRET` | PayMob payment gateway |

## Project Status
~80% complete. Core business logic done (recipe engine, inventory, accounting, 14+ API routes). Phase 5 (Dashboard UI + tests) is pending.

## User Preferences
- Keep existing project structure and stack.
