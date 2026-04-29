# Rugby Direct — Design

This doc is the architectural source of truth. If something here conflicts with the code, the code is wrong (or this doc needs updating — flag it).

## Core principle

Rugby Direct is a **template** that will be forked into other hobby verticals. Anything rugby-specific (division values, gender/age categories, copy, branding) lives in clearly isolated places — a constants file, a config object, a content directory — never scattered through business logic. When we fork for D&D groups or climbing gyms, ideally only those isolated files change.

## User flows

### Seeker (no auth)

1. Lands on home screen — location input + radius slider, map below.
2. Enters location via Mapbox Geocoding autocomplete (typed addresses get resolved to lat/lng).
3. Adjusts radius (default 25 miles, range 5–100).
4. Map updates with pins for clubs in range; list view below shows the same clubs.
5. Taps a pin or list item → full profile screen.
6. From profile, can tap website / social / email / phone to leave the app.

No account, no signup, no friction.

### Club admin (auth required)

1. Lands on home, taps "Manage a club" in nav.
2. Sign up with email + password (Supabase Auth).
3. Search for their club by name. Two outcomes:
   - **Found (seeded):** taps "Claim this profile" → claim enters `pending` state → admin (the dev) manually approves in Supabase dashboard → admin can now edit.
   - **Not found:** "Add your club" form → creates new club in `pending` state → manually approved → goes live.
4. Once approved, edits any field, uploads a logo, saves.
5. Changes are immediately reflected on the public profile.

Manual approval is intentional for v1 — it prevents spam without building a verification pipeline. Automate later when volume demands it.

## Data model

### `clubs` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `name` | text | required |
| `slug` | text | unique, URL-safe |
| `description` | text | 1–2 paragraphs, the "vibe" — required |
| `year_founded` | int | nullable |
| `division` | text | enum-constrained: `D1`, `D2`, `D3`, `social`, `collegiate`, `youth`, `other` |
| `category` | text | enum-constrained: `mens`, `womens`, `mixed`, `youth_boys`, `youth_girls`, `youth_mixed` |
| `location` | geography(Point, 4326) | PostGIS — the magic column |
| `address_display` | text | human-readable address shown on profile |
| `website_url` | text | nullable |
| `social_instagram` | text | nullable |
| `social_facebook` | text | nullable |
| `contact_email` | text | nullable |
| `contact_phone` | text | nullable |
| `logo_url` | text | Supabase Storage URL, nullable |
| `brand_color` | text | hex string (e.g. `#B5161E`), nullable — used to tint the club's profile hero. Falls back to neutral if unset. See UX.md "clubs color their own profile". |
| `status` | text | `pending`, `approved`, `rejected` — only `approved` shown to seekers |
| `claimed_by` | uuid | FK to `auth.users`, nullable |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now() |

The enum-style fields (`division`, `category`, `status`) live as Postgres CHECK constraints **and** as a TypeScript const in `lib/constants.ts`. When forking to another vertical, that constants file is the first thing changed.

### `claims` table

Tracks pending claim requests on already-seeded clubs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `club_id` | uuid | FK to `clubs` |
| `user_id` | uuid | FK to `auth.users` |
| `status` | text | `pending`, `approved`, `rejected` |
| `notes` | text | optional message from claimant |
| `created_at` | timestamptz | default now() |

When approved, the parent `clubs.claimed_by` is set to `user_id` and the claim row's status flips to `approved`.

### Storage

- **Bucket:** `club-logos`
- **Path pattern:** `{club_id}/logo.{ext}`
- **Constraints:** PNG or JPG, max 2 MB, max 1024×1024px (resized client-side before upload)
- **Access:** public read, authenticated write (with RLS restricting writes to the club's `claimed_by` user)

### Row Level Security (RLS)

- `clubs`: public can SELECT where `status = 'approved'`; authenticated users can UPDATE only where `claimed_by = auth.uid()`. INSERTs go through a server action that always sets `status = 'pending'`.
- `claims`: users can INSERT their own and SELECT their own.

## The geo query

The reason we chose Postgres + PostGIS: radius search is a one-liner.

```sql
select *,
  ST_Distance(location, ST_MakePoint($lng, $lat)::geography) / 1609.34 as distance_miles
from clubs
where status = 'approved'
  and ST_DWithin(
    location,
    ST_MakePoint($lng, $lat)::geography,
    $radius_miles * 1609.34
  )
order by distance_miles asc
limit 200;
```

A single GIST index on `location` makes this fast at any realistic scale. We expose this as a Supabase RPC function (`clubs_within_radius`) so the client just calls `supabase.rpc('clubs_within_radius', { lat, lng, radius_miles })`.

## Map + list architecture

The home screen has two synced views of the same dataset:
- **Map** — Mapbox with pins; tapping a pin highlights the corresponding list row.
- **List** — scrollable, sorted by distance ascending; tapping a row centers/zooms the map.

On mobile, these stack: map on top (~40% of viewport), list below. On web, side-by-side at desktop widths, stacked on mobile widths.

Both views are driven by the same in-memory result set from a single `clubs_within_radius` call. We don't refetch when toggling views.

## Mapbox specifics

- **Web:** `mapbox-gl` directly.
- **Native (iOS/Android):** `@rnmapbox/maps`.
- **Geocoding (location input):** Mapbox Geocoding API via fetch — autocomplete dropdown returns `place_name` + `[lng, lat]`.
- **Token:** stored in `EXPO_PUBLIC_MAPBOX_TOKEN`. URL-restrict it in the Mapbox dashboard once we have a domain.

Mapbox's free tier (50K map loads/month, 100K geocoding requests/month) is comfortably above what a prototype needs.

## Forking strategy

When this codebase becomes "Climbing Direct" or similar:

1. `lib/constants.ts` — change `DIVISIONS`, `CATEGORIES` enums to fit the new vertical (or remove if not applicable).
2. `lib/copy.ts` — change all user-facing strings ("rugby club" → "climbing gym", etc.).
3. `assets/` — swap logo, colors, hero imagery.
4. Re-seed the database.

Anything in `app/`, `components/`, or `lib/queries.ts` should not need changes. If it does, that's a leak — fix it before forking.

## What's deliberately not in this doc

- Specific component breakdowns (let those emerge during build)
- Visual design system (separate concern; lives in code + Figma)
- Specific seed data sourcing (operational, not architectural)
- Analytics / telemetry (deferred until post-v1)

## Open questions

- Do we need a "report this listing" link on public profiles? (Probably yes, but a `mailto:` is fine for v1.)
- How do we handle clubs with no fixed home location (e.g. some social clubs travel)? (For v1: require a location. Revisit later.)
- Should distance be configurable in km vs miles? (v1 is miles only — US-first launch. Add toggle later.)
