# Xbox 25 backend + admin (tracking-number flow, no accounts)

## How it works
- No accounts or sign-in. Each visitor gets **one spin** (`SPINS_PER_DEVICE`, default 1).
- **Try Again** does not use up the spin: the visitor spins again until the wheel lands on a prize. Only prize spins count against the device and network limits.
- **Every winning spin also includes the bonus console** (`bonus` in `server/data/db.json`: `enabled` and `name`; set `enabled` to `false` to switch it off). Save the console picture as `public/xbox-limited-console.png` in your Vite project; until then an icon is shown.
- The wheel is drawn on the **server**. A winning spin creates a prize with a **tracking number** (`XB25-XXXX-XXXX-XXXX`).
- The winner saves the number, then enters it on **/track** to see the prize, how to claim, and its status. They request the claim by choosing how they want to be contacted (WhatsApp, Telegram, text message or email) and giving a number, username or address. The admin sees the full details with a tap-to-open link; the winner only ever sees a masked version.
- Anyone who returns on the same browser sees their number again on /spin.
- Admin (`/admin`): search by tracking number, set status (pending / claim requested / delivered / not approved), add notes, hide from the winners wall, create prizes by hand (gives you a tracking number to pass on), edit rewards + claim steps, read contact messages.

## Run it
```bash
# 1. API (port 4000)
cd server
npm install
ADMIN_KEY=pick-a-long-secret npm start      # Windows PowerShell: $env:ADMIN_KEY="..."; npm start

# 2. Frontend (your existing Vite project)
npm run dev
```
Add a dev proxy to `vite.config.ts` so `/api` reaches the server:
```ts
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000' } },
});
```

## Files
- `server/index.js` routes, `server/db.js` JSON storage (`server/data/db.json`, created on first run), `server/tracking.js` tracking-number generate / normalize / mask.
- `src/api.ts` API client, `src/pages/Spin.tsx`, `src/pages/Track.tsx`, `src/pages/admin/AdminPage.tsx`.
- `src/config/event.ts` sponsor + legal details (fill in before launch).
- `src/lib/wheelMath.ts` wheel timing: `SPIN_MS` (default 8000 = 8 seconds) and `ROTATIONS`. Raise `SPIN_MS` for more suspense. `src/config/contactMethods.ts` the contact options shown on the claim form.

## Settings (environment variables)
| Variable | Default | Meaning |
|---|---|---|
| `ADMIN_KEY` | dev only | Admin password. Required in production (16+ characters). |
| `SPINS_PER_DEVICE` | 1 | Spins per browser. Keep `spinsPerPerson` in `src/config/event.ts` in sync. |
| `MAX_SPINS_PER_IP_PER_DAY` | 5 | Backstop cap on counted (prize) spins per network per day. Raise it if many people share one network (schools, offices, mobile carriers). |
| `MAX_ATTEMPTS_PER_IP_PER_DAY` | 100 | Cap on all spins per network per day, including Try Again. |
| `NODE_ENV=production` | | Strict startup checks + secure cookies (needs HTTPS). |
| `ALLOWED_ORIGIN` | | Only if the frontend is on another origin. |
| `PORT` | 4000 | |

## Upgrading from the earlier version
Existing data is upgraded automatically on startup: old `SF25-` tracking numbers become `XB25-`, email-only claims keep working, and the old default claim text is refreshed. Test data from the account-based version should still be deleted.

Delete `server/data/db.json` (test users/winnings from the account version). Wheel odds are `weight` values in `server/db.js` (seed) or `server/data/db.json` (once created) and are PLACEHOLDERS: set them to prizes the sponsor can actually fund. The Rules page shows the live odds.

## Know the limits
- **One spin per person cannot be perfectly enforced without identifying people.** The cookie stops casual repeat spins; someone clearing cookies or using private windows can spin again until the per-network cap. If you need strict limits, issue unique spin codes (printed on products or sent by email) and require one per spin.
- The tracking number is the only key to a prize, so it is long and random, lookups are rate limited, and the winners wall shows only the last 4 characters.
- JSON file storage is for launch-scale prototyping; move to SQLite/Postgres with backups for real traffic. Admin sessions live in memory (restart = log in again).
- Fill `src/config/event.ts`, replace the trademark line with the attribution Xbox/Microsoft requires, and have counsel review the Rules and Privacy pages.

## Console bonus and Try Again

- Every winning spin also gets the **Xbox Limited Edition Console** (`db.bonus` in `server/data/db.json`; set `"enabled": false` to switch it off). The console picture goes in `public/xbox-limited-console.png` (use the official image) and links to https://www.xbox.com/en-US/consoles/all-consoles.
- Landing on **Try Again** does not use up the spin: the visitor simply spins again (they are still capped by `MAX_ATTEMPTS_PER_IP_PER_DAY`, default 100). Only a spin that lands on a prize counts.
- Cost warning: with the default wheel every non-"Try Again" segment is a prize and Try Again is a free respin, so every visitor eventually wins a prize plus a console. Add a real "no prize" segment and/or cap console stock before launch.
- Fill `consoleValue` in `src/config/event.ts` (approximate retail value) for the official rules.

## Permanent storage on free hosting (Postgres)

By default data is saved to `server/data/db.json`, which free hosts erase on every restart. Set `DATABASE_URL` and the server stores everything in Postgres instead (same data, one table `app_state`, created automatically). Without `DATABASE_URL` it keeps using the local file, so local development is unchanged.

1. Create a free project at https://neon.tech, then copy the connection string (starts with `postgresql://`).
2. On your host (Render, Railway...) add an environment variable `DATABASE_URL` with that string. Never put it in a file or in git.
3. Run `npm install` in `server` (adds the `pg` package) and deploy.
4. On start the log says `Data store: Postgres (DATABASE_URL)`.

Notes: run a single server instance (data is held in memory and written as a whole). Writes are queued and retried, and flushed on shutdown. Good for thousands of winners; if you expect far more, move to per-row tables.
