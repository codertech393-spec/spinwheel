import { useCallback, useEffect, useState } from 'react';
import { LogOut, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/Button';
import PageIntro from '../../components/PageIntro';
import TrackingNumber from '../../components/TrackingNumber';
import { api, tokens, type Reward, type Winning, type WinStatus, type WheelSegment } from '../../api';
import { methodLabel, contactLink } from '../../config/contactMethods';

type Overview = Awaited<ReturnType<typeof api.adminOverview>>;
type Tab = 'winnings' | 'award' | 'rewards' | 'wheel' | 'messages';

const input = 'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#7cfc00]';
const card = 'rounded-2xl border border-white/8 bg-[#111612] p-5';
const STATUSES: WinStatus[] = ['pending', 'claim_requested', 'fulfilled', 'rejected'];

function AdminLogin({ onDone }: { onDone: () => void }) {
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await api.adminLogin(key); tokens.setAdmin(r.token); onDone(); } catch (x) { setErr((x as Error).message); }
  };
  return (
    <form onSubmit={submit} className={`${card} max-w-md`}>
      <label className="mb-2 block text-xs font-bold text-white/50">ADMIN KEY</label>
      <input type="password" value={key} onChange={(e) => setKey(e.target.value)} className={input} autoFocus />
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
      <div className="mt-4"><Button>Enter admin</Button></div>
    </form>
  );
}

