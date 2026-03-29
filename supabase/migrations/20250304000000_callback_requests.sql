-- Demandes « être rappelé » (nouveaux clients sans créneau choisi)
create table if not exists public.callback_requests (
  id uuid primary key default gen_random_uuid(),
  prenom text,
  nom text,
  telephone text not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.callback_requests enable row level security;

create policy "Allow anonymous insert callback_requests"
  on public.callback_requests
  for insert
  to anon
  with check (true);

create policy "Allow authenticated select callback_requests"
  on public.callback_requests
  for select
  to authenticated
  using (true);
