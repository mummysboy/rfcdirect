/**
 * FORK POINT — vertical-specific values.
 *
 * When this template is forked into another vertical (Climbing Direct, etc.),
 * this file is the first thing changed. Anything outside this file should be
 * generic and reusable across verticals.
 *
 * Display labels for these enum keys live in `lib/copy.ts`.
 */

export const DIVISIONS = [
  'D1',
  'D2',
  'D3',
  'social',
  'collegiate',
  'youth',
  'other',
] as const;
export type Division = (typeof DIVISIONS)[number];

export const CATEGORIES = [
  'mens',
  'womens',
  'mixed',
  'youth_boys',
  'youth_girls',
  'youth_mixed',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ['pending', 'approved', 'rejected'] as const;
export type Status = (typeof STATUSES)[number];

/**
 * Practice-day codes. The DB CHECK constraint restricts `clubs.practice_days`
 * to this set; display labels are in `lib/copy.ts`.
 */
export const DAYS_OF_WEEK = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/** Named refs so app code never inlines a status literal. */
export const STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const satisfies Record<Status, Status>;

/** Default values selected for a brand-new club's enum fields. */
export const DEFAULT_DIVISION: Division = 'social';
export const DEFAULT_CATEGORY: Category = 'mens';

/** Supabase Storage bucket names — keyed by their app role, not by vertical. */
export const STORAGE_BUCKETS = {
  logos: 'club-logos',
} as const;

export const RADIUS_MILES = {
  default: 25,
  min: 5,
  max: 100,
  step: 5,
} as const;

export const RESULT_LIMIT = 200;

/** Palette from UX.md — the app brand. Per-club brand colors override the accent inside a club's profile. */
export const COLORS = {
  fg: '#1A1A1A',
  bg: '#FAF7F0',
  surface: '#FFFFFF',
  accent: '#B5161E',
  muted: '#8A7755',
  border: '#E0D2B8',
  mapLand: '#EDE3D2',
  mapWater: '#C8D4DC',
  /** Fallback for clubs that haven't set a brand_color. */
  defaultBrand: '#1A1A1A',
} as const;

/** Type scale tokens from UX.md. Tuples of [size, lineHeight] in px. */
export const TYPE_SCALE = {
  display: [24, 29],
  h1: [20, 25],
  h2: [16, 21],
  body: [14, 22],
  meta: [12, 18],
  eyebrow: [11, 15],
} as const;

/**
 * Curated brand-color swatches offered to club admins on the profile editor.
 * These are tint colors for the hero — picked to read against white type.
 * Owners can also enter a custom hex; this list is the quick-pick.
 */
export const BRAND_SWATCHES = [
  '#1A1A1A',
  '#1B3A5F',
  '#2253AE',
  '#1F6F6E',
  '#2A523B',
  '#1E4F2E',
  '#5C2A6B',
  '#5C0F1F',
  '#6E0E1B',
  '#B5161E',
  '#DB6A1A',
  '#D6A21B',
  '#5BA8D6',
  '#6B4A2B',
  '#3D2E2A',
  '#4A4F5C',
] as const;
