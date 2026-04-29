# CLAUDE.md

Instructions for Claude Code when working in this repository. Read this fully before making changes.

## Project at a glance

Rugby Direct is a location-based directory for rugby clubs. Seekers search by location + radius; club admins claim and edit profiles. Built with Expo + Supabase + Mapbox. See `README.md` for the pitch, `DESIGN.md` for architecture, and `UX.md` for visual direction and screen specs.

This codebase is a **template** that will be forked for other hobby verticals. Keep rugby-specific values isolated to `lib/constants.ts` and `lib/copy.ts`. Never hardcode the word "rugby" or rugby-specific enum values inside components, queries, or business logic.

**Visual principle worth knowing up front:** the app brand is neutral (black + cream + a single red accent). Each individual club's profile screen is tinted with *that club's* `brand_color`. Don't apply the app's red accent inside a club profile — let the club's color win there. See UX.md "Clubs color their own profile" for the full pattern.

## Stack — do not deviate without asking

- **Framework:** Expo SDK (latest stable) with **Expo Router** for file-based routing. One codebase targets web, iOS, Android.
- **Language:** TypeScript. Strict mode on. No `any` without a comment explaining why.
- **Backend:** Supabase (Postgres + PostGIS + Auth + Storage). No alternative backend, no separate API server.
- **Maps:** Mapbox — `mapbox-gl` for web, `@rnmapbox/maps` for native. Do not suggest Google Maps, Leaflet, or alternatives.
- **Styling:** *To be decided when scaffolding* — likely NativeWind (Tailwind for RN) or vanilla StyleSheet. Ask before introducing a styling library.
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

- All schema changes go through migration files in `supabase/migrations/`. Never edit the live DB schema via the dashboard for changes that should be in code.
- Run `supabase gen types typescript` after schema changes to refresh `types/database.ts`.
- Use RPCs (Postgres functions) for anything geospatial or anything involving multiple tables.
- RLS is on for every table. New tables require RLS policies as part of the same migration.

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

These live in `.claude/agents/` once the project is scaffolded. Initial set:

- **`spec-writer`** — Drafts feature specs before implementation. Challenges weak prompts, requires acceptance criteria, flags scope creep against `DESIGN.md`. Activated when starting a new feature.
- **`schema-guardian`** — Reviews any change touching `supabase/migrations/` or `types/database.ts`. Verifies RLS, naming conventions, type regen, and that fork-point isolation is preserved.
- **`fork-checker`** — Audits the codebase for rugby-specific leaks outside `lib/constants.ts` and `lib/copy.ts`. Run before declaring v1 complete.
- **`pr-reviewer`** — Reviews changes against this CLAUDE.md before they're committed. Catches dependency adds, schema changes, and convention drift that should have been asked about.

When working on a substantial change, invoke the relevant subagent before writing code, not after.

## When in doubt

Re-read `DESIGN.md`. If the answer isn't there, ask in chat — don't guess. The cost of a clarifying question is low; the cost of a wrong architectural turn is high.
