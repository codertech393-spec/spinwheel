import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import PageIntro from '../components/PageIntro';
import { api, type PublicWinner } from '../api';

export default function Winners() {
  const [list, setList] = useState<PublicWinner[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.winners().then(setList).catch((e) => setErr(e.message)); }, []);

  return (
    <PageIntro eyebrow="Community spotlight" title="WINNER'S WALL" description="Recent prize wins, newest first. Winners are shown by partly hidden tracking number only.">
      {err && <p className="text-sm text-red-300">{err}</p>}
      {list && list.length === 0 && <p className="text-sm text-white/45">No winners yet. Be the first to spin.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {(list || []).map((w, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#111612] p-5">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#7cfc00]/10 text-2xl">{w.icon}</div>
            <div className="flex-1">
              <b>{w.rewardName}</b>
              {w.bonus && <p className="mt-0.5 text-[11px] text-[#a5ff50]">+ {w.bonus}</p>}
              <p className="mt-1 font-['Orbitron'] text-[11px] tracking-wider text-white/45">{w.code}</p>
              <p className="mt-1 text-[11px] text-white/35">{new Date(w.createdAt).toLocaleDateString()}</p>
            </div>
            <Trophy className={i === 0 ? 'text-[#ffd700]' : 'text-[#7cfc00]'} size={20} />
          </div>
        ))}
      </div>
    </PageIntro>
  );
}
