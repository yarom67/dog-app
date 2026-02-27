# 🐾 Dog Tracker App — Project Memory

> This file is maintained by Claude and updated continuously as the project evolves.
> It is the single source of truth for architecture decisions, feature status, and setup instructions.

---

## Project Overview

A **mobile-first web app** for dog owners to track everything about their dog's health and daily care. Built with React + Vite, backed by Supabase (PostgreSQL + Storage), with email reminders via Supabase Edge Functions.

**Primary user:** Yarom (personal use, may expand later)
**Design language:** Paw Quest gamified theme — indigo/yellow/green adventure palette, Fredoka headings, Manrope body, mobile-first cards

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7 |
| Routing | React Router v7 |
| Icons | lucide-react |
| Dates | date-fns |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage (`dog-images` bucket) |
| Email | Supabase Edge Functions + Resend |
| Fallback (no Supabase) | localStorage (full offline mode) |

---

## Features

### ✅ Implemented (v1.0 — 2026-02-27)
- Dog profile: name, breed, DOB, gender, color, microchip, photo upload
- Dashboard: today's meds, upcoming alerts, quick actions, stats overview
- Medications: add/edit/delete, active/inactive tabs, log given with timestamp
- Vaccinations: add/edit/delete, common vaccine picker, due date alerts, overdue badges
- Weight log: entries with trend chart (last 10), kg/lbs toggle, trend arrows
- Vet visits: full visit log, diagnosis/treatment, next appointment tracking
- Food log: grouped by day, food type + brand + amount + meal time
- Health journal: energy level, appetite, symptoms per day
- **Therapy sessions**: physiotherapy, hydrotherapy + 4 other types, exercises log, next session date
- Settings: email config, per-reminder-type toggles, Supabase connection status
- Navigation: bottom tab bar (Map, Stats, [FAB→Meds], Shields, Hero) — FAB pulses, routes to /medications
- LocalStorage fallback: works fully offline with no Supabase config needed
- Supabase schema: all 9 tables + indexes
- Email Edge Function: `send-reminders` TypeScript function for Supabase

### 📋 Future Ideas
- Multi-dog support (UI currently uses dogs[0])
- Authentication / Supabase RLS for sharing with a partner
- Export to PDF for vet visits
- Push notifications (PWA)
- Weight goal setting + alerts

---

## App Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Home screen, daily overview |
| `/dog-profile` | DogProfile | Edit dog info & photo |
| `/health` | HealthHub | Health logs + vet visits + therapy nav hub |
| `/medications` | Medications | Medication list, log given |
| `/vaccinations` | Vaccinations | Shot history + upcoming |
| `/weight` | WeightLog | Weight entries + chart |
| `/vet-visits` | VetVisits | Vet visit history |
| `/food` | FoodLog | Daily food entries |
| `/therapy` | TherapySessions | Physio + hydro sessions |
| `/settings` | Settings | Email, reminders, app config |

---

## Database Schema (Supabase)

### `dogs`
```sql
id uuid PK, name text, breed text, date_of_birth date,
gender text, color text, microchip_number text,
avatar_url text, created_at timestamptz
```

### `medications`
```sql
id uuid PK, dog_id uuid FK, name text, dosage text,
frequency text, times_per_day int, start_date date,
end_date date, notes text, is_active bool, created_at timestamptz
```

### `medication_logs`
```sql
id uuid PK, medication_id uuid FK, dog_id uuid FK,
given_at timestamptz, notes text, created_at timestamptz
```

### `vaccinations`
```sql
id uuid PK, dog_id uuid FK, name text, date_given date,
next_due_date date, vet_name text, batch_number text,
notes text, created_at timestamptz
```

### `weight_logs`
```sql
id uuid PK, dog_id uuid FK, weight decimal,
unit text (kg/lbs), date date, notes text, created_at timestamptz
```

### `vet_visits`
```sql
id uuid PK, dog_id uuid FK, date date, reason text,
vet_name text, clinic_name text, diagnosis text,
treatment text, cost decimal, next_appointment date,
notes text, created_at timestamptz
```

### `food_logs`
```sql
id uuid PK, dog_id uuid FK, food_type text,
brand text, amount_grams decimal, date date,
meal_time text, notes text, created_at timestamptz
```

### `health_logs`
```sql
id uuid PK, dog_id uuid FK, date date, symptoms text,
energy_level text, appetite text, notes text, created_at timestamptz
```

### `therapy_sessions`
```sql
id uuid PK, dog_id uuid FK, session_type text (physiotherapy/hydrotherapy/other),
date date, duration_minutes int, therapist_name text,
clinic_name text, exercises text, notes text,
next_session_date date, cost decimal, created_at timestamptz
```

---

## File Structure

```
dog-app/
├── CLAUDE.md                     ← This file
├── .env.example                  ← Supabase env vars template
├── index.html
├── vite.config.js
├── package.json
├── supabase/
│   ├── schema.sql                ← Full DB schema to run in Supabase
│   └── functions/
│       └── send-reminders/
│           └── index.ts          ← Daily email reminder Edge Function
└── src/
    ├── index.css                 ← All global styles (CSS variables + classes)
    ├── main.jsx
    ├── App.jsx                   ← Router setup
    ├── lib/
    │   ├── supabase.js           ← Supabase client (reads .env)
    │   └── db.js                 ← All DB operations (Supabase + localStorage fallback)
    ├── components/
    │   ├── Layout.jsx            ← App shell + bottom nav
    │   └── Modal.jsx             ← Bottom sheet modal
    └── pages/
        ├── Dashboard.jsx
        ├── DogProfile.jsx
        ├── Medications.jsx
        ├── Vaccinations.jsx
        ├── WeightLog.jsx
        ├── VetVisits.jsx
        ├── FoodLog.jsx
        ├── HealthHub.jsx
        ├── TherapySessions.jsx
        └── Settings.jsx
```

