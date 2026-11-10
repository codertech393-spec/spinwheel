import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { load, save, get, flush, DEFAULT_CLAIM } from './db.js';
import { generateCode, normalizeCode, maskCode, cleanContact, maskContact, CONTACT_METHODS, PREFIX, LEGACY_PREFIX } from './tracking.js';

const PORT = process.env.PORT || 4000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me-admin';
const IS_PROD = process.env.NODE_ENV === 'production';
// Spins each browser gets, and a backstop cap per network (IP) per day.
const SPINS_PER_DEVICE = Math.max(1, Number(process.env.SPINS_PER_DEVICE) || 1);
const MAX_SPINS_PER_IP_PER_DAY = Math.max(1, Number(process.env.MAX_SPINS_PER_IP_PER_DAY) || 5); // counted spins (ones that land on a prize)
const MAX_ATTEMPTS_PER_IP_PER_DAY = Math.max(1, Number(process.env.MAX_ATTEMPTS_PER_IP_PER_DAY) || 100); // every spin, including Try Again
const ADMIN_SESSION_MS = 12 * 3600_000;

if (!process.env.ADMIN_KEY) {
  if (IS_PROD) { console.error('ADMIN_KEY must be set in production.'); process.exit(1); }
  console.warn('[warn] ADMIN_KEY not set, using the insecure default "change-me-admin" (dev only)');
}
if (IS_PROD && ADMIN_KEY.length < 16) { console.error('ADMIN_KEY must be at least 16 characters in production.'); process.exit(1); }

await load();

const STATUSES = ['pending', 'claim_requested', 'fulfilled', 'rejected'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uid = (p) => p + crypto.randomBytes(5).toString('hex');
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function makeTrackingId() {
  for (;;) {
    const id = generateCode();
    if (!get().winnings.some((w) => w.trackingId === id)) return id;
  }
}

// Upgrade data saved by earlier versions: missing tracking numbers, the old SF25 prefix and email-only claims.
{
  const db = get();
  const rePrefix = (id) => (id.startsWith(LEGACY_PREFIX + '-') ? PREFIX + id.slice(LEGACY_PREFIX.length) : id);
  let changed = false;
  for (const w of db.winnings) {
    if (!w.trackingId) { w.trackingId = makeTrackingId(); changed = true; }
    else if (w.trackingId.startsWith(LEGACY_PREFIX + '-')) { w.trackingId = rePrefix(w.trackingId); changed = true; }
    if (w.claimEmail && !w.claimValue) { w.claimMethod = 'email'; w.claimValue = w.claimEmail; delete w.claimEmail; changed = true; }
  }
  for (const p of Object.values(db.plays)) {
    if (p.wins?.some((id) => id.startsWith(LEGACY_PREFIX + '-'))) { p.wins = p.wins.map(rePrefix); changed = true; }
  }
  if (changed) save();
}

const app = express();
app.set('trust proxy', 1); // correct client IPs behind a reverse proxy, so rate limits work
app.disable('x-powered-by');
// Set ALLOWED_ORIGIN (e.g. https://your-site.com) only if the frontend is served from another origin.
app.use(cors(process.env.ALLOWED_ORIGIN ? { origin: process.env.ALLOWED_ORIGIN.split(',') } : undefined));
app.use((_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' });
  next();
});
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use(express.json({ limit: '50kb' }));

// ---------- rate limiting (in memory, per IP + endpoint) ----------
const hits = new Map();
function throttle(name, limit, windowMs) {
  return (req, res, next) => {
    const key = `${name}|${req.ip}`;
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) { hits.set(key, recent); return res.status(429).json({ error: 'Too many attempts. Try again soon.' }); }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

// ---------- spin limits: one per browser (cookie) + a per-network daily cap ----------
const ipSpins = new Map(); // "YYYY-MM-DD|ip" -> counted spins today (memory only; IPs are never written to disk)
const ipAttempts = new Map(); // same key -> every spin today, including Try Again
const today = () => new Date().toISOString().slice(0, 10);

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) { try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* ignore bad cookie */ } }
  }
  return out;
}

