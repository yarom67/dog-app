---
name: new-page
description: Scaffold a new page component in the dog-app following existing conventions (mobile-first, Supabase+localStorage dual mode, bottom sheet modals, green theme)
---

Create a new page in `src/pages/` following the dog-app conventions:

**Conventions to follow:**
- Mobile-first layout, max-width 480px, card-based UI
- Use `db.js` dual-mode data layer (Supabase with localStorage fallback) — match the pattern in existing pages
- Use `Modal.jsx` (bottom sheet) for add/edit forms
- Use `lucide-react` icons matching the forest green theme (#4a7c59)
- Follow the CSS class naming from `index.css` (card, btn-primary, badge, etc.)
- Add the route to `App.jsx`
- Add a nav link to `Layout.jsx` if it belongs in the bottom tab bar

**After creating the page:**
1. Show the full file tree of what was created/modified
2. Remind the user to add any new DB operations to both the Supabase and localStorage branches in `db.js`
3. If a new Supabase table is needed, suggest running `/add-table`

Page name: {{name}}
Purpose: {{purpose}}
Fields/data to track: {{fields}}
