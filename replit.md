# تسالي كرومش (Tasali Qurmash)

A full-stack café/snacks management system.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js (TypeScript)
- **Database**: MongoDB (Mongoose)
- **Auth**: Passport.js (local strategy) + express-session

## Running the app
```
npm run dev
```
Starts the Express dev server on port 5000 with Vite middleware for the React frontend.

## Required secrets
| Secret | Description |
|--------|-------------|
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb+srv://...`) |
| `SESSION_SECRET` | Express session secret |

## Optional secrets / services
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — Web Push notifications
- `PAYMOB_*` — PayMob payment gateway
- Google OAuth credentials — Google Sheets integration

## Build for production
```
npm run build   # builds client (Vite) + server (esbuild)
npm start       # runs dist/index.js
```

## Project structure
```
server/       Express backend, routes, models, engines
client/src/   React frontend
public/       Static assets
api/          Vercel-style serverless entry (alternative deploy target)
apple-wallet/ Apple Wallet pass generation
```

## User preferences
