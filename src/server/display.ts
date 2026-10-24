// UNiCOM Console — display helpers (BASE, TL-owned, FROZEN).
// Single source of truth for server-side humanization (architecture doc §3).
// All functions take an injectable `now` so tests are wall-clock-free.
// Do not modify — propose changes via your COMPLETION REPORT.

function toDate(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** "07:04Z" — UTC time-of-day label. */
export function hhmm(date: string | Date): string {
  const d = toDate(date);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}Z`;
}

/**
 * Relative time for store lastSync:
 * "just now" (<60s) · "N min ago" (<60m) · "N h ago" (<24h)
 * · "yesterday HH:MMZ" (1-2d) · "N d ago" (beyond).
 */
export function relativeTime(
  value: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!value) return "never";
  const d = toDate(value);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return `yesterday ${hhmm(d)}`;
  return `${diffD} d ago`;
}

/**
 * Time-of-day for lastAudit / mission started / watch ts:
 * "HH:MMZ" when same UTC day as `now`, else "yesterday HH:MMZ"
 * (older than that: fall back to the date "YYYY-MM-DD").
 */
export function dayTime(
  value: string | Date,
  now: Date = new Date(),
): string {
  const d = toDate(value);
  const sameDay =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  if (sameDay) return hhmm(d);
  const dayBefore = new Date(now.getTime() - 86400000);
  const wasYesterday =
    d.getUTCFullYear() === dayBefore.getUTCFullYear() &&
    d.getUTCMonth() === dayBefore.getUTCMonth() &&
    d.getUTCDate() === dayBefore.getUTCDate();
  if (wasYesterday) return `yesterday ${hhmm(d)}`;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Decision expiry label: "expires HH:MMZ" / "expires tomorrow HH:MMZ" / "expires YYYY-MM-DD". */
export function expiresLabel(
  value: string | Date,
  now: Date = new Date(),
): string {
  return `expires ${dayTime(value, now)}`;
}
