import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import ConsoleImage from '../components/ConsoleImage';
import PageIntro from '../components/PageIntro';
import { api, type Bonus, type Reward } from '../api';

export default function Rewards() {
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [bonus, setBonus] = useState<Bonus | null>(null);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.rewards().then(setRewards).catch((e) => setErr(e.message));
    api.bonus().then(setBonus).catch(() => {});
  }, []);

  const kinds = ['All', ...Array.from(new Set((rewards || []).map((r) => r.kind)))];
  const filtered = (rewards || []).filter((r) => filter === 'All' || r.kind === filter);

  return (
    <PageIntro eyebrow="Reward vault" title="EXPLORE THE REWARDS" description="Everything on the wheel and in the prize pool. Rewards you win show up on your tracking page with claim steps.">
      {bonus?.enabled && (
        <div className="mb-8 flex flex-col items-center gap-5 rounded-2xl border border-[#7cfc00]/25 bg-gradient-to-br from-[#18251a] to-[#0d110e] p-6 sm:flex-row">
          <ConsoleImage className="h-36 w-52 shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#a5ff50]">Every winner also gets</p>
            <h2 className="mt-1 font-['Orbitron'] text-xl font-bold md:text-2xl">{bonus.name}</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Win any prize on the wheel and the limited edition console comes with it.</p>
          </div>
        </div>
      )}
      {err && <p className="text-sm text-red-300">{err}</p>}
      {!rewards && !err && <p className="text-sm text-white/40">Loading rewards...</p>}
      <div className="mb-7 flex flex-wrap gap-2">
        {kinds.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === f ? 'bg-[#7cfc00] text-black' : 'border border-white/10 text-white/50 hover:text-white'}`}>{f}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <motion.div whileHover={{ y: -4 }} key={p.id} className="rounded-2xl border border-white/8 bg-[#111612] p-6">
            <div className="flex items-start justify-between">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#7cfc00]/10 text-3xl">{p.icon}</div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/40">{p.kind}</span>
            </div>
            <h3 className="mt-5 font-['Orbitron'] text-lg font-bold">{p.name}</h3>
            <p className="mt-1 text-sm text-white/40">{p.value}</p>
            <div className="mt-5"><Button to="/spin" variant="outline">Go to the wheel <ChevronRight size={15} /></Button></div>
          </motion.div>
        ))}
      </div>
    </PageIntro>
  );
}
