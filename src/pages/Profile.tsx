import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, LogOut, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import PageIntro from '../components/PageIntro';
import SignIn from '../components/SignIn';
import { useAuth } from '../context/AuthContext';
import { api, type Winning, type WinStatus } from '../api';

const statusLabel: Record<WinStatus, { text: string; cls: string }> = {
  pending: { text: 'Ready to claim', cls: 'bg-[#7cfc00]/15 text-[#a5ff50]' },
  claim_requested: { text: 'Claim requested', cls: 'bg-amber-300/15 text-amber-200' },
  fulfilled: { text: 'Delivered', cls: 'bg-sky-300/15 text-sky-200' },
  rejected: { text: 'Not approved', cls: 'bg-red-400/15 text-red-300' },
};

function WinningCard({ w }: { w: Winning }) {
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const s = statusLabel[w.status];

  const claim = async () => {
    setBusy(true); setErr('');
    try { await api.claim(w.id); await refresh(); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111612] p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#7cfc00]/10 text-3xl">{w.icon}</div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-['Orbitron'] text-lg font-bold">{w.rewardName}</h3>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${s.cls}`}>{s.text}</span>
          </div>
          <p className="mt-1 text-xs text-white/40">{w.kind} · {w.value} · won {new Date(w.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/8 bg-black/25 p-4 text-xs leading-6 text-white/55">
        <b className="mb-1 block text-white/70">How to claim</b>
        {w.claimInstructions}
        {w.note && <p className="mt-2 text-amber-100/70">Note from the team: {w.note}</p>}
      </div>
      {w.status === 'pending' && <div className="mt-4"><Button onClick={claim}>{busy ? 'Requesting...' : 'Request claim'}</Button></div>}
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
    </div>
  );
}

export default function Profile() {
  const { user, winnings, loading, logout } = useAuth();

  if (loading) return <PageIntro eyebrow="Player hub" title="MY PROFILE" description="Loading your profile..."><></></PageIntro>;
  if (!user) {
    return <PageIntro eyebrow="Player hub" title="SIGN IN" description="Sign in with your email to see your spins and winnings."><SignIn /></PageIntro>;
  }

  return (
    <PageIntro eyebrow="Player hub" title={`HI, ${user.username.toUpperCase()}`} description="Your spins, your winnings, and how to claim them.">
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-white/8 bg-[#111612] p-5">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#7cfc00] text-black"><UserRound size={22} /></div>
        <div className="flex-1">
          <b>{user.username}</b>
          <p className="text-xs text-white/40">{user.email ? `${user.email} · ` : ''}{user.spinsLeft} spin{user.spinsLeft === 1 ? '' : 's'} left</p>
        </div>
        <Button to="/spin" variant="outline">Go spin <Sparkles size={15} /></Button>
        <Button onClick={logout} variant="quiet"><LogOut size={15} /> Sign out</Button>
      </div>

      <h2 className="mb-4 font-['Orbitron'] text-lg font-bold">MY WINNINGS</h2>
      {winnings.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-black/20 p-8 text-center text-sm text-white/45">
          No winnings yet. <Link to="/spin" className="text-[#7cfc00]">Take a spin</Link>.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{winnings.map((w) => <WinningCard key={w.id} w={w} />)}</div>
      )}
    </PageIntro>
  );
}
