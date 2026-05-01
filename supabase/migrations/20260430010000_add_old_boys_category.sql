-- Add 'old_boys' to the clubs.category CHECK constraint.
--
-- Constraint name `clubs_category_check` is the Postgres-default for an
-- inline column check on (table=clubs, column=category). Drop-and-recreate
-- because Postgres has no `alter constraint` for check expressions.

alter table public.clubs drop constraint if exists clubs_category_check;

alter table public.clubs add constraint clubs_category_check
  check (category in (
    'mens','womens','mixed','youth_boys','youth_girls','youth_mixed','old_boys'
  ));
