-- Initial schema: clubs, claims, RLS, geo RPC, storage bucket.
-- See DESIGN.md for the data-model rationale.

create extension if not exists postgis;

-- ============================================================================
-- clubs
-- ============================================================================

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  year_founded int,
  division text not null check (division in (
    'D1','D2','D3','social','collegiate','youth','other'
  )),
  category text not null check (category in (
    'mens','womens','mixed','youth_boys','youth_girls','youth_mixed'
  )),
  location geography(Point, 4326) not null,
  address_display text not null,
  website_url text,
  social_instagram text,
  social_facebook text,
  contact_email text,
  contact_phone text,
  logo_url text,
  brand_color text check (brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  status text not null default 'pending' check (status in (
    'pending','approved','rejected'
  )),
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clubs_location_gist on public.clubs using gist (location);
create index clubs_status_idx on public.clubs (status);
create index clubs_claimed_by_idx on public.clubs (claimed_by);

-- ============================================================================
-- claims
-- ============================================================================

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in (
    'pending','approved','rejected'
  )),
  notes text,
  created_at timestamptz not null default now()
);

create index claims_user_idx on public.claims (user_id);
create index claims_club_idx on public.claims (club_id);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_clubs_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.clubs enable row level security;
alter table public.claims enable row level security;

-- Anyone (including unauthenticated) can read approved clubs.
create policy clubs_public_select_approved on public.clubs
  for select
  using (status = 'approved');

-- Owners can read their own clubs in any status.
create policy clubs_owner_select_own on public.clubs
  for select
  to authenticated
  using (auth.uid() = claimed_by);

-- Owners can update their claimed clubs. Column-level grants below restrict
-- *which* columns can change; this policy restricts *which rows*.
create policy clubs_owner_update on public.clubs
  for update
  to authenticated
  using (auth.uid() = claimed_by)
  with check (auth.uid() = claimed_by);

-- New clubs always start pending and are owned by their creator.
-- Approval is a separate admin action (status flip) done via service role.
create policy clubs_authed_insert on public.clubs
  for insert
  to authenticated
  with check (
    status = 'pending'
    and claimed_by = auth.uid()
  );

-- Restrict the columns the authenticated role can write. status, claimed_by,
-- slug, id, created_at, updated_at are managed by the system or service role.
revoke insert, update on public.clubs from authenticated;
grant insert (
  name, slug, description, year_founded, division, category, location,
  address_display, website_url, social_instagram, social_facebook,
  contact_email, contact_phone, logo_url, brand_color, claimed_by, status
) on public.clubs to authenticated;
grant update (
  name, description, year_founded, division, category, location,
  address_display, website_url, social_instagram, social_facebook,
  contact_email, contact_phone, logo_url, brand_color
) on public.clubs to authenticated;

-- Claims: users can insert and read their own.
create policy claims_owner_insert on public.claims
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy claims_owner_select on public.claims
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- RPC: clubs_within_radius
-- ============================================================================

create or replace function public.clubs_within_radius(
  lat double precision,
  lng double precision,
  radius_miles double precision
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  year_founded int,
  division text,
  category text,
  address_display text,
  latitude double precision,
  longitude double precision,
  website_url text,
  social_instagram text,
  social_facebook text,
  contact_email text,
  contact_phone text,
  logo_url text,
  brand_color text,
  status text,
  claimed_by uuid,
  distance_miles double precision
)
language sql stable
as $$
  select
    c.id,
    c.name,
    c.slug,
    c.description,
    c.year_founded,
    c.division,
    c.category,
    c.address_display,
    st_y(c.location::geometry) as latitude,
    st_x(c.location::geometry) as longitude,
    c.website_url,
    c.social_instagram,
    c.social_facebook,
    c.contact_email,
    c.contact_phone,
    c.logo_url,
    c.brand_color,
    c.status,
    c.claimed_by,
    st_distance(c.location, st_makepoint(lng, lat)::geography) / 1609.34 as distance_miles
  from public.clubs c
  where c.status = 'approved'
    and st_dwithin(
      c.location,
      st_makepoint(lng, lat)::geography,
      radius_miles * 1609.34
    )
  order by distance_miles asc
  limit 200;
$$;

-- ============================================================================
-- Storage bucket for club logos
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('club-logos', 'club-logos', true)
on conflict (id) do nothing;

create policy club_logos_public_read on storage.objects
  for select
  using (bucket_id = 'club-logos');

create policy club_logos_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-logos'
    and auth.uid() = (
      select claimed_by from public.clubs
      where id::text = (storage.foldername(name))[1]
    )
  );

create policy club_logos_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-logos'
    and auth.uid() = (
      select claimed_by from public.clubs
      where id::text = (storage.foldername(name))[1]
    )
  );

create policy club_logos_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'club-logos'
    and auth.uid() = (
      select claimed_by from public.clubs
      where id::text = (storage.foldername(name))[1]
    )
  );
