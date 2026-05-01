# CLAUDE.md

Instructions for Claude Code when working in this repository. Read this fully before making changes.

## Project at a glance

Rugby Direct is a location-based directory for rugby clubs. Seekers search by location + radius; club admins claim and edit profiles. Built with Expo + Supabase + Mapbox. See `README.md` for the pitch, `DESIGN.md` for architecture, and `UX.md` for visual direction and screen specs.

This codebase is a **template** that will be forked for other hobby verticals. Keep rugby-specific values isolated to `lib/constants.ts` and `lib/copy.ts`. Never hardcode the word "rugby" or rugby-specific enum values inside components, queries, or business logic.

**Visual principle worth knowing up front:** the app brand is neutral (black + cream + a single red accent). Each individual club's profile screen is tinted with *that club's* `brand_color`. Don't apply the app's red accent inside a club profile — let the club's color win there. See UX.md "Clubs color their own profile" for the full pattern.

## Common commands

```bash
# Dev servers (Expo)
npm run web                 # Web only — primary prototype target
npm start                   # All platforms; press w / i / a in the prompt
npm run ios                 # iOS simulator via Expo Go
npm run android             # Android emulator via Expo Go

# Quality gates
npm run lint                # expo lint (Expo flat ESLint config)
npx tsc --noEmit            # Type-check (no separate script)

# Local Supabase (Postgres + Auth + Storage)
supabase start              # Boots the local stack on ports 54421–54429 (see Working with Supabase)
supabase stop
supabase migration new <name>
supabase gen types typescript --local 2>/dev/null > types/database.ts

# Push schema to the linked prod project
npx supabase db push --dry-run    # Always dry-run non-trivial changes first
npx supabase db push

# Web production build — see "Deployment (web)" for the full env-shim sequence.
# Do NOT run plain `expo export` against your local .env or you'll bake local-dev URLs into prod.
```

There is no test runner yet; testing is manual per the "Testing" section below.

## Architecture overview

A short tour of the load-bearing patterns so you don't have to grep to find them.

- **Routing:** Expo Router with two route groups under `app/`:
  - `(public)/` — seeker routes, no auth required (home, club profile)
  - `(admin)/` — auth-gated; the group's `_layout.tsx` redirects unauthenticated users to `sign-in`
- **Auth:** `lib/auth.tsx` exports `SessionProvider` (mounted once in `app/_layout.tsx`) and the `useSession()` hook, which returns a discriminated union: `loading | authenticated | unauthenticated`. Never read `supabase.auth.getSession()` directly from a component — go through the hook.
- **Data access:** all DB calls live in `lib/queries.ts` as typed functions (`getClubBySlug`, `listClubsForOwner`, `approveClaim`, …). Components import these — they do **not** call `supabase.from(...)` directly. Return types come from the generated `types/database.ts`.
- **Geospatial reads:** go through the `clubs_within_radius` RPC (also used by `listAllClubs` with a continental radius). **Geospatial writes** use the WKT string format directly: `location: 'POINT(lng lat)'` in the patch — no RPC needed.
- **Privileged admin actions:** `is_admin`, `list_pending_claims_for_admin`, `approve_claim`, `reject_claim`, `approve_club`, `reject_club` are SECURITY DEFINER RPCs gated on the `admins` table. Status flips and other privileged writes go through these — never mutate `clubs.status` from the client. Column-level grants in the initial migration enforce this even if a client tries.
- **Platform forks** for code that genuinely differs between web and native live at the file level: `Map.web.tsx` / `Map.native.tsx`, `LogoUpload.web.tsx` / `LogoUpload.native.tsx`, `TimeInput.web.tsx` / `TimeInput.native.tsx`. A bare `.ts` file (e.g. `Map.ts`) re-exports so consumers `import` the symbol once and Metro picks the right implementation per platform.
- **Fork points:** `lib/constants.ts` (enums, palette, type scale, swatches) and `lib/copy.ts` (every user-facing string). The `fork-checker` subagent audits for leaks outside these two files.

## Stack — do not deviate without asking

