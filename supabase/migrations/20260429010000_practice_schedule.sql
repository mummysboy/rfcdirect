-- Practice schedule: which days a club practices (structured) and what times
-- (freeform). Days are a constrained text[] so the front end can render pills
-- and we can later filter by day; times stay freeform because clubs format
-- them inconsistently ("7-9 PM", "18:30 sharp", "Tue 7pm Thu 6:30pm").

alter table public.clubs
  add column practice_days text[] not null default '{}'::text[]
    check (practice_days <@ array['mon','tue','wed','thu','fri','sat','sun']::text[]),
  add column practice_times text;

-- Extend the column-level write grants from the initial migration so owners
-- (and authed inserters) can populate the new fields.
grant insert (practice_days, practice_times) on public.clubs to authenticated;
grant update (practice_days, practice_times) on public.clubs to authenticated;
