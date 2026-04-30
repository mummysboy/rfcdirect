-- Pending-club moderation: admin queue + approve/reject for new club submissions.
--
-- The existing 20260429000000 migration handles claims against already-approved
-- clubs. This one handles the other path: a user creates a brand-new club via
-- /clubs/new, which lands in `clubs` with status='pending' and no `claims` row.
-- Without these RPCs, those submissions are invisible to admins.
--
-- Same security model as the claim RPCs: SECURITY DEFINER + is_admin() gate.
-- clubs.status is intentionally not in the authenticated UPDATE grant
-- (initial migration), so only these definer-context functions can flip it
-- from a logged-in client.

-- ============================================================================
-- list_pending_clubs_for_admin
-- ============================================================================
--
-- Returns full club detail so the moderate screen can render an inline review
-- card (description, address, contact, socials, practice schedule). Public
-- `getClubBySlug` filters status='approved', so admins can't click through to
-- the public profile to review — everything they need is in this RPC.

create or replace function public.list_pending_clubs_for_admin()
returns table (
  club_id uuid,
  club_created_at timestamptz,
  club_name text,
  club_slug text,
  club_description text,
  club_year_founded int,
  club_division text,
  club_category text,
  club_address_display text,
  club_latitude double precision,
  club_longitude double precision,
  club_website_url text,
  club_social_instagram text,
  club_social_facebook text,
  club_contact_email text,
  club_contact_phone text,
  club_logo_url text,
  club_brand_color text,
  club_practice_days text[],
  club_practice_times text,
  submitter_user_id uuid,
  submitter_email text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    c.id,
    c.created_at,
    c.name,
    c.slug,
    c.description,
    c.year_founded,
    c.division,
    c.category,
    c.address_display,
    st_y(c.location::geometry),
    st_x(c.location::geometry),
    c.website_url,
    c.social_instagram,
    c.social_facebook,
    c.contact_email,
    c.contact_phone,
    c.logo_url,
    c.brand_color,
    c.practice_days,
    c.practice_times,
    c.claimed_by,
    u.email::text
  from public.clubs c
  left join auth.users u on u.id = c.claimed_by
  where c.status = 'pending' and public.is_admin()
  order by c.created_at desc;
$$;

revoke all on function public.list_pending_clubs_for_admin() from public;
grant execute on function public.list_pending_clubs_for_admin() to authenticated;

-- ============================================================================
-- approve_club
-- ============================================================================
--
-- Flips clubs.status from 'pending' to 'approved'. claimed_by stays as the
-- creator's user_id, so the submitter automatically owns the approved club.
-- FOR UPDATE serializes concurrent admin approvals on the same row.

create or replace function public.approve_club(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select status into v_status
  from public.clubs
  where id = p_club_id
  for update;

  if v_status is null then
    raise exception 'club not found' using errcode = 'P0002';
  end if;

  if v_status <> 'pending' then
    raise exception 'club not pending' using errcode = 'P0002';
  end if;

  update public.clubs set status = 'approved' where id = p_club_id;
end;
$$;

revoke all on function public.approve_club(uuid) from public;
grant execute on function public.approve_club(uuid) to authenticated;

-- ============================================================================
-- reject_club
-- ============================================================================
--
-- Symmetric with reject_claim: status flip, no row deletion, so admins can
-- recover or audit later. Only acts on rows still in 'pending' to avoid
-- clobbering a previously-approved club back to rejected.

create or replace function public.reject_club(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.clubs
  set status = 'rejected'
  where id = p_club_id and status = 'pending';
end;
$$;

revoke all on function public.reject_club(uuid) from public;
grant execute on function public.reject_club(uuid) to authenticated;
