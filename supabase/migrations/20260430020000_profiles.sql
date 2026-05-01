-- Profiles: per-user role flags. A user is a manager, a player, or both.
-- Roles are chosen at signup and stored alongside the auth.users row via the
-- handle_new_user trigger; nothing is gated on these flags yet — they're
-- collected so future features (favorites, alerts, manager-only routes) can
-- branch on role without another migration.

-- ============================================================================
-- profiles
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_manager boolean not null default false,
  is_player boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_required check (is_manager or is_player)
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS — users see and edit only their own profile
-- ============================================================================

alter table public.profiles enable row level security;

create policy profiles_owner_select on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert is handled exclusively by the on_auth_user_created trigger (definer);
-- the authenticated role never inserts directly. id / created_at / updated_at
-- are system-managed; only the role flags are user-editable.
revoke insert, update on public.profiles from authenticated;
grant update (is_manager, is_player) on public.profiles to authenticated;

-- ============================================================================
-- handle_new_user — populate profiles from supabase.auth.signUp metadata
-- ============================================================================
--
-- supabase.auth.signUp({ options: { data: { is_manager, is_player } } }) lands
-- in auth.users.raw_user_meta_data. We mirror those flags into profiles so the
-- row exists from creation. If neither flag is provided (e.g. a future admin
-- tool that bypasses the signup form), default to is_manager=true so the
-- check constraint holds — that matches the only signup path that existed
-- before this migration.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_manager boolean := coalesce((new.raw_user_meta_data->>'is_manager')::boolean, false);
  v_player boolean := coalesce((new.raw_user_meta_data->>'is_player')::boolean, false);
begin
  if not v_manager and not v_player then
    v_manager := true;
  end if;

  insert into public.profiles (id, is_manager, is_player)
  values (new.id, v_manager, v_player);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Backfill — existing auth.users predate this table. The only signup role
-- before this migration was "club manager," so they're all managers.
-- ============================================================================

insert into public.profiles (id, is_manager, is_player)
select id, true, false
from auth.users
on conflict (id) do nothing;
