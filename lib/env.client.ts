// Client-safe env access + helpers (no server secrets)
function getEnv(name: string, fallback?: string): string {
  const v = (process.env as any)[name];
  if (typeof v === 'string' && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  return '';
}

// Phone helpers
function digits(s: string) { return (s || '').replace(/\D/g, ''); }
export function formatPhoneForDisplay(e164OrLocal: string): string {
  // Accept +1XXXXXXXXXX or 10-digit US numbers and render as 3 3 4 (e.g., 877 766 6307)
  let d = digits(e164OrLocal);
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length === 10) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
  return e164OrLocal || '';
}

// Public numbers
export const TRIAL_NUMBER = getEnv('NEXT_PUBLIC_TRIAL_NUMBER', '+17722777570');     // marketing pages only
export const TOLLFREE_E164 = getEnv('NEXT_PUBLIC_TOLLFREE', '+18777666307');        // members-only (dashboard)
export const TOLLFREE_DISPLAY = formatPhoneForDisplay(TOLLFREE_E164);

// Usage limits (public, editable without code changes)
const CALLS_LIMIT_RAW = Number(getEnv('NEXT_PUBLIC_MEMBERS_MAX_CALLS_PER_MONTH', '10'));
const PER_CALL_MAX_SEC = Number(getEnv('NEXT_PUBLIC_MEMBER_MAX_SECONDS', String(35 * 60)));
const SOFT_REMINDER_SEC = Number(getEnv('NEXT_PUBLIC_MEMBER_SOFT_REMINDER_SECONDS', String(25 * 60)));

export const CALLS_LIMIT = Number.isFinite(CALLS_LIMIT_RAW) ? CALLS_LIMIT_RAW : 10;
export const PER_CALL_MAX_MIN = Math.round(
  Number.isFinite(PER_CALL_MAX_SEC) ? PER_CALL_MAX_SEC / 60 : 35
);
export const SOFT_REMINDER_MIN = Math.round(
  Number.isFinite(SOFT_REMINDER_SEC) ? SOFT_REMINDER_SEC / 60 : 25
);
