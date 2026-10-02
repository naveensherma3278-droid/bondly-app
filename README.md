# Bondly — AI Relationship Assistant

> Never miss an important moment. Strengthen relationships automatically.

Bondly is not a birthday reminder app. It's an AI relationship assistant that
tracks the people you care about, reminds you at the right moments, writes
personalized wishes, suggests gifts, and can auto-deliver everything at midnight.

## What's implemented (Phase 1 + 2)

- [x] JWT auth (register / login / me)
- [x] Contact management (name, birthday as recurring day+month, relationship,
      phone, email, interests, favorite color)
- [x] Upcoming-birthday feed with days-left
- [x] Smart reminder engine: T-30 / T-7 / T-3 / T-1 + birthday-morning + **midnight auto-wish**
- [x] Idempotent job scheduling (unique index per contact/type/year — safe to retry)
- [x] AI wish generator (pluggable LLM provider + offline template fallback)
- [x] Gift recommendation engine (interest → tiered ideas)
- [x] FCM-ready push notifier (logs in dev, sends real pushes with credentials)
- [x] Next.js client: login, dashboard, contacts, add-contact, calendar, wish studio

## Architecture

```
bondly-app/
├── server/          Express + MongoDB (API, scheduler, AI, gifts, notifications)
└── client/          Next.js 14 (App Router) + Tailwind CSS
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design decisions.

## Quick start

### 1. Server

```bash
cd server
cp .env.example .env          # fill in values
npm install
npm run dev                   # http://localhost:4000
```

Requires MongoDB running locally (or a MongoDB Atlas URI in `.env`).

### 2. Client

```bash
cd client
cp .env.example .env.local    # points to http://localhost:4000
npm install
npm run dev                   # http://localhost:3000
```

### 3. (Optional) AI wishes via OpenAI

```bash
# server/.env
OPENAI_API_KEY=sk-...
```

Without a key, Bondly uses its built-in template engine (7 tones, still personalized).

### 4. (Optional) Real push notifications

Add Firebase Admin credentials (`firebaseServiceAccount.json`) to `server/`.
Without it, notifications are logged to the console in dev mode.

## Roadmap status

| Phase | Status |
|-------|--------|
| 1 — Auth, contacts, calendar, notifications | ✅ scaffolded |
| 2 — AI wishes, scheduled wishes, gift suggestions | ✅ scaffolded |
| 3 — Gift marketplace, video builder, group gifts | 🔲 designed (see ARCHITECTURE) |
| 4 — AI relationship assistant | 🔲 designed |

## License

MIT — build the rocket. 🚀
