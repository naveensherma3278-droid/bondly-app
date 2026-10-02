# Architecture & Design Decisions

## Product framing
Per the mentor note: market Bondly as **"an AI Relationship Assistant"**, not a
reminder app. Every feature below feeds that narrative.

## Core data model

### Contact — birthdays as recurring events
We store `day` (1-31) and `month` (1-12) instead of a single `Date`.
Rationale: a reminder for "every 15 November" shouldn't depend on a year.
`birthYear` is optional (used for age-aware gifts/wishes). Feb 29 is handled
by rolling to Feb 28 in non-leap years.

### ReminderJob — single source of truth for all scheduling
Every reminder (T-30, T-7, T-3, T-1, birthday-morning, midnight-wish) is a
document: `{ user, contact, type, runAt, status, channel, payload }`.

- **Unique index** on `(contact, type, year)` → scheduling is idempotent;
  re-adding a contact or re-running setup can never double-notify.
- A cron worker (every minute) picks up `pending` jobs where `runAt <= now`,
  builds the payload (AI wish + gifts for the T-7 job), sends, marks `sent`.
- After the midnight job fires, the scheduler re-schedules the contact for the
  **next year** — the loop is self-sustaining.

### Why not agenda/bull queue?
For an MVP, a minute-tick cron over an indexed collection is operationally
trivial (no Redis), horizontally safe (jobs claimed via atomic
`findOneAndUpdate`), and plenty fast at this scale. BullMQ is the natural
upgrade path when video rendering / group gifts arrive (Phase 3).

## AI service (`services/ai.js`)
Interface: `generateWish({ name, relationship, tone, interests })`.
- If `OPENAI_API_KEY` is set → LLM provider with a structured prompt.
- Otherwise → offline template engine with 7 tones (funny, emotional,
  romantic, friend, colleague, family, professional), personalized with
  interests and relationship.

Same pattern for `suggestGifts(contact)`: deterministic rule engine over an
interest→gift map with price tiers. Deterministic = testable, cheap, no
cold-start. ML ranking comes later.

## Notifications (`services/notifier.js`)
- `sendPush` uses Firebase Admin multicast if credentials exist; otherwise
  logs the payload (dev mode). WhatsApp/SMS/Email providers plug into the same
  interface (Twilio / nodemailer) behind feature flags.

## Security
- bcrypt (cost 12) password hashing, JWT access tokens
- helmet, CORS whitelist, rate limiting on `/api/auth`
- Central `validate` middleware — no unvalidated body reaches the models
- Secrets only via env; nothing sensitive is committed

## Client
Next.js App Router + Tailwind. Token in `localStorage` for MVP simplicity —
upgrade to httpOnly cookies when you add SSR personalization.

## Phase 3/4 hooks (designed, not built)
- **Group gift pooling**: `GiftPool` collection (members, contributions,
  escrow-ready schema), contribution ceiling enforcement in service layer.
- **Surprise video**: queue job (BullMQ + FFmpeg) stitching friend clips;
  `ReminderJob.channel = 'video'`.
- **Relationship strength**: `interactions` log + computed score; feeds the
  "You haven't contacted John in 35 days" nudge.
