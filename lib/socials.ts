/**
 * Helpers for `social_instagram` / `social_facebook`. Users may enter a bare
 * handle (`@foo`), a path (`foo`), or a full URL — these normalize the value
 * for display (always `@handle`) and for linking (canonical platform URL).
 */

export function socialDisplay(s: string): string {
  const t = s.trim();
  if (/^https?:\/\//i.test(t)) {
    const tail = t
      .replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//i, '')
      .replace(/\/$/, '');
    return tail ? `@${tail}` : t;
  }
  return t.startsWith('@') ? t : `@${t.replace(/^\//, '')}`;
}

export function instagramUrl(s: string): string {
  const t = s.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://www.instagram.com/${t.replace(/^@/, '').replace(/^\//, '')}`;
}

export function facebookUrl(s: string): string {
  const t = s.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://www.facebook.com/${t.replace(/^@/, '').replace(/^\//, '')}`;
}
