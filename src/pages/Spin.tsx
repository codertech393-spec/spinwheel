import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, Volume2, VolumeX } from 'lucide-react';
import Button from '../components/Button';
import Eyebrow from '../components/Eyebrow';
import TrackingNumber from '../components/TrackingNumber';
import ConsoleImage from '../components/ConsoleImage';
import { api, type Segment, type TrackedPrize } from '../api';
import { SPIN_MS, ROTATIONS, ease, planSpin, segmentAt } from '../lib/wheelMath';

type Status = { spinsLeft: number; limitedByNetwork: boolean };
type SpinResult = Awaited<ReturnType<typeof api.spin>>;

const REVEAL_DELAY = 900; // the wheel stops, everyone holds their breath, then the result appears
const phaseFor = (t: number) => (t < 0.2 ? 'Spinning...' : t < 0.55 ? 'Round and round...' : t < 0.85 ? 'Slowing down...' : 'Here it comes...');

export default function Spin() {
  const [wheel, setWheel] = useState<Segment[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [wins, setWins] = useState<TrackedPrize[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [phase, setPhase] = useState('Spinning...');
  const [result, setResult] = useState<Segment | null>(null);
  const [err, setErr] = useState('');
  const [sound, setSound] = useState(true);

  const wheelRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const soundRef = useRef(true);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    api.wheel().then(setWheel).catch((e) => setErr(e.message));
    api.spinStatus()
      .then((s) => { setStatus({ spinsLeft: s.spinsLeft, limitedByNetwork: s.limitedByNetwork }); setWins(s.wins); })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  const n = wheel.length || 8;
  const slice = 360 / n;

  // little "tick" each time a segment passes the pointer
  const tickSound = () => {
    const ctx = audioRef.current;
    if (!soundRef.current || !ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 820;
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch { /* sound is optional */ }
  };

  // the pointer flicks back each time it is knocked by a segment
  const flick = () => {
    pointerRef.current?.animate([{ transform: 'rotate(-16deg)' }, { transform: 'rotate(0deg)' }], { duration: 110, easing: 'ease-out' });
  };

  const animateTo = (r: SpinResult) => {
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 2500 : SPIN_MS;
    const from = rotRef.current;
    const to = planSpin(from, r.index, n, reduced ? 2 : ROTATIONS, Math.random() * 2 - 1);
    const startedAt = performance.now();
    let lastSeg = segmentAt(from, n);
    let lastPhase = '';

    const frame = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const deg = from + (to - from) * ease(t);
      rotRef.current = deg;
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${deg}deg)`;

      const seg = segmentAt(deg, n);
      if (seg !== lastSeg) { lastSeg = seg; tickSound(); flick(); }
      const p = phaseFor(t);
      if (p !== lastPhase) { lastPhase = p; setPhase(p); }

      if (t < 1) { rafRef.current = requestAnimationFrame(frame); return; }
      rafRef.current = null;
      timerRef.current = window.setTimeout(() => {
        setSpinning(false);
        setResult(r.segment);
        if (r.winning) setWins((w) => [...w, r.winning as TrackedPrize]);
        setStatus((s) => ({ spinsLeft: r.spinsLeft, limitedByNetwork: s?.limitedByNetwork ?? false }));
      }, reduced ? 300 : REVEAL_DELAY);
    };
    rafRef.current = requestAnimationFrame(frame);
  };

  const spin = async () => {
    if (spinning || !status || status.spinsLeft <= 0 || !wheel.length) return;
    setSpinning(true); setResult(null); setErr(''); setPhase('Spinning...');
    try { // audio can only start from a user action, so prepare it right on the click
      if (soundRef.current) {
        if (!audioRef.current) audioRef.current = new AudioContext();
        audioRef.current.resume().catch(() => {});
      }
    } catch { /* sound is optional */ }
    try {
      animateTo(await api.spin()); // the server picks the result; the wheel is told where to land
    } catch (e) {
      setSpinning(false);
      setErr((e as Error).message);
      api.spinStatus().then((s) => setStatus({ spinsLeft: s.spinsLeft, limitedByNetwork: s.limitedByNetwork })).catch(() => {});
    }
  };

  const left = status?.spinsLeft ?? 0;
  const label = spinning ? phase : !status ? 'Loading...' : left > 0 ? (result?.kind === 'No prize' ? 'SPIN AGAIN' : 'SPIN THE WHEEL') : 'Spin used';
  const subtext = !status
    ? ''
    : left > 0
    ? (result?.kind === 'No prize' ? 'That one did not count. Spin again!' : `${left} spin${left === 1 ? '' : 's'} remaining`)
    : status.limitedByNetwork
    ? 'Too many spins from your network today. Please try again tomorrow.'
    : 'You have used your spin.';

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <div className="text-center">
        <Eyebrow>Event wheel</Eyebrow>
        <h1 className="font-['Orbitron'] text-3xl font-extrabold md:text-5xl">SPIN <span className="text-[#7cfc00]">&</span> WIN</h1>
        <p className="mt-4 text-sm text-white/50">Everyone gets a spin. No account needed. Win a prize and you get a tracking number to claim it.</p>
      </div>
      <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_340px]">
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 text-[#7cfc00] drop-shadow-[0_0_12px_#7cfc00]">
            <div ref={pointerRef} style={{ transformOrigin: '50% 15%' }}>
              <svg width="36" height="45" viewBox="0 0 36 45"><path d="M18 44 L2 2 Q18 12 34 2 Z" fill="#7cfc00" stroke="#071007" strokeWidth="3" /></svg>
            </div>
          </div>
          <div
            ref={wheelRef}
            style={{ willChange: 'transform' }}
            className={`relative aspect-square rounded-full border-[10px] border-[#28342a] transition-shadow duration-700 ${spinning ? 'shadow-[0_0_0_2px_#7cfc00,0_0_100px_#7cfc0050]' : 'shadow-[0_0_0_2px_#7cfc00,0_0_60px_#7cfc0025]'}`}
          >
            <svg viewBox="0 0 400 400" className="h-full w-full">
              {wheel.map((p, i) => {
                const start = i * slice - 90;
                const end = start + slice;
                const point = (ang: number) => [200 + 190 * Math.cos((ang * Math.PI) / 180), 200 + 190 * Math.sin((ang * Math.PI) / 180)];
                const [x1, y1] = point(start);
                const [x2, y2] = point(end);
                const mid = start + slice / 2;
                const [tx, ty] = point(mid);
                const lx = 200 + 125 * Math.cos((mid * Math.PI) / 180);
                const ly = 200 + 125 * Math.sin((mid * Math.PI) / 180);
                const fill = i % 2 === 0 ? '#071007' : '#f2fff2';
                return (
                  <g key={i}>
                    <path d={`M200 200 L${x1} ${y1} A190 190 0 0 1 ${x2} ${y2} Z`} fill={p.color} stroke="#080b09" strokeWidth="2" />
                    <text x={tx} y={ty} fill={fill} fontSize="14" fontWeight="800" textAnchor="middle" transform={`rotate(${mid + 90},${tx},${ty})`}>{p.icon}</text>
                    <text x={lx} y={ly} fill={fill} fontSize="11" fontWeight="800" textAnchor="middle" transform={`rotate(${mid + 90},${lx},${ly})`}>{p.name}</text>
                  </g>
                );
              })}
              <circle cx="200" cy="200" r="43" fill="#080b09" stroke="#7cfc00" strokeWidth="4" />
              <text x="200" y="199" textAnchor="middle" fill="#7cfc00" fontSize="17" fontWeight="900">XBOX</text>
              <text x="200" y="214" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">25 YEARS</text>
            </svg>
          </div>
          <div className="mt-7 text-center">
            <Button onClick={spin}>{label} <Sparkles size={16} /></Button>
            <p className="mt-3 text-xs text-white/35">{subtext}</p>
            {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
            <button
              onClick={() => { soundRef.current = !sound; setSound(!sound); }}
              aria-label={sound ? 'Mute spin sounds' : 'Unmute spin sounds'}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70"
            >
              {sound ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound {sound ? 'on' : 'off'}
            </button>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/8 bg-[#111612] p-6">
          <h2 className="font-['Orbitron'] font-bold">YOUR SPIN</h2>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="my-6 rounded-2xl border border-[#7cfc00]/25 bg-[#7cfc00]/7 p-5 text-center">
                <div className="text-4xl">{result.icon}</div>
                <p className="mt-3 text-xs uppercase tracking-widest text-white/40">Wheel landed on</p>
                <h3 className="mt-1 font-['Orbitron'] text-xl font-bold text-[#a5ff50]">{result.name}</h3>
                <p className="mt-2 text-xs text-white/55">{result.kind === 'No prize' ? 'Try Again! That spin did not count, so spin the wheel once more.' : 'You won! Save your tracking number below.'}</p>
                {result.kind !== 'No prize' && wins[wins.length - 1]?.bonus && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <ConsoleImage className="mx-auto h-24 w-full" />
                    <p className="mt-2 text-xs font-bold text-[#a5ff50]">+ {wins[wins.length - 1].bonus}</p>
                    <p className="text-[11px] text-white/45">included with every win</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div key="idle" className="my-6 rounded-2xl border border-white/8 bg-black/20 p-8 text-center">
                <Sparkles className="mx-auto text-[#7cfc00]" size={30} />
                <p className="mt-3 text-sm text-white/45">{spinning ? 'Fingers crossed...' : status && left === 0 ? 'Your spin has been used.' : 'Your result will appear here after the spin.'}</p>
              </div>
            )}
          </AnimatePresence>

          {wins.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold">YOUR TRACKING NUMBER{wins.length > 1 ? 'S' : ''}</h3>
              {wins.map((w) => (
                <div key={w.trackingId}>
                  <TrackingNumber code={w.trackingId} prize={w.rewardName} />
                  <p className="mt-2 text-center text-xs text-white/55">{w.icon} {w.rewardName}{w.bonus ? ` + ${w.bonus}` : ''} · <Link to={`/track/${w.trackingId}`} className="text-[#7cfc00] underline">see how to claim</Link></p>
                </div>
              ))}
              <p className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-[11px] leading-5 text-amber-100/75">
                Save this number now. It is the only way to claim your prize, and anyone who has it can claim it, so keep it private.
              </p>
            </div>
          )}

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
            <Search size={13} /> Already won? <Link to="/track" className="text-[#7cfc00] underline">Track your prize</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
