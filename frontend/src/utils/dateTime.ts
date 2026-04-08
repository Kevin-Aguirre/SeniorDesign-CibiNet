function hasExplicitTimezone(iso: string): boolean {
  return /Z$/i.test(iso) || /[+-]\d{2}:\d{2}$/.test(iso) || /[+-]\d{4}$/.test(iso);
}

export function parseApiUtc(iso: string): Date {
  const s = iso.trim();
  if (!s) return new Date(NaN);
  if (hasExplicitTimezone(s)) return new Date(s);
  return new Date(`${s}Z`);
}

export function formatLocalDateTime(iso: string): string {
  const d = parseApiUtc(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
