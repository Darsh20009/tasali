# تسالي كرومش (Tasali Qurumsh)

A full-stack café/snack-shop management system — **Crunchy Snacks Experience**.

## Stack

- **Frontend**: React 18, Vite, TailwindCSS, Radix UI, TanStack Query, Wouter
- **Backend**: Express.js, TypeScript (tsx), WebSockets
- **Database**: MongoDB (Mongoose)
- **Auth**: Passport.js (local strategy), express-session + connect-mongo
- **Other**: i18next (Arabic/English), Web Push, QR codes, Apple Wallet passkit

## Running the app

```
npm run dev
```

Starts the Express + Vite dev server on port **5000**.

## Required secrets

| Secret | Description |
|--------|-------------|
| `MONGODB_URI` | MongoDB connection string (Atlas or self-hosted) |
| `SESSION_SECRET` | Session signing secret |

Optional services (app degrades gracefully if missing):
- PayMob credentials — payment gateway
- VAPID keys — Web Push notifications
- SMTP credentials — email

## Project structure

```
server/      Express backend (routes, models, middleware)
client/      React frontend (pages, components, hooks)
api/         Serverless API entry (Vercel/edge deploy)
apple-wallet/ Passkit templates
public/      Static assets
```

## User preferences

_None recorded yet._
