import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Button from '../components/Button';
import PageIntro from '../components/PageIntro';
import limitedConsole from '../images/limited-console.jpg';
import { api, type TrackedPrize, type WinStatus } from '../api';
import { CONTACT_METHODS, methodLabel, type ContactMethod } from '../config/contactMethods';

const statusLabel: Record<WinStatus, { text: string; cls: string }> = {
  pending: { text: 'Ready to claim', cls: 'bg-[#7cfc00]/15 text-[#a5ff50]' },
  claim_requested: { text: 'Claim requested', cls: 'bg-amber-300/15 text-amber-200' },
  fulfilled: { text: 'Delivered', cls: 'bg-sky-300/15 text-sky-200' },
  rejected: { text: 'Not approved', cls: 'bg-red-400/15 text-red-300' },
};

const field = 'w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#7cfc00]';

function ClaimForm({ code, onDone }: { code: string; onDone: (p: TrackedPrize) => void }) {
  const [name, setName] = useState('');
  const [method, setMethod] = useState<ContactMethod>('whatsapp');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const m = CONTACT_METHODS.find((x) => x.id === method) || CONTACT_METHODS[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { onDone(await api.claim(code, { name, method, contact })); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-white/8 bg-black/25 p-4">
      <b className="block text-xs text-white/70">Request your claim</b>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" maxLength={80} className={field} />

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/45">Preferred way to be contacted</p>
        <div className="flex flex-wrap gap-2">
          {CONTACT_METHODS.map((x) => (
            <button
              type="button"
              key={x.id}
              onClick={() => { setMethod(x.id); setContact(''); setErr(''); }}
              className={`rounded-full px-4 py-2 text-xs font-bold ${method === x.id ? 'bg-[#7cfc00] text-black' : 'border border-white/10 text-white/55 hover:text-white'}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <input required type={m.type} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={m.placeholder} aria-label={m.field} maxLength={120} className={field} />
        <p className="mt-1.5 text-[11px] text-white/40">{m.field}. {m.hint}</p>
      </div>

      {err && <p className="text-xs text-red-300">{err}</p>}
      <Button>{busy ? 'Requesting...' : 'Request claim'}</Button>
    </form>
  );
}

export default function Track() {
  const { code } = useParams();
  const nav = useNavigate();
  const [input, setInput] = useState(code || '');
  const [prize, setPrize] = useState<TrackedPrize | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setErr(''); setPrize(null);
    if (!code) return;
    setInput(code);
    setLoading(true);
    api.track(code).then(setPrize).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [code]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (v) nav(`/track/${encodeURIComponent(v)}`);
  };

  const s = prize ? statusLabel[prize.status] : null;

  return (
    <PageIntro eyebrow="Prize tracker" title="TRACK YOUR PRIZE" description="Enter the tracking number you received when you won to see your prize and how to claim it.">
      <form onSubmit={submit} className="mb-8 flex max-w-xl flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="XB25-XXXX-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          className={`${field} font-['Orbitron'] tracking-wider uppercase`}
        />
        <Button>Find my prize <Search size={16} /></Button>
      </form>

      {loading && <p className="text-sm text-white/45">Looking up your prize...</p>}
      {err && <p className="max-w-xl rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{err}</p>}

      {prize && s && (
        <div className="max-w-2xl rounded-2xl border border-white/8 bg-[#111612] p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#7cfc00]/10 text-4xl">{prize.icon}</div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-['Orbitron'] text-xl font-bold">{prize.rewardName}</h2>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${s.cls}`}>{s.text}</span>
              </div>
              <p className="mt-1 text-xs text-white/40">{prize.kind} · {prize.value} · won {new Date(prize.createdAt).toLocaleDateString()}</p>
              <p className="mt-1 font-['Orbitron'] text-xs tracking-wider text-[#a5ff50]">{prize.trackingId}</p>
            </div>
          </div>

          {prize.bonus && (
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-[#7cfc00]/25 bg-[#7cfc00]/6 p-4">
              <img src={limitedConsole} alt="Limited Edition Console" className="h-28 w-40 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Also included with your win</p>
                <p className="mt-1 font-['Orbitron'] text-sm font-bold text-[#a5ff50]">{prize.bonus}</p>
              </div>
            </div>
          )}

          <div className="mt-5 rounded-xl border border-white/8 bg-black/25 p-4 text-xs leading-6 text-white/55">
            <b className="mb-1 block text-white/70">How to claim</b>
            {prize.claimInstructions}
            {prize.note && <p className="mt-2 text-amber-100/70">Note from the team: {prize.note}</p>}
          </div>

          {prize.status === 'pending' && <ClaimForm code={prize.trackingId} onDone={setPrize} />}
          {prize.status === 'claim_requested' && (
            <p className="mt-4 text-sm text-white/60">
              We received your claim request{prize.claimRequestedAt ? ` on ${new Date(prize.claimRequestedAt).toLocaleDateString()}` : ''}. The team will contact you via {methodLabel(prize.claimMethod)}{prize.claimContact ? ` at ${prize.claimContact}` : ''}. Check back on this page for updates.
            </p>
          )}
          {prize.status === 'fulfilled' && <p className="mt-4 text-sm text-sky-200/80">This prize has been delivered. Enjoy!</p>}
          {prize.status === 'rejected' && <p className="mt-4 text-sm text-red-200/80">This claim wasn't approved. See the note above or contact the team.</p>}
        </div>
      )}
    </PageIntro>
  );
}
