import { useState } from 'react';
import { Mail } from 'lucide-react';
import Button from './Button';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const field = 'w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#7cfc00]';

export default function SignIn() {
  const { verify } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [needsUsername, setNeedsUsername] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api.requestCode(email.trim(), needsUsername ? username.trim() : undefined);
      if (r.needsUsername) setNeedsUsername(true);
      else setStep('code');
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await verify(email.trim().toLowerCase(), code.trim()); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl rounded-2xl border border-white/8 bg-[#111612] p-6">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#7cfc00] text-black"><Mail size={28} /></div>
      {step === 'email' ? (
        <form onSubmit={sendCode}>
          <label className="mb-2 block text-xs font-bold text-white/50">EMAIL</label>
          <input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setNeedsUsername(false); }} placeholder="you@example.com" maxLength={120} autoFocus className={field} />
          {needsUsername && (
            <>
              <p className="mt-4 text-xs text-[#a5ff50]">Looks like you're new. Pick a username for your profile.</p>
              <label className="mb-2 mt-3 block text-xs font-bold text-white/50">USERNAME</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. PixelPilot" maxLength={24} className={field} />
              <p className="mt-2 text-xs text-white/40">3-24 letters, numbers or underscores. Your username appears on the winners wall if you win.</p>
            </>
          )}
          <p className="mt-3 text-xs text-white/40">We'll email you a 6-digit code. No password needed.</p>
          {err && <p className="mt-3 text-xs text-red-300">{err}</p>}
          <div className="mt-5"><Button>{busy ? 'Sending...' : needsUsername ? 'Create profile & send code' : 'Email me a code'}</Button></div>
        </form>
      ) : (
        <form onSubmit={submitCode}>
          <p className="mb-4 text-sm text-white/60">We sent a code to <b className="text-white">{email}</b>. It expires in 10 minutes.</p>
          <label className="mb-2 block text-xs font-bold text-white/50">6-DIGIT CODE</label>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456" className={`${field} font-['Orbitron'] tracking-[.4em]`} />
          {err && <p className="mt-3 text-xs text-red-300">{err}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button>{busy ? 'Checking...' : 'Sign in'}</Button>
            <button type="button" onClick={() => sendCode()} className="text-xs text-white/50 underline">Resend code</button>
            <button type="button" onClick={() => { setStep('email'); setCode(''); setErr(''); }} className="text-xs text-white/50 underline">Use a different email</button>
          </div>
        </form>
      )}
    </div>
  );
}
