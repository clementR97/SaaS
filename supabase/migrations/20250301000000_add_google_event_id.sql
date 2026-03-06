-- Colonne pour stocker l'ID de l'événement Google Calendar (sync)
alter table public.bookings add column if not exists google_event_id text;

comment on column public.bookings.google_event_id is 'ID de l''événement créé dans Google Calendar (sync)';
