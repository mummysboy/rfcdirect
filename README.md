# Rugby Direct

A location-based directory for finding rugby clubs. Enter a location, set a radius, see every club in range on a map and in a list.

## What it is

Rugby Direct is the answer to "is there a rugby club near me?" — a question that today gets answered with a frustrating mix of Google searches, dead Facebook pages, and word of mouth. We make it a thirty-second lookup.

**Two audiences:**
- **Players looking for a club** — enter a location, see clubs nearby with the info needed to decide which to contact.
- **Clubs wanting to be found** — claim a profile, fill in the details, get discovered.

## MVP scope (v1)

**In scope:**
- Browse clubs by location + radius (map + list view)
- View full club profile (name, location, year founded, division, gender/age category, description, contact info, social links, logo)
- Club admins can sign up, claim a seeded profile, and edit it
- Seeded data: real rugby clubs added manually so the app is useful from day one
- Web first, with iOS and Android from the same codebase

**Explicitly out of scope for v1:**
- Player accounts, favorites, or saved searches
- Messaging between players and clubs
- Events, schedules, or RSVPs
- Reviews or ratings
- Match results or league tables
- Automated club verification (claims are manually approved)
- Multiple locations per club
- Multi-language support
- Push notifications

These are deliberately deferred. Discovery is the wedge; everything else can come after.

## The v1 demo

> Open the app. Enter "San Jose, CA". Set radius to 25 miles. See pins on a map and a list of rugby clubs in range. Tap one. See the full profile — logo, founding year, division, contact info, link to their website. Switch to admin view, sign in, edit a club's bio, save, see it reflected on the public profile.

If we can deliver that, v1 ships.

## Tech stack

- **Frontend:** Expo (React Native) with Expo Router — single codebase targets web, iOS, and Android
- **Backend:** Supabase — Postgres with PostGIS for geospatial queries, Supabase Auth for club admins, Supabase Storage for logos
- **Maps:** Mapbox (`@rnmapbox/maps` for native, `mapbox-gl` for web)
- **Location autocomplete:** Mapbox Geocoding API

See `DESIGN.md` for why each piece was chosen.

## Why niche-by-niche

Rugby Direct is the first instance of a template. The same codebase, re-skinned, becomes Climbing Direct, D&D Direct, Birding Direct, etc. Rugby is the launch vertical because it has clear structured filters (division, gender/age) and a coachable founder (the dev coaches a D1 club). The architecture keeps rugby-specific logic isolated so forking is mechanical.

## Getting started

> *To be filled in once the project is scaffolded. Will cover: clone, install (`npm install`), Supabase project setup, environment variables (`.env.example`), Mapbox token, running `npx expo start`.*

## Project status

Pre-development. Specs in place; scaffolding next.

## Repository docs

- `README.md` — this file (what and why)
- `DESIGN.md` — architecture, data model, user flows
- `UX.md` — visual direction, screen specs, interaction states
- `CLAUDE.md` — instructions for Claude Code when working on this repo
