import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Button from '../components/Button';
import PageIntro from '../components/PageIntro';
import { api } from '../api';

const field = 'w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#7cfc00]';

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', topic: 'General question', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending'); setErr('');
    try { await api.contact(f); setState('sent'); setF({ name: '', email: '', topic: 'General question', message: '' }); }
    catch (x) { setErr((x as Error).message); setState('idle'); }
  };

  return (
    <PageIntro eyebrow="We're listening" title="CONTACT THE TEAM" description="Questions about spins, prizes or claims? Send us a message and the event team will reply by email.">
      <form onSubmit={submit} className="max-w-xl space-y-4 rounded-2xl border border-white/8 bg-[#111612] p-6">
        <input required placeholder="Your name" value={f.name} onChange={set('name')} maxLength={80} className={field} />
        <input required type="email" placeholder="Email address" value={f.email} onChange={set('email')} maxLength={120} className={field} />
        <select value={f.topic} onChange={set('topic')} className="w-full rounded-xl border border-white/10 bg-[#111612] px-4 py-3 text-sm">
          <option>General question</option>
          <option>Prize claim help</option>
          <option>Technical problem</option>
          <option>Privacy request</option>
        </select>
        <textarea required placeholder="Your message" rows={5} value={f.message} onChange={set('message')} maxLength={2000} className={field} />
        <Button>{state === 'sending' ? 'Sending...' : 'Send message'} <ArrowUpRight size={15} /></Button>
        {state === 'sent' && <p className="text-xs text-[#a5ff50]">Message sent. We'll reply to the email you provided.</p>}
        {err && <p className="text-xs text-red-300">{err}</p>}
        <p className="text-[11px] text-white/35">Never include passwords or card details in your message.</p>
      </form>
    </PageIntro>
  );
}
