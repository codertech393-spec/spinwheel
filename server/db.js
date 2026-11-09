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
    { name: '$5000', kind: 'Cash reward', value: '$5000', color: '#7cfc00', icon: '💵', weight: 20 },
    { name: 'Game Pass', kind: 'Gaming reward', value: '1 year', color: '#164b27', icon: '🎮', weight: 10 },
    { name: 'Try Again', kind: 'No prize', value: 'Good luck', color: '#222a25', icon: '✨', weight: 25, respin: true },
    { name: '$10,000', kind: 'Cash reward', value: '$10,000', color: '#a5ff50', icon: '💸', weight: 10 },
    { name: 'Controller', kind: 'Gaming gear', value: 'Prize', color: '#234b36', icon: '🕹️', weight: 5 },
    { name: '$25,000', kind: 'Cash reward', value: '$25,000', color: '#c2ff82', icon: '💰', weight: 2 },
    { name: 'Try Again', kind: 'No prize', value: 'Good luck', color: '#222a25', icon: '✨', weight: 25, respin: true },
    { name: 'Grand Prize', kind: 'Featured reward', value: 'Mystery', color: '#315e25', icon: '🏆', weight: 1 },
  ],
  rewards: [
    { id: 'r1', name: '$5000', kind: 'Cash reward', value: '$5000', icon: '💵', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r2', name: 'Game Pass', kind: 'Gaming reward', value: '1 year', icon: '🎮', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r3', name: '$10,000', kind: 'Cash reward', value: '$10,000', icon: '💸', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r4', name: 'Controller', kind: 'Gaming gear', value: 'Prize', icon: '🕹️', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r5', name: '$25,000', kind: 'Cash reward', value: '$25,000', icon: '💰', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r6', name: 'Grand Prize', kind: 'Featured reward', value: 'Mystery', icon: '🏆', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r7', name: 'Wireless Headset', kind: 'Gaming gear', value: 'Featured', icon: '🎧', active: true, claimInstructions: DEFAULT_CLAIM },
    { id: 'r8', name: 'Gift Card Bundle', kind: 'Gaming reward', value: 'Bundle', icon: '🎁', active: true, claimInstructions: DEFAULT_CLAIM },
  ],
});

let db;

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    db.plays ||= {}; // files from earlier versions lack these
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
  return db;
}

export function save() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE); // atomic replace so a crash can't corrupt the file
}

export const get = () => db;
