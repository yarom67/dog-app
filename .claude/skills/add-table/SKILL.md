---
name: add-table
description: Generate a Supabase SQL migration + db.js CRUD functions + localStorage fallback for a new dog-app table
---

Add a new database table to the dog tracker app.

**Steps to complete:**

1. **Write the SQL** — Append a CREATE TABLE block to `supabase/schema.sql` following existing conventions:
   - `id uuid primary key default gen_random_uuid()`
   - `dog_id uuid references dogs(id) on delete cascade`
   - `created_at timestamptz default now()`
   - Add a matching index: `create index if not exists idx_{{table_name}}_dog on {{table_name}}(dog_id);`

2. **Add CRUD functions to `src/lib/db.js`** — Follow the dual-mode pattern exactly:
   ```js
   // Supabase branch
   const { data, error } = await supabase.from('{{table_name}}').select('*').eq('dog_id', dogId)
   if (error) throw error
   return data
   // localStorage branch (fallback)
   return JSON.parse(localStorage.getItem('{{table_name}}') || '[]').filter(r => r.dog_id === dogId)
   ```
   Implement: `get{{TableName}}`, `add{{TableName}}`, `update{{TableName}}`, `delete{{TableName}}`

3. **Output a ready-to-run SQL snippet** the user can paste into Supabase → SQL Editor.

Table name: {{table_name}}
Fields (name + type): {{fields}}
