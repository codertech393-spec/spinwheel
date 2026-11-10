import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export const DEFAULT_CLAIM =
  "Choose how you'd like to be contacted below (WhatsApp, Telegram, text message or email), add your number or username, and press 'Request claim'. The event team will reach you there and update the status on this page. We will never ask for your password, card or bank details.";

// Wording used by earlier versions. Rewards and prizes still carrying it are updated on startup.
const OLD_DEFAULTS = [
  "Press 'Request claim' on this page. The event team reviews requests and updates the status here. We will never ask for your password, card or bank details.",
  "Enter your email below and press 'Request claim'. The event team reviews requests, contacts you at that email and updates the status on this page. We will never ask for your password, card or bank details.",
];

// weight = relative chance (integers). PLACEHOLDER ODDS: set these to match the prizes the sponsor can actually fund.
const seed = () => ({
  plays: {}, // hashed device id -> { count, firstAt, lastAt, wins: [trackingId] }
  totalSpins: 0,
  // Extra prize attached to EVERY winning spin. Set enabled to false to switch it off.
  bonus: { enabled: true, name: 'Xbox Limited Edition Console' },
  winnings: [],
  messages: [],
  wheel: [
    { name: '$5 Bonus', kind: 'Cash reward', value: '$5', color: '#7cfc00', icon: '💵', weight: 20 },
    { name: 'Game Pass', kind: 'Gaming reward', value: '1 month', color: '#164b27', icon: '🎮', weight: 10 },
    { name: 'Try Again', kind: 'No prize', value: 'Good luck', color: '#222a25', icon: '✨', weight: 25, respin: true },
    { name: '$10 Bonus', kind: 'Cash reward', value: '$10', color: '#a5ff50', icon: '💸', weight: 10 },
    { name: 'Controller', kind: 'Gaming gear', value: 'Prize', color: '#234b36', icon: '🕹️', weight: 5 },
    { name: '$25 Bonus', kind: 'Cash reward', value: '$25', color: '#c2ff82', icon: '💰', weight: 2 },
    { name: 'Try Again', kind: 'No prize', value: 'Good luck', color: '#222a25', icon: '✨', weight: 25, respin: true },
    { name: 'Grand Prize', kind: 'Featured reward', value: 'Mystery', color: '#315e25', icon: '🏆', weight: 1 },
  ],
  rewards: [
    { id: 'r1', name: '$5 Bonus', kind: 'Cash reward', value: '$5', icon: '💵', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r2', name: 'Game Pass', kind: 'Gaming reward', value: '1 month', icon: '🎮', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r3', name: '$10 Bonus', kind: 'Cash reward', value: '$10', icon: '💸', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r4', name: 'Controller', kind: 'Gaming gear', value: 'Prize', icon: '🕹️', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r5', name: '$25 Bonus', kind: 'Cash reward', value: '$25', icon: '💰', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r6', name: 'Grand Prize', kind: 'Featured reward', value: 'Mystery', icon: '🏆', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r7', name: 'Wireless Headset', kind: 'Gaming gear', value: 'Featured', icon: '🎧', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r8', name: 'Gift Card Bundle', kind: 'Gaming reward', value: 'Bundle', icon: '🎁', active: true, claimInstructions: DEFAULT_CLAIM },
  ],
});

let db;

// ---------- storage ----------
// With DATABASE_URL set (a Postgres connection string, e.g. from Neon or Supabase) the whole data set is kept
// in one Postgres row, so it survives restarts and redeploys on free hosts. Without it, a local JSON file is used.
const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

async function connect() {
  const { default: pg } = await import('pg');
  pool = new pg.Pool({ connectionString: DATABASE_URL, max: 3, ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: true } });
  await pool.query('CREATE TABLE IF NOT EXISTS app_state (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
}

async function readStored() {
  if (pool) {
    const r = await pool.query("SELECT value FROM app_state WHERE key = 'main'");
    return r.rows[0]?.value ?? null;
  }
  return fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : null;
}

export async function load() {
  if (DATABASE_URL) await connect();
  else fs.mkdirSync(DATA_DIR, { recursive: true });
  const stored = await readStored();
  if (stored) {
    db = stored;
    db.plays ||= {}; // data from earlier versions lacks these
    db.messages ||= [];
    db.totalSpins ||= 0;
    db.bonus ||= { enabled: true, name: 'Xbox Limited Edition Console' };
    let changed = false;
    for (const item of [...(db.rewards || []), ...(db.winnings || [])]) {
      if (OLD_DEFAULTS.includes(item.claimInstructions)) { item.claimInstructions = DEFAULT_CLAIM; changed = true; }
    }
    if (changed) save();
  } else {
    db = seed();
    save();
  }
  await flush();
  console.log(pool ? 'Data store: Postgres (DATABASE_URL)' : `Data store: local file ${DB_FILE}`);
  return db;
}

// save() stays synchronous for callers. Writes are queued: one at a time, always the newest snapshot,
// and a failed write is retried so a brief database hiccup does not lose data.
let writing = null;
let dirty = false;
let retry = null;

async function writeOnce() {
  const json = JSON.stringify(db);
  if (pool) {
    await pool.query(
      "INSERT INTO app_state (key, value, updated_at) VALUES ('main', $1::jsonb, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()",
      [json],
    );
  } else {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_FILE); // atomic replace so a crash can't corrupt the file
  }
}

function pump() {
  if (writing || !dirty) return;
  dirty = false;
  writing = writeOnce()
    .catch((err) => {
      console.error('[db] save failed, will retry:', err.message);
      dirty = true;
      clearTimeout(retry);
      retry = setTimeout(pump, 3000);
    })
    .finally(() => { writing = null; pump(); });
}

export function save() {
  dirty = true;
  pump();
}

// Resolves once everything saved so far has been written. Used on shutdown.
export async function flush() {
  for (let i = 0; i < 20 && (writing || dirty); i++) {
    if (!writing) pump();
    await writing;
  }
}

export const get = () => db;
