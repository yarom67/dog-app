# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mobile-first React SPA (max-width 480px) for tracking a dog's health. **Paw Quest** gamified theme — Fredoka headings, Manrope body, adventure palette (indigo/yellow/green).

**Stack:** React 19, Vite 7, React Router v7, Supabase (PostgreSQL + Storage), `lucide-react`, `date-fns`

## Commands

```bash
npm run dev      # Vite dev server — runs on port 5174 (see .claude/launch.json)
npm run build    # production build
npm run lint     # ESLint (no test suite)
npm run preview  # preview production build
```

**If Rollup fails:** `rm -rf node_modules package-lock.json && npm install` — fixes missing `@rollup/rollup-darwin-arm64`.

## Architecture

### Dual-mode data layer (`src/lib/db.js`)

All data access goes through `db.js`. It switches on `isConfigured()` from `src/lib/supabase.js`, which returns `true` only when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Without them the app runs fully offline via `localStorage` (keys prefixed `dogapp_`).

Every entity follows the same API: `get<Entity>(dogId)`, `save<Entity>(record)` (upserts on `record.id`), `delete<Entity>(id)`. When adding a new entity, implement **both** the Supabase and localStorage branches.

The `supabase` client is `null` when env vars are missing — never call `supabase.from()` without gating on `isConfigured()`.

### Routing (`App.jsx`)

Pages wrapped in `<Layout>` get the bottom tab bar (Map | Stats | [FAB→/medications] | Shields | Hero). Pages without `<Layout>` are full-screen.

### UI conventions

- **`Modal.jsx`** — bottom-sheet modal for all add/edit forms. Props: `isOpen`, `onClose`, `title`, `children`, `footer`.
- **CSS** — all styles in `src/index.css`. Key classes: `card`, `btn-primary`, `btn-secondary`, `badge`, `gradient-header`, `mission-card`, `boss-card`, `nav-fab`.
- **Theme colors:** `--adventure` `#4F46E5` (primary), `--mission` `#22C55E`, `--primary` `#FFB800`, `--coral` `#FF6B6B`.
- **Icons** — `lucide-react` only. Every icon-only `<button>` needs `aria-label`.
- **Numeric inputs** — use `inputMode="numeric"` for weight/cost fields.

### Database

All tables: `id uuid PK` (`gen_random_uuid()`), `dog_id uuid FK` → `dogs(id)` with cascade delete, `created_at timestamptz`. Full schema in `supabase/schema.sql` — run in Supabase → SQL Editor.

**Storage:** bucket `dog-images` (public). RLS policies for anon upload/read/delete are in `schema.sql` — run them too or uploads will fail with an RLS error.

### Email reminders

`supabase/functions/send-reminders/index.ts` — daily Edge Function using Resend. Set `RESEND_API_KEY` in Supabase Edge Function secrets, then deploy with `supabase functions deploy send-reminders`.

## Environment

Copy `.env.example` → `.env` and fill in Supabase credentials (Project URL + anon key from Supabase → Settings → API).

## Skills & Agents

- `/new-page` — scaffolds a new page following project conventions (mobile-first, dual-mode db, bottom sheet modal, Paw Quest theme)
- `/add-table` — generates SQL migration + `db.js` CRUD functions (both Supabase + localStorage branches) for a new table
- `mobile-ui-reviewer` subagent — reviews components for tap target size (≥44×44px), missing `aria-label` on icon buttons, color contrast, horizontal overflow on 375px screens, missing loading/empty states

## Known Gotchas

- `db.js` has pre-existing ESLint unused-var warnings on `created_at` destructuring — ignore unless refactoring that file.
- Subagents can introduce unused imports — run `npm run lint` after subagent rewrites.
