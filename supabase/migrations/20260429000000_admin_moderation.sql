-- Admin moderation: super-admin role + pending-claim approval workflow.
--
-- Admins are tracked in `public.admins`. The first admin must be inserted
-- with a connection that bypasses RLS — i.e. service-role context. In
-- Supabase Studio's SQL editor that's the default; via psql, use the service
-- role connection string (or run `set role postgres;` first). Inserting from
-- a normal authenticated session will silently affect zero rows because the
-- RLS policy requires the caller to already be an admin.
--
--   insert into public.admins (user_id) values ('<your-auth-user-id>');
--
-- Subsequent admins can be added by existing admins through the same table.

-- ============================================================================
-- admins
-- ============================================================================

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- ============================================================================
-- is_admin() — used by RLS policies and the moderation RPCs.
-- ============================================================================

-- security definer so it can read public.admins regardless of RLS context.
-- Without this, calling is_admin() from inside an RLS policy on admins would
-- recurse into the same RLS check.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ============================================================================
-- RLS on admins
-- ============================================================================

create policy admins_admin_select on public.admins
  for select to authenticated using (public.is_admin());

create policy admins_admin_insert on public.admins
  for insert to authenticated with check (public.is_admin());

create policy admins_admin_delete on public.admins
  for delete to authenticated using (public.is_admin());

-- ============================================================================
-- list_pending_claims_for_admin
-- ============================================================================
--
-- Returns the moderation queue (with claimant email from auth.users, which
-- non-service-role clients can't reach directly). For non-admins the WHERE
-- gate produces an empty result — defense in depth alongside the EXECUTE grant.

create or replace function public.list_pending_claims_for_admin()
returns table (
  claim_id uuid,
  claim_created_at timestamptz,
  claim_notes text,
  club_id uuid,
  club_name text,
  club_slug text,
  club_status text,
  club_contact_email text,
  claimant_user_id uuid,
  claimant_email text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    cl.id,
    cl.created_at,
    cl.notes,
    c.id,
    c.name,
    c.slug,
    c.status,
    c.contact_email,
    u.id,
    u.email::text
  from public.claims cl
  join public.clubs c on c.id = cl.club_id
  left join auth.users u on u.id = cl.user_id
  where cl.status = 'pending' and public.is_admin()
  order by cl.created_at desc;
$$;

revoke all on function public.list_pending_claims_for_admin() from public;
grant execute on function public.list_pending_claims_for_admin() to authenticated;

-- ============================================================================
-- approve_claim
-- ============================================================================
--
-- Atomic: copy claimant's user_id to clubs.claimed_by AND flip claims.status
-- to 'approved'. Either both happen or neither. SECURITY DEFINER bypasses
-- the column grants on clubs.claimed_by / claims.status that we deliberately
-- haven't given to the authenticated role — only this function can write
-- those columns from a logged-in client context.

create or replace function public.approve_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_club_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- FOR UPDATE locks the claim row so concurrent admins approving the same
  -- claim serialize: the loser sees status != 'pending' on its retry and
  -- raises 'claim not found or not pending' instead of silently re-running.
  select user_id, club_id into v_user_id, v_club_id
  from public.claims
  where id = p_claim_id and status = 'pending'
  for update;

  if v_user_id is null then
    raise exception 'claim not found or not pending' using errcode = 'P0002';
  end if;

  update public.clubs set claimed_by = v_user_id where id = v_club_id;
  update public.claims set status = 'approved' where id = p_claim_id;
end;
$$;

revoke all on function public.approve_claim(uuid) from public;
grant execute on function public.approve_claim(uuid) to authenticated;

-- ============================================================================
-- reject_claim
-- ============================================================================

create or replace function public.reject_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.claims
  set status = 'rejected'
  where id = p_claim_id and status = 'pending';
end;
$$;

revoke all on function public.reject_claim(uuid) from public;
grant execute on function public.reject_claim(uuid) to authenticated;