// Returns a hash of this browser's random id, setting the cookie the first time.
function deviceFor(req, res) {
  if (req.deviceHash) return req.deviceHash;
  let id = parseCookies(req).sf_device;
  if (!/^[a-f0-9]{32}$/.test(id || '')) {
    id = crypto.randomBytes(16).toString('hex');
    res.append('Set-Cookie', `sf_device=${id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${IS_PROD ? '; Secure' : ''}`);
  }
  req.deviceHash = crypto.createHash('sha256').update(id).digest('hex');
  return req.deviceHash;
}

function allowance(req, res) {
  const device = deviceFor(req, res);
  const play = get().plays[device];
  const ipKey = `${today()}|${req.ip}`;
  const ipUsed = ipSpins.get(ipKey) || 0; // spins that ended in a prize
  const attemptsUsed = ipAttempts.get(ipKey) || 0; // every spin, including Try Again
  const deviceLeft = Math.max(0, SPINS_PER_DEVICE - (play?.count || 0));
  const ipLeft = Math.max(0, MAX_SPINS_PER_IP_PER_DAY - ipUsed);
  const left = attemptsUsed >= MAX_ATTEMPTS_PER_IP_PER_DAY ? 0 : Math.min(deviceLeft, ipLeft);
  return { device, play, ipKey, ipUsed, attemptsUsed, left, networkLimited: deviceLeft > 0 && left === 0 };
}

// ---------- views ----------
// What a winner sees when they look up their tracking number (no internal ids, email masked).
const view = (w) => ({
  trackingId: w.trackingId,
  rewardName: w.rewardName,
  kind: w.kind,
  value: w.value,
  icon: w.icon,
  claimInstructions: w.claimInstructions,
  status: w.status,
  note: w.note,
  createdAt: w.createdAt,
  claimRequestedAt: w.claimRequestedAt,
  claimMethod: w.claimValue ? w.claimMethod : undefined,
  claimContact: w.claimValue ? maskContact(w.claimMethod, w.claimValue) : undefined,
  bonus: w.bonus?.name,
});

const bonusFor = () => (get().bonus?.enabled ? { name: get().bonus.name } : null);

function createWinning({ item, source, note = '', bonus = null }) {
  const w = {
    id: uid('w_'),
    trackingId: makeTrackingId(),
    rewardName: item.name,
    kind: item.kind,
    value: item.value,
    icon: item.icon,
    claimInstructions: item.claimInstructions || DEFAULT_CLAIM,
    source,
    status: 'pending',
    public: true,
    note,
    bonus: bonus || undefined, // { name } of the extra prize (the console) that comes with this win
    createdAt: new Date().toISOString(),
  };
  get().winnings.unshift(w);
  return w;
}

// ---------- public ----------
const weightOf = (s) => (Number.isInteger(s.weight) && s.weight > 0 ? s.weight : 1);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/wheel', (_req, res) => {
  const wheel = get().wheel;
  const total = wheel.reduce((sum, s) => sum + weightOf(s), 0);
  res.json(wheel.map(({ weight, ...s }) => ({ ...s, odds: weightOf({ weight }) / total })));
});

app.get('/api/rewards', (_req, res) => res.json(get().rewards.filter((r) => r.active)));
app.get('/api/bonus', (_req, res) => res.json({ enabled: Boolean(get().bonus?.enabled), name: get().bonus?.name || '' }));

app.get('/api/winners', (_req, res) => {
  const list = get()
    .winnings.filter((w) => w.public && w.kind !== 'No prize')
    .slice(0, 24)
    .map((w) => ({ code: maskCode(w.trackingId), rewardName: w.rewardName, icon: w.icon, createdAt: w.createdAt, bonus: w.bonus?.name }));
  res.json(list);
});

// ---------- spinning (no account) ----------
app.get('/api/spin/status', (req, res) => {
  const a = allowance(req, res);
  const wins = (a.play?.wins || [])
    .map((id) => get().winnings.find((w) => w.trackingId === id))
    .filter(Boolean)
    .map(view);
  res.json({ spinsLeft: a.left, limitedByNetwork: a.networkLimited, wins });
});

