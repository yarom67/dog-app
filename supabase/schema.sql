-- Dog Tracker App — Supabase Schema
-- Run this in Supabase > SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── DOGS ──────────────────────────────────────
create table if not exists dogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text,
  date_of_birth date,
  gender text,
  color text,
  microchip_number text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ── MEDICATIONS ───────────────────────────────
create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references dogs(id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  times_per_day int default 1,
  start_date date,
  end_date date,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references medications(id) on delete cascade,
  dog_id uuid references dogs(id) on delete cascade,
  given_at timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

-- ── VACCINATIONS ──────────────────────────────
create table if not exists vaccinations (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references dogs(id) on delete cascade,
  name text not null,
  date_given date not null,
  next_due_date date,
  vet_name text,
  batch_number text,
  notes text,
  created_at timestamptz default now()
);

-- ── WEIGHT LOGS ───────────────────────────────
create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references dogs(id) on delete cascade,
  weight decimal not null,
  unit text default 'kg',
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- ── VET VISITS ────────────────────────────────
create table if not exists vet_visits (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references dogs(id) on delete cascade,
  date date not null,
  reason text,
  vet_name text,
  clinic_name text,
  diagnosis text,
  treatment text,
  cost decimal,
  next_appointment date,
  notes text,
  created_at timestamptz default now()
);

-- ── FOOD LOGS ─────────────────────────────────
create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references dogs(id) on delete cascade,
  food_type text,
  brand text,
  amount_grams decimal,
  date date not null default current_date,
  meal_time text,
  notes text,
  created_at timestamptz default now()
);

-- ── HEALTH LOGS ───────────────────────────────
create table if not exists health_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references dogs(id) on delete cascade,
  date date not null default current_date,
  symptoms text,
  energy_level text,
  appetite text,
  notes text,
  created_at timestamptz default now()
);

-- ── THERAPY SESSIONS ──────────────────────────
create table if not exists therapy_sessions (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references dogs(id) on delete cascade,
  session_type text not null, -- 'Physiotherapy', 'Hydrotherapy', 'Acupuncture', etc.
  date date not null,
  duration_minutes int default 45,
  therapist_name text,
  clinic_name text,
  exercises text,
  notes text,
  next_session_date date,
  cost decimal,
  created_at timestamptz default now()
);

-- ── STORAGE BUCKET ────────────────────────────
-- Run in Supabase > Storage > Create bucket:
-- Name: dog-images, Public: true

-- ── INDEXES ───────────────────────────────────
create index if not exists idx_medications_dog on medications(dog_id);
create index if not exists idx_medication_logs_dog on medication_logs(dog_id);
create index if not exists idx_vaccinations_dog on vaccinations(dog_id);
create index if not exists idx_weight_logs_dog on weight_logs(dog_id);
create index if not exists idx_vet_visits_dog on vet_visits(dog_id);
create index if not exists idx_food_logs_dog on food_logs(dog_id);
create index if not exists idx_health_logs_dog on health_logs(dog_id);
create index if not exists idx_therapy_sessions_dog on therapy_sessions(dog_id);
