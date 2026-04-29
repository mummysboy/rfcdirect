/**
 * Helpers for the `practice_days` (text[]) and `practice_times` (text)
 * columns. The form, the public profile, and the inline list expansion all
 * read/write through here so the storage shape stays in one place.
 *
 * Storage format for `practice_times`: "HH:MM-HH:MM" 24-hour. Either half can
 * be empty (e.g. "07:00-" if only the start is set).
 */

import { DAYS_OF_WEEK, type DayOfWeek } from './constants';
import { dayLabels } from './copy';

// Two capture groups so `parse24` below can pull hour and minute out
// directly. `.test()` callers don't care about the groups.
export const TIME_RE = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

export function parseTimeRange(s: string | null | undefined): {
  start: string;
  end: string;
} {
  if (!s) return { start: '', end: '' };
  const [a, b] = s.split('-');
  return {
    start: TIME_RE.test(a ?? '') ? a! : '',
    end: TIME_RE.test(b ?? '') ? b! : '',
  };
}

export function serializeTimeRange(
  start: string,
  end: string,
): string | null {
  if (!start && !end) return null;
  return `${start}-${end}`;
}

/** "2 hours" / "1h 30m" / "45 min". Null when the range is invalid or zero. */
export function durationLabel(start: string, end: string): string | null {
  if (!TIME_RE.test(start) || !TIME_RE.test(end)) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? '1 hour' : `${h} hours`;
  return `${h}h ${m}m`;
}

/** Days listed in week order, comma-separated. Filters unknown codes. */
export function formatPracticeDays(days: string[] | null | undefined): string {
  if (!days || days.length === 0) return '';
  const set = new Set(days);
  return DAYS_OF_WEEK.filter((d) => set.has(d))
    .map((d) => dayLabels[d as DayOfWeek])
    .join(', ');
}

type Time12 = { hour: number; minute: number; suffix: 'AM' | 'PM' };

function parse24(s: string | undefined): Time12 | null {
  if (!s) return null;
  const m = TIME_RE.exec(s);
  if (!m) return null;
  const h24 = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour, minute, suffix };
}

function formatTime12(t: Time12, withSuffix = true): string {
  const m = t.minute.toString().padStart(2, '0');
  const base = `${t.hour}:${m}`;
  return withSuffix ? `${base} ${t.suffix}` : base;
}

/** "7:00 – 9:00 PM" (suffix collapses when both halves match). */
export function formatPracticeTimes(s: string | null | undefined): string {
  if (!s) return '';
  const [a, b] = s.split('-');
  const start = parse24(a);
  const end = parse24(b);
  if (!start) return s;
  if (!end) return formatTime12(start);
  if (start.suffix === end.suffix) {
    return `${formatTime12(start, false)} – ${formatTime12(end)}`;
  }
  return `${formatTime12(start)} – ${formatTime12(end)}`;
}
