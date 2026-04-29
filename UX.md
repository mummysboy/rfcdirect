# Rugby Direct — UX

This doc defines what Rugby Direct looks and feels like. DESIGN.md says what the system *does*; UX.md says how it *appears* and how users *move through it*. Both are sources of truth — when they conflict, the conflict is a bug, flag it.

## Design principles

These come first because every later decision should be checkable against them.

1. **The map is the product.** Discovery is geographic, so geography leads. The map is not a sidebar; it's the hero.
2. **Clubs color their own profile.** The app's brand is neutral so that each club's identity gets to show through on its own profile. Rugby Direct is the frame; the club is the picture.
3. **Seeker-first, low friction.** No login walls, no signup prompts in front of value, no popups. A first-time visitor goes from landing to seeing clubs in under fifteen seconds.
4. **Density over decoration.** Directory apps live or die by how much useful info fits on a screen. Whitespace serves clarity, not impressiveness.
5. **Fork-safe.** Anything explicitly rugby-themed (a scrum ball icon, a try-line motif) is off-limits in shared components. Per-vertical theming lives in `lib/copy.ts` and `lib/constants.ts` only.

## Visual direction

### Palette

The Rugby Direct app palette is inspired by Olympic Club RFC's red-on-black-on-cream identity, but the red is a Rugby Direct color, not OC's color. We use it as a single accent — for active states, the search radius ring, map pins, and "View" links — never as a wash.

| Role | Color | Hex | Notes |
|---|---|---|---|
| Foreground (text, headers) | Near-black | `#1A1A1A` | Body and headings |
| Background (app surface) | Cream-white | `#FAF7F0` | Warmer than pure white; gives the app character |
| Surface (cards, sheets) | White | `#FFFFFF` | Sits on top of the cream |
| Accent (primary) | Rugby red | `#B5161E` | Pins, links, primary CTA, search radius |
| Muted (secondary text) | Warm gray | `#8A7755` | Metadata, captions |
| Border | Cream-stone | `#E0D2B8` | Card edges, dividers |
| Map land | Cream-paper | `#EDE3D2` | Mapbox custom style baseline |
| Map water | Soft blue-gray | `#C8D4DC` | Subtle, doesn't compete with pins |

**Each club gets a `brand_color`** (hex, set per-club, optional). It tints their profile hero and any club-branded surface inside their profile. If unset, fall back to `#1A1A1A` (black) so unbranded clubs still feel intentional.

### Typography

- **Sans:** Inter (variable). One typeface, three weights — 400 / 500 / 600. Avoid 700+; too heavy for this scale.
- **Serif:** Source Serif Pro, used *only* for the wordmark and large profile headlines. Never for body text.

| Use | Size | Weight | Line height |
|---|---|---|---|
| Display (hero headline on profile) | 24px | 500 | 1.2 |
| H1 (screen title) | 20px | 500 | 1.25 |
| H2 (section header) | 16px | 500 | 1.3 |
| Body | 14px | 400 | 1.55 |
| Meta (captions, distances, est. year) | 12px | 400 | 1.5 |
| Eyebrow (uppercase labels) | 11px | 500 | 1.4, letter-spacing 0.08em, uppercase |

Sentence case everywhere. No mid-sentence bolding. Numbers use tabular figures (`font-variant-numeric: tabular-nums`) so distances align in lists.

### Density

Lean dense. List rows are 64px tall (logo 40px + two lines of text). Default radius slider step is 5 miles, not 1, because a radius doesn't need fine grain to be useful and stepped values feel snappier.

### Motion

- Transitions: 180ms ease-out on color/opacity, 240ms ease-in-out on layout.
- Map pin tap: scale 1.0 → 1.15 → 1.0 over 320ms.
- Bottom sheet drag: native physics on iOS/Android, CSS transform on web.
- Reduced-motion: respect `prefers-reduced-motion`, replace transitions with instant changes.

No parallax, no decorative animations, no scroll-jacking.

### Iconography

Lucide icons, 20px default, 1.5px stroke. Map pin uses a custom SVG so it can carry the accent color (or per-club color when on a club profile map).

### Light mode only for v1

Dark mode is deferred. The cream-paper aesthetic doesn't translate to dark cleanly without redesigning the map style, and v1 isn't the place to do that. Document this as a known gap; revisit post-v1.

