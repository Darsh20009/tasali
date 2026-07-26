# Tasali Qurumsh — QIROX CAFE Engine

Full-stack café management system (80% complete) built with React + Express + MongoDB.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Wouter
- **Backend**: Express + TypeScript (`server/index.ts`)
- **Database**: MongoDB via Mongoose
- **Auth**: express-session + Passport (local strategy)
- **i18n**: i18next (Arabic/English support)

## Running the App

```
npm run dev
```

Starts the Express server (port 5000) in development mode with Vite middleware for HMR.

## Required Secrets

| Secret | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (Atlas or self-hosted) |
| `SESSION_SECRET` | Express session signing key |

Optional secrets (features degrade gracefully without them):
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — Web Push notifications
- `PAYMOB_*` — PayMob payment gateway

## Project Structure

```
server/          Express backend, engines, routes, models
client/          React frontend (src/)
shared/          Zod schemas + Mongoose models (schema.ts)
public/          Static assets, PWA manifests
apple-wallet/    Passkit templates
api/             Vercel-style API entry point
data/            JSON seed data
```

## Key Engines (server/)

- `recipe-engine.ts` — Recipe costing with ingredient cost freezing
- `inventory-engine.ts` — Stock tracking, unit conversions, automatic deductions
- `accounting-engine.ts` — Daily snapshots, profit analysis, waste reporting
- `units-engine.ts` — Unit conversion library

## Build for Production

```
npm run build   # builds client (Vite) + server (esbuild) → dist/
npm start       # runs dist/index.js
```

## User Preferences

- Keep existing project structure and stack (Express + MongoDB + React/Vite).