---

## Setup Instructions

### 1. Install dependencies
```bash
cd dog-app
npm install
```

### 2. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Settings → API

### 3. Configure environment
Create `.env` in the `dog-app/` folder:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the database schema
In Supabase → SQL Editor, paste and run the contents of `supabase/schema.sql`

### 5. Create storage bucket
In Supabase → Storage, create a bucket named `dog-images` (set to public)

### 6. Run the app
```bash
npm run dev
```
The app runs at `http://localhost:5173`

---

## Email Reminders Setup

Uses Supabase Edge Functions + [Resend](https://resend.com) (free tier: 100 emails/day).

1. Get a Resend API key at resend.com
2. In Supabase → Edge Functions, set secret: `RESEND_API_KEY=your-key`
3. Deploy the function: `supabase functions deploy send-reminders`
4. Set up a daily cron trigger in Supabase → Database → Extensions → pg_cron

Reminders are sent for:
- Medications (daily, if configured)
- Vaccinations due within N days
- Upcoming vet appointments
- Therapy sessions scheduled for tomorrow

---

## Design System (Paw Quest)

**Fonts:** Fredoka (headings) + Manrope (body) — loaded via Google Fonts in `index.html`

**CSS Variables:**
| Token | Value | Usage |
|-------|-------|-------|
| `--adventure` | `#4F46E5` | Primary accent, buttons, active nav |
| `--mission` | `#22C55E` | Success, completed, stamina |
| `--primary` | `#FFB800` | XP, stars, gold |
| `--xp` | `#A855F7` | Purple XP rewards, therapy |
| `--coral` | `#FF6B6B` | Alerts, boss battles, urgent |
| `--bg` | `#F8FAFC` | Dot-grid background |

**Page theme map:**
| Page | Gradient class | Gamified label |
|------|---------------|---------------|
| Medications | `gh-coral` | Potions & Shields |
| Vaccinations | `gh-xp` | Immunity Armor |
| VetVisits | `gh-coral` | Boss Battles |
| WeightLog | `gh-blue` | Body Stats |
| FoodLog | `gh-orange` | Energy Sources |
| HealthHub | `gh-mission` | Status Report |
| TherapySessions | `gh-adventure` | Training Log |
| Settings | `gh-primary` | HQ Settings |

**Key CSS classes:** `.mission-card`, `.mission-check`, `.boss-card`, `.dog-hero`, `.dog-avatar`, `.hero-xp-fill`, `.level-badge-hero`, `.progress-track`, `.progress-fill`, `.nav-fab`, `.gradient-header`, `.xp-counter`, `.alert-card`

**Animations (CSS-only, no library):** `bounceIn` (check completion), `pulseGlow` (completed missions), `fabPulse` (nav FAB), `fadeSlideIn` (card entry), `slideUp` (modal)

---

## Dev Gotchas

- **npm reinstall if Rollup fails:** `rm -rf node_modules package-lock.json && npm install` — fixes missing `@rollup/rollup-darwin-arm64` optional dep
- **Dev server port:** runs on `5174` (not default 5173). Configured in `../.claude/launch.json` via `["run", "dev", "--", "--port", "5174"]`
- **Supabase client is `null` without `.env`:** `supabase.js` exports `null` when env vars missing — all `db.js` functions gate on `isConfigured()`. Never call `supabase.from()` without this check.
- **`db.js` has pre-existing ESLint errors** (`created_at` unused in destructuring) — ignore, don't fix unless refactoring that file
- **Write tool requires prior Read** — always Read a file before Write, even when rewriting from scratch
- **Subagents introduce unused imports** — run `npm run lint` after any subagent rewrites and fix stragglers manually

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| LocalStorage fallback | App works instantly without any setup; user can migrate to Supabase later |
| Mobile-first, max-width 480px | Single owner using on phone primarily |
| Bottom sheet modals | Native mobile feel for forms |
| date-fns over moment | Smaller bundle, tree-shakeable |
| No auth (yet) | Personal-use app; Supabase RLS can be added later if multi-user |
| Therapy as separate page | User specifically requested physio + hydrotherapy tracking |

---

## Changelog

### 2026-02-27 — v1.1 Paw Quest Gamified Redesign ✅
- Replaced forest-green theme with full Paw Quest design system (Fredoka + Manrope, adventure palette)
- Redesigned all 10 pages with gamified language and gradient headers
- Dashboard: XP counter, hero card with animated XP bar, mission cards with bounceIn completion
- New bottom nav: Map | Stats | [FAB] | Shields | Hero
- CSS-only animations: bounceIn, pulseGlow, fabPulse, fadeSlideIn
- Fixed Supabase client crash on missing env vars (`supabase.js` now exports null safely)

### 2026-02-27 — v1.0 Complete ✅
- Project initialized with Vite + React
- Set up global CSS design system (green theme, mobile-first)
- Built `db.js` with Supabase + localStorage dual-mode data layer
- Built Layout (bottom nav), Modal (bottom sheet) components
- Built all 10 pages: Dashboard, DogProfile, Medications, Vaccinations, WeightLog, VetVisits, FoodLog, HealthHub, TherapySessions, Settings
- Added physiotherapy + hydrotherapy sessions per user request
- Wrote Supabase SQL schema (`supabase/schema.sql`)
- Wrote email reminder Edge Function (`supabase/functions/send-reminders/index.ts`)
- Build passes clean ✓ (488 kB JS, 11 kB CSS)
- CLAUDE.md established as continuously maintained project memory
