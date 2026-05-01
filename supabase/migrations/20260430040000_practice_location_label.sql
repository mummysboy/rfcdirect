-- Optional manager-set display name for the practice location (e.g.
-- "Memorial Park — South Field"). The clickable row in the profile shows this
-- label when present and falls back to address_display; the link target is
-- always the address (Google Maps search URL is built client-side).

alter table public.clubs
  add column practice_location_label text;

-- Extend column-level write grants from the initial migration so owners can
-- populate the new field on insert/update.
grant insert (practice_location_label) on public.clubs to authenticated;
grant update (practice_location_label) on public.clubs to authenticated;