## Screen inventory

### 1. Home (`/`)

**Purpose:** seeker enters location + radius, sees results.

**Layout (mobile-first):**
- Top bar (56px): wordmark left, "Manage a club" link right
- Search row (sticky, 64px): location input (Mapbox autocomplete) + radius pill ("25 mi", tap to expand slider)
- Map (flex-grow, min 40% of viewport): pins for results, dashed radius ring around search center
- Bottom sheet (peek 25% / expanded 75%): grab handle, "N clubs in range" eyebrow, scrollable list of result rows

**Layout (web ≥1024px):**
- Top bar (64px): wordmark + nav
- Two-column body: left = search controls + scrollable list (~400px wide), right = map (fills remainder)
- No bottom sheet — list is always visible

**Result row:**
- 40px logo (or initial-monogram fallback)
- Two lines: club name (14px / 500) + meta line "D1 Men's · Est. 1959 · 8.2 mi" (12px / 400 / muted)
- Distance right-aligned in 11px muted
- Tap → club profile

**The accent in action:** search radius ring uses `#B5161E` at 8% fill + 1px dashed stroke. Pins are `#B5161E` solid with white center dot.

### 2. Club profile (`/club/[slug]`)

**Purpose:** seeker reviews a club; admin (if claimed) can tap "Edit".

**Layout:**
- Hero (auto-height, ~180px): tinted with `clubs.brand_color` (fallback `#1A1A1A`)
  - Wordmark watermark top-left ("Rugby Direct" small, low-opacity white)
  - Logo circle (56px white background, club logo or initial)
  - Club name (24px / 500 / white) + tagline if any (12px / 400 / 85% white)
  - Badges row: division pill, category pill, founded year pill — semi-transparent black on the colored hero