app.post('/api/spin', throttle('spin', 10, 60_000), (req, res) => {
  const a = allowance(req, res);
  if (a.left <= 0) {
    return res.status(400).json({ error: a.networkLimited ? 'Too many spins from this network today. Please try again tomorrow.' : 'Your spin has already been used.' });
  }
  const db = get();
  const wheel = db.wheel;
  // server-side weighted draw using a cryptographic RNG
  const total = wheel.reduce((sum, s) => sum + weightOf(s), 0);
  let roll = crypto.randomInt(total);
  let index = 0;
  for (let i = 0; i < wheel.length; i++) {
    roll -= weightOf(wheel[i]);
    if (roll < 0) { index = i; break; }
  }
  const seg = wheel[index];

  db.totalSpins = (db.totalSpins || 0) + 1;
  ipAttempts.set(a.ipKey, a.attemptsUsed + 1);

  // "Try Again" does not use up the spin: the visitor simply spins again.
  // Only a spin that lands on a prize is counted against the device and the network.
  let winning = null;
  if (seg.kind !== 'No prize') {
    const now = new Date().toISOString();
    const play = (db.plays[a.device] ||= { count: 0, firstAt: now, wins: [] });
    play.count += 1;
    play.lastAt = now;
    ipSpins.set(a.ipKey, a.ipUsed + 1);
    // use the claim steps the admin wrote for the matching reward; every win also gets the bonus prize
    const reward = db.rewards.find((r) => r.name === seg.name);
    const w = createWinning({ item: { ...seg, claimInstructions: reward?.claimInstructions }, source: 'spin', bonus: bonusFor() });
    play.wins.push(w.trackingId);
    winning = view(w);
  }
  save();
  const { weight: _weight, ...segment } = seg;
  res.json({ index, segment, winning, tryAgain: seg.kind === 'No prize', spinsLeft: allowance(req, res).left });
});

const CONTACT_ERRORS = {
  whatsapp: 'Enter your WhatsApp number with country code, for example +15551234567.',
  sms: 'Enter your mobile number with country code, for example +15551234567.',
  telegram: 'Enter your Telegram @username (5-32 letters, numbers or underscores) or your phone number.',
  email: 'Enter a valid email address.',
};

// ---------- tracking number lookup + claim ----------
app.get('/api/track/:code', throttle('track', 20, 60_000), (req, res) => {
  const code = normalizeCode(req.params.code);
  const w = code && get().winnings.find((x) => x.trackingId === code);
  if (!w) return res.status(404).json({ error: "We couldn't find a prize for that tracking number. Check for typos. The letters I, L, O and the numbers 0 and 1 are never used." });
  res.json(view(w));
});

app.post('/api/track/:code/claim', throttle('claim', 10, 60_000), (req, res) => {
  const code = normalizeCode(req.params.code);
  const w = code && get().winnings.find((x) => x.trackingId === code);
  if (!w) return res.status(404).json({ error: 'Tracking number not found.' });
  if (w.status !== 'pending') return res.status(400).json({ error: 'A claim has already been requested for this prize.' });
  const method = str(req.body?.method, 20).toLowerCase();
  if (!CONTACT_METHODS.includes(method)) return res.status(400).json({ error: 'Choose how you would like to be contacted.' });
  const value = cleanContact(method, req.body?.contact);
  if (!value) return res.status(400).json({ error: CONTACT_ERRORS[method] });
  w.claimMethod = method;
  w.claimValue = value;
  w.claimName = str(req.body?.name, 80);
  w.status = 'claim_requested';
  w.claimRequestedAt = new Date().toISOString();
  save();
  res.json(view(w));
});

// ---------- contact form ----------
app.post('/api/contact', throttle('contact', 5, 60_000), (req, res) => {
  const b = req.body || {};
  const msg = { id: uid('m_'), name: str(b.name, 80), email: str(b.email, 120), topic: str(b.topic, 40), message: str(b.message, 2000), createdAt: new Date().toISOString() };
  if (!msg.name || !msg.message || !EMAIL_RE.test(msg.email)) return res.status(400).json({ error: 'Please enter your name, a valid email and a message.' });
  get().messages.unshift(msg);
  if (get().messages.length > 2000) get().messages.length = 2000;
  save();
  res.json({ ok: true });
});

// ---------- admin ----------
const adminSessions = new Map(); // token -> expiry (memory only; restarting the server signs admins out)
function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const exp = adminSessions.get(token);
  if (!exp || exp < Date.now()) { adminSessions.delete(token); return res.status(401).json({ error: 'Admin access required.' }); }
  next();
}

