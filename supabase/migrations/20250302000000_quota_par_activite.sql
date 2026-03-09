-- Quota par type d'activité : plusieurs clients peuvent réserver le même créneau jusqu'à concurrence du quota.
-- 1. Colonne activity_type (pour compter les RDV par type)
alter table public.bookings add column if not exists activity_type text;

-- 2. Supprimer la contrainte d'unicité (date_rdv, heure_rdv) pour autoriser plusieurs RDV au même créneau
alter table public.bookings drop constraint if exists bookings_date_heure_unique;

-- 3. Remplacer l'ancienne fonction get_booked_slots() (sans params) par la version avec quota
drop function if exists public.get_booked_slots();

-- 4. Nouvelle fonction : retourne les créneaux "pleins" pour un type d'activité donné (count >= quota).
-- Les anciennes réservations sans activity_type sont considérées comme "pleines" (quota 1) pour tout le monde.
create or replace function public.get_booked_slots(p_activity_type text, p_quota int)
returns table (date_rdv date, heure_rdv text)
language sql
security definer
set search_path = public
as $$
  -- Créneaux pleins pour ce type d'activité (count >= quota)
  select b.date_rdv, b.heure_rdv
  from public.bookings b
  where b.date_rdv >= current_date and b.activity_type = p_activity_type
  group by b.date_rdv, b.heure_rdv
  having count(*) >= p_quota
  union
  -- Anciennes réservations sans activity_type : créneau considéré plein dès 1 RDV
  select b.date_rdv, b.heure_rdv
  from public.bookings b
  where b.date_rdv >= current_date and b.activity_type is null
  group by b.date_rdv, b.heure_rdv
  having count(*) >= 1;
$$;

grant execute on function public.get_booked_slots(text, int) to anon;
grant execute on function public.get_booked_slots(text, int) to authenticated;

-- 5. Nombre de réservations par créneau (pour afficher X/Y dans le calendrier)
create or replace function public.get_slot_counts(p_activity_type text)
returns table (date_rdv date, heure_rdv text, count bigint)
language sql
security definer
set search_path = public
as $$
  select b.date_rdv, b.heure_rdv, count(*)::bigint
  from public.bookings b
  where b.date_rdv >= current_date and b.activity_type = p_activity_type
  group by b.date_rdv, b.heure_rdv;
$$;

grant execute on function public.get_slot_counts(text) to anon;