- Description block (16px padding): the bio paragraph
- Details table: location, founded, division, category, website, social links, contact — label in muted, value in foreground (or accent if it's a link)
- Sticky bottom CTA row: primary "Contact club" button (black background) + secondary "Share" outline button
- If admin viewing their own claimed club: floating "Edit profile" pill top-right of hero

**Important:** inside this screen, the accent color is the club's brand color, *not* Rugby Direct's red. Links and CTAs adapt. This is the principle that makes the app feel like a stage for clubs rather than a brand layered over them.

### 3. Admin sign-in / sign-up (`/admin/sign-in`, `/admin/sign-up`)

**Purpose:** club admin authentication.

**Layout:** centered card, max-width 380px. Email + password inputs, primary button, link to switch between sign-in and sign-up. No social login in v1.

### 4. Admin dashboard (`/admin`)

**Purpose:** admin sees clubs they've claimed; can edit or start a new claim.

**Layout:**
- Top bar with wordmark + sign-out
- "Your clubs" section: list of claimed clubs (status: approved / pending), each row tappable → edit
- "Claim a club" CTA: opens search-by-name → if found, submit claim; if not, link to "Add a new club"

If user has zero claims: empty state explaining the flow with a single primary CTA.

### 5. Edit club (`/admin/clubs/[id]/edit`)

**Purpose:** admin edits all club fields.

**Layout:** form with logical groupings:
- Identity: name, year founded, description, brand color (hex picker with live preview swatch)
- Classification: division, category (both selects)
- Location: address (Mapbox autocomplete, drops a pin admin can drag for fine-tuning)
- Logo: upload area with current logo preview
- Contact: email, phone, website, Instagram, Facebook
- Sticky save bar at bottom — disabled if no changes, "Saving..." state, success toast on save

Uses `react-hook-form` + `zod`. All errors inline, never modal.

### 6. Add new club (`/admin/clubs/new`)

Same layout as Edit, prefilled with whatever auth user info is available, status auto-set to `pending`.

### 7. 404 / not-found

A real page, not a router default. Wordmark, "We couldn't find that club", link back to home. Uses the cream palette so it doesn't feel jarring.

## State coverage

Every screen handles five states. Specifying upfront so they don't get skipped.

### Loading
- Home map: skeleton pins (3-4 placeholder dots) + "Finding clubs near you…" toast
- Lists: 3 skeleton rows with shimmer (subtle, no rainbow gradient)
- Profile: header skeleton + 3 line skeletons; render real content as it arrives, don't wait for everything

### Empty
- **No location entered yet (home):** map shows continental US, sheet shows "Enter a location to find rugby clubs near you" with a friendly arrow pointing to the search input
- **Location entered, zero results in radius:** "No clubs found within {radius} miles of {location}. Try expanding your search." with a button to bump radius +25 mi
- **Admin dashboard, no claims:** see screen 4 above

### Error
- **Geocoding failed:** inline under search box, "Couldn't find that location. Try another address."
- **Database/network error:** banner at top, "Connection trouble. Retrying…" with manual retry button
- **Image upload failed:** inline error on the upload component, retry button
- Never use modals for errors. Inline always.

### Success (transient)
- Toast (bottom on mobile, top-right on web), 3-second auto-dismiss
- Background: `#1A1A1A`, text white, 14px, no icon needed
- Used for: "Profile saved", "Claim submitted for review", "Logo uploaded"

### Permission-required
Auth-gated routes that hit unauthenticated users redirect to `/admin/sign-in?redirect={original_path}` rather than showing a "you must log in" page.

## Interaction patterns

### Location input
- Debounced 300ms after typing stops
- Dropdown of up to 5 Mapbox suggestions, keyboard-navigable
- Selecting a result fills the input, drops a center marker on the map, runs the radius query
- Clearing the input shows the empty state, doesn't keep stale results

### Radius slider
- Range 5–100 mi, step 5
- On mobile: tap the radius pill in the search row → bottom sheet opens with slider + live "{N} clubs would be in range" preview that updates as the slider moves
- On web: inline slider next to location input
- Releasing the slider commits the new radius (avoids 20 queries while dragging)

### Map ↔ list sync
- Tapping a pin on the map highlights and scrolls-to the corresponding list row
- Tapping a list row centers the map on that pin and bounces it (the 320ms scale animation)
- Map and list are always showing the same set of clubs; never out of sync

### Claim flow
1. Admin lands on a club profile that isn't claimed → sees "Is this your club? Claim it." link below the hero
2. Tapping it requires sign-in if not signed in
3. Submits a claim with optional message → status: `pending`
4. Admin sees the pending state on their dashboard
5. (Manual approval happens out-of-band)
6. Once approved, profile shows "Edit profile" button to that admin

### Bottom sheet (mobile)
- Three snap points: peek (25%), half (50%), expanded (75%)
- Drag handle visible always; tapping the handle cycles up
- Map remains interactive when sheet is at peek; reduced interactivity at half; sheet wins gestures at expanded

## Responsive behavior

| Breakpoint | Layout |
|---|---|
| <640px (phone) | Map + bottom sheet, single column everywhere else |
| 640–1024px (tablet) | Map full-width on top, list below; profile uses single column with wider margins |
| ≥1024px (desktop) | Two-column home (list 400px / map fluid); profile centered max-width 720px |

The same Expo codebase serves all three via responsive layout components — no separate web app.

## Accessibility baseline

- All interactive elements ≥44px tap target
- Color contrast WCAG AA: text on cream is `#1A1A1A` (15.8:1), red accent on cream is `#B5161E` (5.7:1, passes AA for non-large text)
- All inputs have associated labels (visually shown, not placeholder-only)
- Focus rings visible on keyboard navigation: 2px solid `#B5161E` with 2px offset
- Map pins have accessible names ("{Club name}, {distance} miles") for screen readers
- `prefers-reduced-motion` disables the pin bounce and transition animations
- Form errors are announced via `aria-live="polite"`

## What's intentionally *not* here

- A full design system / component library spec — that emerges in code and Figma during build
- Specific Figma file references — TBD
- Animation timing curves beyond the basics — over-specifying these before implementation is wasted work
- Marketing site / landing page design — out of scope until v1 ships

## Open questions

- **Custom Mapbox style** — do we invest the time to build a cream-paper Mapbox style, or use Mapbox Light and live with it? Custom style is ~half a day's work but pays off in brand cohesion.
- **Wordmark / logo** — we have a working concept (red square + "Rugby Direct" wordmark) but no real mark yet. Placeholder for now; commission later.
- **What happens at 200+ results?** Currently we cap at 200 (DESIGN.md). Do we paginate, cluster pins, or just expect users to tighten the radius? v1 punt: just cap and rely on the radius slider as the filter.