app.post('/api/admin/login', throttle('admin-login', 8, 60_000), (req, res) => {
  const given = Buffer.from(String(req.body?.key || ''));
  const real = Buffer.from(ADMIN_KEY);
  const ok = given.length === real.length && crypto.timingSafeEqual(given, real);
  if (!ok) return res.status(401).json({ error: 'Wrong admin key.' });
  const token = crypto.randomBytes(24).toString('hex');
  adminSessions.set(token, Date.now() + ADMIN_SESSION_MS);
  res.json({ token });
});

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const db = get();
  res.json({
    winnings: db.winnings,
    rewards: db.rewards,
    messages: db.messages,
    stats: {
      winnings: db.winnings.length,
      claimRequests: db.winnings.filter((w) => w.status === 'claim_requested').length,
      spins: db.totalSpins || 0,
      consoles: db.winnings.filter((w) => w.bonus).length,
    },
  });
});

// Manually award a prize (e.g. a bonus winner). Returns the tracking number to hand to the winner.
app.post('/api/admin/award', requireAdmin, (req, res) => {
  const reward = get().rewards.find((r) => r.id === req.body?.rewardId);
  if (!reward) return res.status(404).json({ error: 'Reward not found.' });
  const w = createWinning({ item: reward, source: 'admin', note: str(req.body?.note, 300), bonus: req.body?.withConsole === true ? bonusFor() : null });
  save();
  res.json(w);
});

app.patch('/api/admin/winnings/:id', requireAdmin, (req, res) => {
  const w = get().winnings.find((x) => x.id === req.params.id);
  if (!w) return res.status(404).json({ error: 'Winning not found.' });
  const { status, public: pub, note, claimInstructions } = req.body || {};
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    w.status = status;
  }
  if (typeof pub === 'boolean') w.public = pub;
  if (note !== undefined) w.note = str(note, 300);
  if (claimInstructions !== undefined) w.claimInstructions = str(claimInstructions, 600) || DEFAULT_CLAIM;
  save();
  res.json(w);
});

app.delete('/api/admin/winnings/:id', requireAdmin, (req, res) => {
  const db = get();
  const before = db.winnings.length;
  db.winnings = db.winnings.filter((x) => x.id !== req.params.id);
  if (db.winnings.length === before) return res.status(404).json({ error: 'Winning not found.' });
  save();
  res.json({ ok: true });
});

const rewardFields = (b) => ({
  name: str(b.name, 60),
  kind: str(b.kind, 40) || 'Gaming reward',
  value: str(b.value, 40),
  icon: str(b.icon, 8) || '🎁',
  active: b.active !== false,
  claimInstructions: str(b.claimInstructions, 600) || DEFAULT_CLAIM,
});
app.post('/api/admin/rewards', requireAdmin, (req, res) => {
  const f = rewardFields(req.body || {});
  if (!f.name) return res.status(400).json({ error: 'Name is required.' });
  const r = { id: uid('r_'), ...f };
  get().rewards.push(r);
  save();
  res.json(r);
});
app.put('/api/admin/rewards/:id', requireAdmin, (req, res) => {
  const r = get().rewards.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Reward not found.' });
  const f = rewardFields({ ...r, ...(req.body || {}) });
  if (!f.name) return res.status(400).json({ error: 'Name is required.' });
  Object.assign(r, f);
  save();
  res.json(r);
});
app.delete('/api/admin/rewards/:id', requireAdmin, (req, res) => {
  const db = get();
  db.rewards = db.rewards.filter((x) => x.id !== req.params.id);
  save();
  res.json({ ok: true });
});

// housekeeping: drop stale rate-limit entries, old daily IP counters and expired admin sessions
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of hits) if (!arr.length || now - arr[arr.length - 1] > 3_600_000) hits.delete(k);
  for (const k of ipSpins.keys()) if (!k.startsWith(today())) ipSpins.delete(k);
  for (const k of ipAttempts.keys()) if (!k.startsWith(today())) ipAttempts.delete(k);
  for (const [t, exp] of adminSessions) if (exp < now) adminSessions.delete(t);
}, 600_000).unref();

const server = app.listen(PORT, () => console.log(`Xbox 25 API on http://localhost:${PORT}`));

// Hosts send SIGTERM on every redeploy/restart: finish saving first so nothing is lost.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    server.close();
    await flush();
    process.exit(0);
  });
}
