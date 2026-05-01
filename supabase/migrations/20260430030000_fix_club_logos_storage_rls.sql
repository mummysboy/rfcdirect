-- Fix: club-logos storage policies were silently rejecting all uploads.
-- The subquery `select claimed_by from public.clubs where id::text =
-- (storage.foldername(name))[1]` referenced an unqualified `name`, which
-- Postgres resolved to clubs.name (the club's display name) rather than
-- storage.objects.name (the upload path). The subquery returned no rows,
-- the WITH CHECK evaluated to NULL, and every owner upload failed with
-- "new row violates row-level security policy".
--
-- Restructure so the path lookup lives at the top level — `name` then
-- unambiguously refers to storage.objects.name — and the subquery only
-- runs against clubs to enumerate the caller's owned IDs.

drop policy if exists club_logos_owner_insert on storage.objects;
drop policy if exists club_logos_owner_update on storage.objects;
drop policy if exists club_logos_owner_delete on storage.objects;

create policy club_logos_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-logos'
    and (storage.foldername(name))[1] in (
      select id::text from public.clubs where claimed_by = auth.uid()
    )
  );

create policy club_logos_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-logos'
    and (storage.foldername(name))[1] in (
      select id::text from public.clubs where claimed_by = auth.uid()
    )
  )
  with check (
    bucket_id = 'club-logos'
    and (storage.foldername(name))[1] in (
      select id::text from public.clubs where claimed_by = auth.uid()
    )
  );

create policy club_logos_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'club-logos'
    and (storage.foldername(name))[1] in (
      select id::text from public.clubs where claimed_by = auth.uid()
    )
  );
