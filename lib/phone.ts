/**
 * Phone helpers built on libphonenumber-js (min build — country metadata only,
 * not per-region number types). Storage format is E.164 (`+14155724853`); the
 * UI formats on input (AsYouType) and on display (international).
 *
 * Admins outside the default country prefix `+<country>` — e.g. `+44 20 …`.
 */

import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'US';

export function parsePhoneToE164(
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed?.isValid()) return null;
  return parsed.number;
}

/** International display, e.g. `+1 415 572 4853`. Falls back to input if unparseable. */
export function formatPhone(value: string): string {
  const parsed = parsePhoneNumberFromString(value);
  return parsed?.formatInternational() ?? value;
}

export function whatsappUrl(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

/** Live formatter for text-input onChange — re-formats the full string each keystroke. */
export function asYouTypePhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
): string {
  return new AsYouType(defaultCountry).input(input);
}
