import { z } from 'zod';

import { CATEGORIES, DIVISIONS } from './constants';

/** Hex color like #RRGGBB or #RGB. */
const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use a hex color like #B5161E');

export const signInSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = signInSchema;
export type SignUpInput = z.infer<typeof signUpSchema>;

export const clubFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(10, 'Description should be at least a sentence or two'),
  year_founded: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .nullable()
    .optional(),
  division: z.enum(DIVISIONS),
  category: z.enum(CATEGORIES),
  address_display: z.string().min(2, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  website_url: z.url().nullable().optional(),
  social_instagram: z.string().nullable().optional(),
  social_facebook: z.string().nullable().optional(),
  contact_email: z.email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  brand_color: hexColor.nullable().optional(),
});
export type ClubFormInput = z.infer<typeof clubFormSchema>;

export const claimSchema = z.object({
  notes: z.string().max(500).optional(),
});
export type ClaimInput = z.infer<typeof claimSchema>;
