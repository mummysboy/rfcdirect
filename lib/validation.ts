import { z } from 'zod';

import { CATEGORIES, DAYS_OF_WEEK, DIVISIONS } from './constants';
import { copy } from './copy';

/** Hex color #RRGGBB. Matches the DB CHECK constraint. */
const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, copy.club.validation.hexInvalid);

export const signInSchema = z.object({
  email: z.email(copy.auth.invalidEmail),
  password: z.string().min(8, copy.auth.passwordTooShort),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = signInSchema
  .extend({
    isManager: z.boolean(),
    isPlayer: z.boolean(),
  })
  .refine((v) => v.isManager || v.isPlayer, {
    message: copy.auth.roleRequired,
    path: ['isManager'],
  });
export type SignUpInput = z.infer<typeof signUpSchema>;

// Note: Controllers in `ClubForm` coerce empty TextInput strings to `null` on
// onChange so these schemas never see `''`. That keeps `z.url()` / `z.email()`
// happy without needing `z.preprocess` (which would force the form's input
// type to `unknown` and break RHF's resolver typing).
export const clubFormSchema = z.object({
  name: z.string().min(2, copy.club.validation.nameRequired),
  description: z.string().min(10, copy.club.validation.descriptionTooShort),
  year_founded: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .nullable()
    .optional(),
  division: z.enum(DIVISIONS),
  category: z.enum(CATEGORIES),
  address_display: z.string().min(2, copy.club.validation.addressRequired),
  // Form-only fields; the route mapper strips them and writes a PostGIS
  // POINT into `clubs.location`. Optional so the edit form can submit
  // without re-picking an address — the mapper omits `location` from the
  // patch when these are absent.
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  website_url: z.url().nullable().optional(),
  social_instagram: z.string().nullable().optional(),
  social_facebook: z.string().nullable().optional(),
  contact_email: z.email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  brand_color: hexColor.nullable().optional(),
  practice_days: z.array(z.enum(DAYS_OF_WEEK)),
  practice_times: z.string().nullable().optional(),
});
export type ClubFormInput = z.infer<typeof clubFormSchema>;

export const claimSchema = z.object({
  notes: z.string().max(500).optional(),
});
export type ClaimInput = z.infer<typeof claimSchema>;
