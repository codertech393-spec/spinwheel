import { useEffect, useState } from 'react';
import PageIntro from '../components/PageIntro';
import { EVENT, missingEventFields } from '../config/event';
import { api, type Bonus, type Segment } from '../api';

const box = 'max-w-3xl space-y-4 rounded-2xl border border-white/8 bg-[#111612] p-6 text-sm leading-7 text-white/60';
const h = 'font-bold text-white/85';
const tbd = (v: string) => v || '[to be confirmed by sponsor]';

function DevWarning() {
  const missing = missingEventFields();
  if (!import.meta.env.DEV || missing.length === 0) return null;
  return <div className="mb-6 max-w-3xl rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-xs text-amber-100/80">Dev only: fill these in src/config/event.ts before launch: {missing.join(', ')}.</div>;
}

function Rules() {
  const [wheel, setWheel] = useState<Segment[]>([]);
  const [bonus, setBonus] = useState<Bonus | null>(null);
  useEffect(() => {
    api.wheel().then(setWheel).catch(() => {});
    api.bonus().then(setBonus).catch(() => {});
  }, []);

  // Try Again lets people spin again, so everyone's counted spin is a prize. Work out the chance of each prize on that spin.
  const prizeSegs = wheel.filter((s) => s.kind !== 'No prize');
  const prizeTotal = prizeSegs.reduce((sum, s) => sum + (s.odds || 0), 0);
  const tryAgain = wheel.filter((s) => s.kind === 'No prize').reduce((sum, s) => sum + (s.odds || 0), 0);
  const finalOdds = new Map<string, { icon: string; chance: number }>();
  for (const s of prizeSegs) {
    const cur = finalOdds.get(s.name);
    finalOdds.set(s.name, { icon: s.icon, chance: (cur?.chance || 0) + (s.odds || 0) / (prizeTotal || 1) });
  }

  return (
    <div className={box}>
      <p><b className={h}>Sponsor.</b> {tbd(EVENT.sponsorLegalName)} ({EVENT.sponsor}).</p>
      <p><b className={h}>Eligibility.</b> {tbd(EVENT.eligibility)}</p>
      <p><b className={h}>Event period.</b> {tbd(EVENT.startDate)} to {tbd(EVENT.endDate)}.</p>
      <p><b className={h}>How to enter.</b> {EVENT.entryMethod}</p>
      <p><b className={h}>Prizes.</b> Each winning spin receives the prize shown on the wheel segment it lands on{bonus?.enabled ? `, plus a ${bonus.name} (approximate retail value ${tbd(EVENT.consoleValue)})` : ''}. Prize values are shown on the Rewards page.</p>
      <p><b className={h}>Limit.</b> Each person gets {EVENT.spinsPerPerson} counted spin{EVENT.spinsPerPerson === 1 ? '' : 's'}. A spin that lands on Try Again does not count (see below). The limit is enforced with a browser cookie and by capping counted spins and total attempts per network each day. Attempts to get around it, including automated tools or repeatedly clearing browser data, may result in disqualification.</p>
      <p><b className={h}>How prizes are decided.</b> Each spin is a random draw made on the event server. The chance of each segment on a single spin is:</p>
      <ul className="space-y-1">
        {wheel.map((s, i) => <li key={i}>{s.icon} {s.name}: {((s.odds || 0) * 100).toFixed(1)}%</li>)}
      </ul>
      <p><b className={h}>Try Again.</b> Landing on Try Again ({(tryAgain * 100).toFixed(1)}% per spin) does not use up your spin, and you spin again. Counting only the prize segments, the chance of each prize on your counted spin is:</p>
      <ul className="space-y-1">
        {Array.from(finalOdds.entries()).map(([name, v]) => <li key={name}>{v.icon} {name}: {(v.chance * 100).toFixed(1)}%</li>)}
      </ul>
      <p><b className={h}>Tracking number.</b> A winning spin produces a tracking number that is shown once on screen. Save it. Anyone who has the number can view the prize and request its claim, so keep it private. The sponsor is not responsible for numbers that are lost, shared or stolen.</p>
      <p><b className={h}>Claiming.</b> Enter the tracking number on the Track Prize page, follow the claim steps and choose how you would like to be contacted (WhatsApp, Telegram, text message or email) and give your number, username or address. Prizes must be claimed {tbd(EVENT.claimWindow)}. The sponsor may verify eligibility before delivery. Unclaimed or ineligible prizes may be forfeited. The sponsor will never ask for passwords, card or bank details.</p>
      <p><b className={h}>Fair play.</b> Attempts to tamper with the site or otherwise cheat may result in disqualification.</p>
      <p><b className={h}>Trademarks.</b> {EVENT.copyright}</p>
      <p><b className={h}>Governing law.</b> {tbd(EVENT.governingLaw)}</p>
      <p><b className={h}>Questions.</b> {tbd(EVENT.contactEmail)} or use the Contact page.</p>
    </div>
  );
}

function Privacy() {
  return (
    <div className={box}>
      <p><b className={h}>No accounts.</b> You do not create an account to play.</p>
      <p><b className={h}>What we collect.</b> A random identifier stored in a cookie on your browser (strictly necessary to enforce the spin limit), your spin result, and the tracking number created if you win. If you request a claim we collect the way you choose to be contacted (a WhatsApp or Telegram number or username, a phone number for text messages, or an email address) and, optionally, your name. Messages sent through the Contact form include your name, email and message. Your IP address is used briefly in memory to limit spins per network and is not stored with your prize.</p>
      <p><b className={h}>How we use it.</b> To run the giveaway: enforce spin limits, show your prize on the tracking page, process claims and answer your questions. The public Winners page shows only the prize, date and a partly hidden tracking number.</p>
      <p><b className={h}>Tracking numbers.</b> Your tracking number works like a key. Anyone who has it can see the prize and request its claim.</p>
      <p><b className={h}>Sharing.</b> Event data is handled by {EVENT.sponsor} and the service providers that host this site. We do not sell it.</p>
      <p><b className={h}>Retention and requests.</b> To ask for access to or deletion of your data, contact {tbd(EVENT.contactEmail)}.</p>
    </div>
  );
}

export default function Legal({ kind }: { kind: 'rules' | 'privacy' }) {
  return (
    <PageIntro eyebrow="Event information" title={kind === 'rules' ? 'OFFICIAL RULES' : 'PRIVACY POLICY'} description={`${EVENT.name}, sponsored by ${EVENT.sponsor}.`}>
      <DevWarning />
      {kind === 'rules' ? <Rules /> : <Privacy />}
    </PageIntro>
  );
}