- **Framework:** Expo SDK (latest stable) with **Expo Router** for file-based routing. One codebase targets web, iOS, Android.
- **Language:** TypeScript. Strict mode on. No `any` without a comment explaining why.
- **Backend:** Supabase (Postgres + PostGIS + Auth + Storage). No alternative backend, no separate API server.
- **Maps:** Mapbox — `mapbox-gl` for web, `@rnmapbox/maps` for native. Do not suggest Google Maps, Leaflet, or alternatives.
- **Styling:** **NativeWind 4** (Tailwind for React Native). Tailwind config at `tailwind.config.ts`, base styles in `global.css`. Don't introduce styled-components, Stitches, or vanilla `StyleSheet` for new components without asking.
- **State:** Start with React state + Supabase queries. Do not add Redux, Zustand, Jotai, etc. without asking.
- **Forms:** `react-hook-form` + `zod` for validation. Use these by default for any non-trivial form.

## Always ask before

- Adding a new dependency (npm package). State why and what alternative was considered.
- Changing the database schema — adding/removing/renaming columns, adding tables, changing constraints.
- Changing anything in `supabase/migrations/`.
- Changing auth flow, RLS policies, or anything in `auth.*`.
- Changing anything in `lib/constants.ts` or `lib/copy.ts` (these are the fork-points; changes are intentional).
- Touching environment variables or `.env*` files.
- Introducing a new top-level folder.

For everything else (component implementation, fixing a bug, refactoring a file, writing a query against the existing schema), proceed without asking.

## Never do

- Never commit secrets, API keys, or `.env` files. Use `.env.example` for documentation.
- Never write a Haversine formula by hand. Geo queries go through PostGIS RPCs.
- Never bypass RLS by using the service role key from the client.
- Never hardcode rugby-specific strings outside `lib/copy.ts`.
- Never hardcode enum values (`'D1'`, `'mens'`, etc.) outside `lib/constants.ts`.
- Never disable TypeScript strict mode or add `// @ts-ignore` without a comment.
- Never add a backend service (Express, Hono, separate API). Supabase is the backend.

## File and folder conventions

```
app/                    # Expo Router routes
  (public)/             # Seeker-facing routes, no auth
    index.tsx           # Home: search + map + list
    club/[slug].tsx     # Club profile
  (admin)/              # Club admin routes, auth-gated
    (auth)/             # Sign-in / sign-up share an AuthLayout via this group's _layout
      sign-in.tsx
      sign-up.tsx
    dashboard.tsx
    clubs/[id]/edit.tsx
components/
  ui/                   # Generic, reusable, vertical-agnostic
  clubs/                # Club-specific components (lists, cards, profile)
  map/                  # Map + pin components
lib/
  supabase.ts           # Supabase client
  constants.ts          # Enum values — FORK POINT
  copy.ts               # User-facing strings — FORK POINT
  queries.ts            # Typed query functions
  geo.ts                # Geocoding helpers (Mapbox API calls)
  validation.ts         # Zod schemas
supabase/
  migrations/           # SQL migrations
  seed.sql              # Seed data
types/
  database.ts           # Generated from Supabase
```

Routes use lowercase-kebab. Components use PascalCase. Hooks start with `use`. Query functions in `lib/queries.ts` are named `getX`, `listX`, `createX`, `updateX`.

Imports use the `@/*` path alias (configured in `tsconfig.json`, mapped to project root) — e.g. `import { supabase } from '@/lib/supabase'`. Don't use long relative chains (`../../lib/...`).

## Code style

- Functional components only. No classes.
- Prefer named exports. Default exports only for Expo Router route files (which require them).
- Async/await over `.then()`.
- Early returns over nested conditionals.
- One component per file unless tightly coupled (e.g. a List + ListItem pair).
- Comments explain *why*, not *what*. If a comment describes what the code does, the code probably needs renaming.

## Testing

For v1, manual testing is acceptable. When tests are added:
- **Unit:** Vitest for pure functions in `lib/`.
- **Component:** React Native Testing Library.
- **E2E:** Maestro or Detox — decide later.

Don't add a testing setup unsolicited; ask first.

## Working with Supabase