function WinningsTab({ data, reload }: { data: Overview; reload: () => void }) {
  const [filter, setFilter] = useState<'all' | WinStatus>('all');
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const rows = data.winnings.filter((w) => {
    if (filter !== 'all' && w.status !== filter) return false;
    if (!needle) return true;
    const hay = [w.trackingId, w.rewardName, w.claimValue || '', w.claimName || ''].join(' ').toLowerCase();
    return hay.includes(needle) || w.trackingId.toLowerCase().replace(/-/g, '').includes(needle.replace(/-/g, ''));
  });
  const patch = async (w: Winning, body: Parameters<typeof api.adminPatchWinning>[1]) => { await api.adminPatchWinning(w.id, body); reload(); };
  const editNote = async (w: Winning) => {
    const note = window.prompt('Note shown to the winner on their tracking page:', w.note || '');
    if (note !== null) patch(w, { note });
  };
  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tracking number, prize or claim contact" className={`${input} mb-4 max-w-md`} />
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === s ? 'bg-[#7cfc00] text-black' : 'border border-white/10 text-white/50'}`}>{s.replace('_', ' ')}</button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-white/40">Nothing here.</p>}
        {rows.map((w) => (
          <div key={w.id} className={`${card} flex flex-wrap items-center gap-3`}>
            <span className="text-2xl">{w.icon}</span>
            <div className="min-w-[200px] flex-1">
              <b>{w.rewardName}</b>
              {w.bonus && <span className="ml-2 rounded-full bg-sky-300/15 px-2 py-0.5 text-[10px] font-bold text-sky-200">+ {w.bonus.name}</span>}
              <p className="font-['Orbitron'] text-[11px] tracking-wider text-[#a5ff50]">{w.trackingId}</p>
              <p className="text-[11px] text-white/35">
                {w.source} · {new Date(w.createdAt).toLocaleString()}
                {w.claimValue && (
                  <> · claim{w.claimName ? ` (${w.claimName})` : ''} via {methodLabel(w.claimMethod)}: <a href={contactLink(w.claimMethod, w.claimValue)} target="_blank" rel="noreferrer" className="text-[#a5ff50] underline">{w.claimValue}</a></>
                )}
                {w.note ? ` · note: ${w.note}` : ''}
              </p>
            </div>
            <select value={w.status} onChange={(e) => patch(w, { status: e.target.value as WinStatus })} className="rounded-lg border border-white/10 bg-[#111612] px-2 py-2 text-xs">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button title={w.public ? 'Shown on winners wall' : 'Hidden from winners wall'} onClick={() => patch(w, { public: !w.public })} className="text-white/60 hover:text-white">{w.public ? <Eye size={18} /> : <EyeOff size={18} />}</button>
            <button onClick={() => editNote(w)} className="text-xs text-white/50 underline">note</button>
            <button title="Delete" onClick={async () => { if (confirm('Delete this winning? The tracking number will stop working.')) { await api.adminDeleteWinning(w.id); reload(); } }} className="text-red-300/80 hover:text-red-300"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </>
  );
}

function AwardTab({ data, reload }: { data: Overview; reload: () => void }) {
  const [rewardId, setRewardId] = useState(data.rewards[0]?.id || '');
  const [note, setNote] = useState('');
  const [made, setMade] = useState<Winning | null>(null);
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { setMade(await api.adminAward({ rewardId, note })); setNote(''); setErr(''); reload(); } catch (x) { setErr((x as Error).message); }
  };
  return (
    <div className="max-w-xl space-y-4">
      <form onSubmit={submit} className={`${card} space-y-3`}>
        <p className="text-xs text-white/45">Creates a prize with a new tracking number, e.g. for a bonus winner. Give the number to the winner; they enter it on the Track Prize page.</p>
        <select value={rewardId} onChange={(e) => setRewardId(e.target.value)} className={input}>
          {data.rewards.map((r) => <option key={r.id} value={r.id}>{r.icon} {r.name} ({r.value})</option>)}
        </select>
        <input placeholder="Optional note for the winner" value={note} onChange={(e) => setNote(e.target.value)} className={input} />
        <Button>Create prize</Button>
        {err && <p className="text-xs text-red-300">{err}</p>}
      </form>
      {made && <TrackingNumber code={made.trackingId} prize={made.rewardName} />}
    </div>
  );
}

function RewardsTab({ data, reload }: { data: Overview; reload: () => void }) {
  const blank: Partial<Reward> = { name: '', kind: 'Gaming reward', value: '', icon: '🎁', active: true, claimInstructions: '' };
  const [edit, setEdit] = useState<Partial<Reward>>(blank);
  const [err, setErr] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.adminSaveReward(edit); setEdit(blank); setErr(''); reload(); } catch (x) { setErr((x as Error).message); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {data.rewards.map((r) => (
          <div key={r.id} className={`${card} flex items-center gap-3 ${r.active ? '' : 'opacity-50'}`}>
            <span className="text-2xl">{r.icon}</span>
            <div className="flex-1"><b>{r.name}</b><p className="text-xs text-white/40">{r.kind} · {r.value}{r.active ? '' : ' · hidden'}</p></div>
            <button onClick={() => setEdit(r)} className="text-xs underline text-white/60">edit</button>
            <button onClick={async () => { if (confirm('Delete reward?')) { await api.adminDeleteReward(r.id); reload(); } }} className="text-red-300/80"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <form onSubmit={save} className={`${card} h-fit space-y-3`}>
        <b className="font-['Orbitron'] text-sm">{edit.id ? 'EDIT REWARD' : 'NEW REWARD'}</b>
        <input placeholder="Name" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={input} required />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Kind" value={edit.kind || ''} onChange={(e) => setEdit({ ...edit, kind: e.target.value })} className={input} />
          <input placeholder="Value" value={edit.value || ''} onChange={(e) => setEdit({ ...edit, value: e.target.value })} className={input} />
        </div>
        <input placeholder="Emoji icon" value={edit.icon || ''} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} className={input} />
        <textarea rows={4} placeholder="How to claim (shown to winners). Leave blank for the default." value={edit.claimInstructions || ''} onChange={(e) => setEdit({ ...edit, claimInstructions: e.target.value })} className={input} />
        <p className="text-[11px] text-white/35">Claim steps are copied onto each prize when it is won. Changes apply to future wins; use the note on a winning for one-off messages.</p>
        <label className="flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Visible on rewards page</label>
        {err && <p className="text-xs text-red-300">{err}</p>}
        <div className="flex gap-2"><Button>Save</Button>{edit.id && <Button variant="quiet" onClick={() => setEdit(blank)}>Cancel</Button>}</div>
      </form>
    </div>
  );
}

function WheelTab({ data, reload }: { data: Overview; reload: () => void }) {
  const [rows, setRows] = useState<WheelSegment[]>(data.wheel ?? []);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);
  if (!data.wheel) {
    return <p className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-4 text-sm text-amber-100/80">The server you are connected to is still the old version and does not support the wheel editor. Restart your local server (or wait for the Render deploy to finish) and reload this page.</p>;
  }
  const total = rows.reduce((n, r) => n + (Number(r.weight) > 0 ? Number(r.weight) : 0), 0);
  const noPrizeCount = rows.filter((r) => r.kind === 'No prize').length;
  const set = (i: number, patch: Partial<WheelSegment>) => { setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))); setSaved(false); };
  const add = () => { setRows([...rows, { name: 'New prize', kind: 'Reward', value: 'Prize', color: '#234b36', icon: '🎁', weight: 5 }]); setSaved(false); };
  const remove = (i: number) => { setRows(rows.filter((_, j) => j !== i)); setSaved(false); };
  const save = async () => {
    try { await api.adminSaveWheel(rows.map((r) => ({ ...r, weight: Number(r.weight) }))); setErr(''); setSaved(true); reload(); } catch (x) { setErr((x as Error).message); setSaved(false); }
  };
  return (
    <div className="space-y-4">
      <p className="text-xs text-white/45">Chance is relative: a segment with 20 comes up twice as often as one with 10. A segment marked "Try Again" gives no prize and the visitor spins again. Between 2 and 12 segments. If a prize name matches one in the Rewards tab, winners get that reward's claim steps.</p>
      {noPrizeCount === 0 && <p className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3 text-xs text-amber-100/80">There is no "Try Again" segment, so every spin wins a prize (and a console). Make sure you can fund that.</p>}
      {rows.map((r, i) => {
        const noPrize = r.kind === 'No prize';
        const pct = total > 0 && Number(r.weight) > 0 ? ((Number(r.weight) / total) * 100).toFixed(1) : '0.0';
        return (
          <div key={i} className={`${card} grid items-center gap-2 md:grid-cols-[48px_1fr_1fr_90px_60px_90px_36px]`}>
            <input value={r.icon} onChange={(e) => set(i, { icon: e.target.value })} className={`${input} text-center text-lg`} aria-label="Emoji" />
            <input value={r.name} onChange={(e) => set(i, { name: e.target.value })} className={input} placeholder="Name on the wheel" aria-label="Name" />
            <input value={r.value} onChange={(e) => set(i, { value: e.target.value })} className={input} placeholder="Value (e.g. $10)" aria-label="Value" />
            <select value={noPrize ? 'none' : 'prize'} onChange={(e) => set(i, { kind: e.target.value === 'none' ? 'No prize' : r.kind === 'No prize' ? 'Reward' : r.kind })} className={input} aria-label="Type">
              <option value="prize">Prize</option>
              <option value="none">Try Again</option>
            </select>
            <input type="color" value={r.color} onChange={(e) => set(i, { color: e.target.value })} className="h-9 w-full rounded-lg bg-transparent" aria-label="Colour" />
            <label className="flex items-center gap-1 text-[11px] text-white/45">
              <input type="number" min={1} max={1000} value={r.weight} onChange={(e) => set(i, { weight: e.target.value as unknown as number })} className={input} aria-label="Chance" />
              <span className="w-12 shrink-0">{pct}%</span>
            </label>
            <button onClick={() => remove(i)} disabled={rows.length <= 2} className="text-red-300/80 disabled:opacity-30" aria-label="Remove segment"><Trash2 size={16} /></button>
          </div>
        );
      })}
      {err && <p className="text-xs text-red-300">{err}</p>}
      {saved && <p className="text-xs text-[#a5ff50]">Saved. The wheel on the site is updated.</p>}
      <div className="flex gap-2">
        <Button onClick={add} variant="quiet"><Plus size={15} /> Add segment</Button>
        <Button onClick={save}>Save wheel</Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(!!tokens.admin());
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>('winnings');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { setData(await api.adminOverview()); setErr(''); }
    catch (e) { if ((e as { status?: number }).status === 401) { tokens.setAdmin(null); setAuthed(false); } else setErr((e as Error).message); }
  }, []);
  useEffect(() => { if (authed) load(); }, [authed, load]);

  if (!authed) return <PageIntro eyebrow="Staff only" title="ADMIN" description="Enter the admin key to manage winners, claims and rewards."><AdminLogin onDone={() => setAuthed(true)} /></PageIntro>;

  const tabs: [Tab, string][] = [['winnings', 'Winnings'], ['award', 'Create prize'], ['rewards', 'Rewards'], ['wheel', 'Wheel'], ['messages', `Messages (${data?.messages.length ?? 0})`]];
  return (
    <PageIntro eyebrow="Staff only" title="ADMIN DASHBOARD" description="Manage winners, claim requests, rewards and messages.">
      {err && <p className="mb-4 text-sm text-red-300">{err}</p>}
      {data && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            {([['Spins', data.stats.spins], ['Winnings', data.stats.winnings], ['Claim requests', data.stats.claimRequests], ['Consoles awarded', data.stats.consoles]] as const).map(([l, v]) => (
              <div key={l} className={card}><p className="text-xs text-white/40">{l}</p><b className="font-['Orbitron'] text-2xl text-[#7cfc00]">{v}</b></div>
            ))}
          </div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-xs font-bold ${tab === k ? 'bg-[#7cfc00] text-black' : 'border border-white/10 text-white/50'}`}>{l}</button>)}
            <span className="flex-1" />
            <Button variant="quiet" onClick={() => { tokens.setAdmin(null); setAuthed(false); setData(null); }}><LogOut size={15} /> Exit admin</Button>
          </div>
          {tab === 'winnings' && <WinningsTab data={data} reload={load} />}
          {tab === 'award' && <AwardTab data={data} reload={load} />}
          {tab === 'rewards' && <RewardsTab data={data} reload={load} />}
          {tab === 'wheel' && <WheelTab data={data} reload={load} />}
          {tab === 'messages' && (
            <div className="space-y-3">
              {data.messages.length === 0 && <p className="text-sm text-white/40">No messages yet.</p>}
              {data.messages.map((m) => (
                <div key={m.id} className={card}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
                    <span><b className="text-white/80">{m.name}</b> · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a></span>
                    <span>{m.topic} · {new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageIntro>
  );
}
