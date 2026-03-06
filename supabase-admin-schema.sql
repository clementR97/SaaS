-- Schéma admin : à exécuter APRÈS supabase-schema.sql
-- Ajoute statut paiement, config éditable par l'admin, et RLS pour l'authentification

-- Colonne statut paiement (admin peut passer à "payé" / "non payé")
alter table public.bookings add column if not exists statut_paiement text not null default 'non payé' check (statut_paiement in ('payé', 'non payé'));

-- Colonne email si pas déjà présente (pour cohérence avec le formulaire)
alter table public.bookings add column if not exists email text;
-- ID événement Google Calendar (sync)
alter table public.bookings add column if not exists google_event_id text;
update public.bookings set email = '' where email is null;
alter table public.bookings alter column email set default '';

-- Table de configuration du site (prestations, emploi du temps, durée des séances)
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_config enable row level security;

-- Politiques site_config (idempotent : on supprime avant de recréer)
drop policy if exists "Allow read site_config" on public.site_config;
create policy "Allow read site_config" on public.site_config for select using (true);

drop policy if exists "Allow authenticated update site_config" on public.site_config;
create policy "Allow authenticated update site_config" on public.site_config for all to authenticated using (true) with check (true);

-- Données par défaut (prestations, emploi du temps, durée)
insert into public.site_config (key, value) values
  ('slot_duration_minutes', '60'),
  ('prestations', '[
    {"name":"Coaching sportif personnalisé","sessions":[{"name":"Séance individuelle 1h","price":"60 €"},{"name":"Pack 5 séances","price":"270 €"},{"name":"Pack 10 séances","price":"500 €"}]},
    {"name":"Madérothérapie","sessions":[{"name":"Séance madérothérapie corps","price":"80 €"},{"name":"Séance madérothérapie ventre","price":"50 €"},{"name":"Séance madérothérapie cuisses & fessiers","price":"65 €"},{"name":"Cure 5 séances corps","price":"350 €"},{"name":"Cure 10 séances corps","price":"650 €"}]},
    {"name":"Massage bien-être","sessions":[{"name":"Massage relaxant corps entier","price":"70 €"},{"name":"Massage dos & nuque","price":"40 €"},{"name":"Massage sportif récupération","price":"75 €"},{"name":"Massage aux pierres chaudes","price":"85 €"},{"name":"Massage drainant jambes légères","price":"55 €"},{"name":"Massage visage & crâne","price":"35 €"}]},
    {"name":"Naturopathie","sessions":[{"name":"Consultation initiale 1h30","price":"80 €"},{"name":"Consultation de suivi 1h","price":"55 €"}]}
  ]'::jsonb),
  ('admin_schedule', '[
    {"day":1,"type":"sport","startHour":9,"endHour":19,"slotDurationMinutes":60},
    {"day":2,"type":"sport","startHour":9,"endHour":19,"slotDurationMinutes":60},
    {"day":3,"type":"naturopathie","startHour":9,"endHour":19,"slotDurationMinutes":60},
    {"day":4,"type":"naturopathie","startHour":9,"endHour":12,"slotDurationMinutes":60},
    {"day":4,"type":"sport","startHour":12,"endHour":19,"slotDurationMinutes":60},
    {"day":5,"type":"massage","startHour":9,"endHour":19,"slotDurationMinutes":60},
    {"day":6,"type":"massage","startHour":14,"endHour":19,"slotDurationMinutes":60}
  ]'::jsonb),
  ('prestation_activity', '{"Coaching sportif personnalisé":"sport","Madérothérapie":"madero","Massage bien-être":"massage","Naturopathie":"naturopathie"}'::jsonb)
on conflict (key) do nothing;

-- Admin peut lire et modifier les réservations (SELECT, UPDATE) — idempotent
drop policy if exists "Allow authenticated select bookings" on public.bookings;
create policy "Allow authenticated select bookings" on public.bookings for select to authenticated using (true);

drop policy if exists "Allow authenticated update bookings" on public.bookings;
create policy "Allow authenticated update bookings" on public.bookings for update to authenticated using (true) with check (true);