- The local stack runs on ports **54421–54429** (offset +100 from Supabase's 543xx defaults), set in `supabase/config.toml` so this project can coexist with another local Supabase project. Reflect this in any local URL: `http://127.0.0.1:54421` for the API, etc.
- All schema changes go through migration files in `supabase/migrations/`. Never edit the live DB schema via the dashboard for changes that should be in code.
- Run `supabase gen types typescript --local 2>/dev/null > types/database.ts` after schema changes (the `2>/dev/null` is intentional — the CLI leaks "Connecting to db" to stdout otherwise and corrupts the type file).
- After local migrations apply cleanly, push to the linked prod project with `npx supabase db push` (use `--dry-run` first for non-trivial changes). Migrations are not auto-applied on git push — Netlify only ships the bundle.
- Use RPCs (Postgres functions) for anything geospatial reads or anything involving multiple tables. **Geospatial writes**, however, go through the WKT text format directly — `location: 'POINT(lng lat)'` in the patch — no RPC needed.
- RLS is on for every table. New tables require RLS policies as part of the same migration. Tables with privileged writes (e.g. `admins`, status flips) need column-level grants in addition to the policy.
- The first admin row must be inserted manually via the dashboard SQL editor — `admins_admin_insert` requires an existing admin, so the chicken-and-egg is intentionally broken outside RLS. Same pattern applies to any future privileged-bootstrap table.
- `lib/supabase.ts` deliberately defers the env-var error to first use via a Proxy fallback. Don't replace this with a `throw` at module load — it'll break Expo's static-render pass on hosts that don't expose `EXPO_PUBLIC_*` to the build environment. The runtime still fails loudly if the env is genuinely missing.

## Working with Mapbox

- Token lives in `EXPO_PUBLIC_MAPBOX_TOKEN`.
- Web and native use different libraries; isolate map components so platform forks live in one place (`components/map/Map.web.tsx` vs `components/map/Map.native.tsx`).
- Geocoding requests are debounced (300ms) and cached in-memory for the session.

## Definition of done

A feature is done when:
1. It works on web (the primary prototype target).
2. It works (or is gracefully no-op) on iOS via Expo Go.
3. TypeScript compiles with no errors.
4. No new lint warnings introduced.
5. Manual smoke test passes.
6. If it touched the schema: migration file exists, types regenerated.

## Deployment (web)

Web is the primary deploy target. Build with `npx expo export --platform web --output-dir dist`; `netlify.toml` wires this into Netlify. Production Supabase and Mapbox credentials live in the Netlify project env (`EXPO_PUBLIC_*`), never in the repo.

There are **two Netlify sites pointing at this repo**: `rfcdirect` (CD-connected, deploys on push to `main`) and `rfcdirect-mummysboy` (manual deploys only). Both have prod env vars set, but the manual site lags on code unless you redeploy it. When the user says "the prod site", default to `rfcdirect` unless told otherwise.

Two gotchas when deploying from a developer machine:

1. **Local `.env` overrides Netlify's injected env at build time.** Expo's Metro reads dotenv and those values win over `process.env`. Move `.env` aside before building, or your local-dev URLs (e.g. local Supabase) will bake into the production bundle.
2. **Metro caches bundles between runs.** Always pass `--clear` to `expo export` for production builds; otherwise a stale bundle gets uploaded with no warning.

Working sequence:

```bash
mv .env .env.bak
EXPO_PUBLIC_SUPABASE_URL=… EXPO_PUBLIC_SUPABASE_ANON_KEY=… EXPO_PUBLIC_MAPBOX_TOKEN=… \
  npx expo export --platform web --output-dir dist --clear
netlify deploy --prod --dir dist
mv .env.bak .env
```

Verify before declaring done — grep the live bundle for the production Supabase host. Don't trust "Deploy is live!" alone.

## Subagents

Available in `.claude/agents/`:

- **`spec-writer`** — Drafts feature specs before implementation. Challenges weak prompts, requires acceptance criteria, flags scope creep against `DESIGN.md`. Activate when starting a new feature.
- **`schema-guardian`** — Reviews any change touching `supabase/migrations/` or `types/database.ts`. Verifies RLS, naming conventions, type regen, and that fork-point isolation is preserved.
- **`fork-checker`** — Audits the codebase for rugby-specific leaks outside `lib/constants.ts` and `lib/copy.ts`. Run before declaring v1 complete.
- **`pr-reviewer`** — Reviews changes against this CLAUDE.md before they're committed. Catches dependency adds, schema changes, and convention drift that should have been asked about.

When working on a substantial change, invoke the relevant subagent before writing code, not after.

## When in doubt

Re-read `DESIGN.md`. If the answer isn't there, ask in chat — don't guess. The cost of a clarifying question is low; the cost of a wrong architectural turn is high.
