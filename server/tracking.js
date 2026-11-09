import crypto from 'node:crypto';

// Tracking numbers look like XB25-ABCD-EFGH-JKLM (12 random characters, about 59 bits).
// The alphabet leaves out I, L, O, 0 and 1 so numbers are easy to read out and type.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const PREFIX = 'XB25';
export const LEGACY_PREFIX = 'SF25'; // numbers issued before the rename; migrated on startup
const BODY_LEN = 12;

const format = (s) => `${PREFIX}-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;

export function generateCode() {
  let s = '';
  for (let i = 0; i < BODY_LEN; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return format(s);
}

// Accepts any casing, spaces or missing dashes. Returns the canonical code, or null if it can't be valid.
export function normalizeCode(raw) {
  let s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length === BODY_LEN + PREFIX.length && s.startsWith(PREFIX)) s = s.slice(PREFIX.length);
  if (s.length !== BODY_LEN) return null;
  for (const ch of s) if (!ALPHABET.includes(ch)) return null;
  return format(s);
}

// Public winners wall: never reveal the full number, since it is the key to the prize.
export const maskCode = (code) => `${PREFIX}-••••-••••-${code.slice(-4)}`;

// ---------- how a winner wants to be contacted ----------
export const CONTACT_METHODS = ['whatsapp', 'telegram', 'sms', 'email'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;
const TG_USER_RE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

// Returns the cleaned contact value (phones without spaces, @username, lowercase email),
// or null if it doesn't fit the chosen method.
export function cleanContact(method, raw) {
  const v = String(raw || '').trim();
  const phone = v.replace(/[\s().-]/g, '');
  if (method === 'email') return v.length <= 120 && EMAIL_RE.test(v) ? v.toLowerCase() : null;
  if (method === 'whatsapp' || method === 'sms') return PHONE_RE.test(phone) ? phone : null;
  if (method === 'telegram') {
    const user = v.replace(/^@/, '');
    if (TG_USER_RE.test(user)) return '@' + user;
    return PHONE_RE.test(phone) ? phone : null;
  }
  return null;
}

export function maskEmail(email) {
  const [user = '', domain = ''] = String(email).split('@');
  return `${user.slice(0, 1)}***@${domain}`;
}

// What the winner sees back on the tracking page (the full value is only visible to the admin).
export function maskContact(method, value) {
  if (method === 'email') return maskEmail(value);
  if (value.startsWith('@')) return value.slice(0, 3) + '•'.repeat(Math.max(2, value.length - 3));
  return '•'.repeat(Math.max(4, value.length - 4)) + value.slice(-4);
}
