-- Évite le 403 quand un visiteur prend RDV alors qu'une session admin est ouverte (même navigateur).
-- Sans cette policy, l'insert est fait en "authenticated" et était refusé.
drop policy if exists "Allow authenticated insert bookings" on public.bookings;
create policy "Allow authenticated insert bookings" on public.bookings for insert to authenticated with check (true);
