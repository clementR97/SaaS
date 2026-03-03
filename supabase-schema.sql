-- À exécuter dans Supabase : SQL Editor → New query → coller ce script → Run
-- Table des réservations (stockage provisoire jusqu’à la date du rendez-vous)

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  telephone text not null,
  date_rdv date not null,
  heure_rdv text not null,
  mode_paiement text not null check (mode_paiement in ('Espèces', 'Carte bancaire')),
  prestation text not null,
  session text not null,
  created_at timestamptz not null default now()
);

-- Index pour filtrer les rendez-vous passés (nettoyage ou archivage)
create index if not exists idx_bookings_date_rdv on public.bookings (date_rdv);

-- Un seul rendez-vous par créneau (date + heure)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_date_heure_unique') then
    alter table public.bookings add constraint bookings_date_heure_unique unique (date_rdv, heure_rdv);
  end if;
end $$;

-- RLS : les visiteurs du site peuvent uniquement insérer (prendre RDV), pas lire/modifier/supprimer
alter table public.bookings enable row level security;

create policy "Allow anonymous insert" on public.bookings
  for insert
  to anon
  with check (true);

-- Optionnel : permettre à l’authentifié (admin) de tout faire (à activer quand vous aurez l’auth)
-- create policy "Allow authenticated full access" on public.bookings for all to authenticated using (true) with check (true);

-- Nettoyage des rendez-vous passés (à lancer manuellement ou via cron / Edge Function) :
-- delete from public.bookings where date_rdv < current_date;

-- Fonction pour que les visiteurs puissent voir quels créneaux sont déjà pris (sans voir noms/téléphones)
create or replace function public.get_booked_slots()
returns table (date_rdv date, heure_rdv text)
language sql
security definer
set search_path = public
as $$
  select b.date_rdv, b.heure_rdv
  from public.bookings b
  where b.date_rdv >= current_date;
$$;

grant execute on function public.get_booked_slots() to anon;
