import { motion } from 'framer-motion';
import { Gift, Trophy, Zap, ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import Eyebrow from '../components/Eyebrow';
import { EVENT } from '../config/event';

const highlights = [
  ['🎡', 'Spin the wheel', 'Take your spin on the event wheel. Win, and you get a tracking number to claim your prize.'],
  ['🎁', 'Explore the rewards', 'Browse the gaming-themed prizes up for grabs.'],
  ['🏆', 'Meet the winners', 'See who has won recently.'],
];

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute -right-20 top-10 h-[550px] w-[550px] rounded-full bg-[#7cfc00]/6 blur-[110px]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Eyebrow>Celebrating 25 years of gaming</Eyebrow>
            <h1 className="max-w-3xl font-['Orbitron'] text-4xl font-extrabold leading-[1.18] tracking-tight md:text-6xl">
              25 YEARS OF GAMING.<br /><span className="text-[#7cfc00]">ONE EPIC SPIN.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/55 md:text-lg">Join the celebration. Explore the rewards, take a spin, and level up the fun in our anniversary-themed gaming experience.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/spin">Spin & Win <ArrowUpRight size={17} /></Button>
              <Button to="/rewards" variant="outline">Explore rewards</Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-8 border-t border-white/10 pt-6">
              <div><b className="font-['Orbitron'] text-2xl text-white">25<span className="text-[#7cfc00]">+</span></b><small className="mt-1 block text-xs text-white/40">Years of gaming</small></div>
              <div><b className="font-['Orbitron'] text-2xl text-white">8</b><small className="mt-1 block text-xs text-white/40">Wheel outcomes</small></div>
              <div><b className="font-['Orbitron'] text-2xl text-white">∞</b><small className="mt-1 block text-xs text-white/40">Celebration energy</small></div>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute inset-8 rounded-full bg-[#7cfc00]/10 blur-3xl" />
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 1, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative rounded-[2rem] border border-[#7cfc00]/20 bg-gradient-to-br from-[#18251a] via-[#101510] to-[#090c09] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-[.2em] text-[#7cfc00]">ANNIVERSARY DROP</span>
                <span className="rounded-full bg-[#7cfc00]/10 px-3 py-1 text-[10px] text-[#a5ff50]">{EVENT.sponsorBadge}</span>
              </div>
              <div className="my-8 grid grid-cols-2 gap-3">
                <div className="col-span-2 rounded-2xl border border-white/8 bg-black/30 p-5">
                  <span className="text-5xl">🎮</span>
                  <p className="mt-4 font-['Orbitron'] text-xl font-bold">PLAY. SPIN. CELEBRATE.</p>
                  <p className="mt-2 text-xs text-white/45">A new chapter in the gaming universe.</p>
                </div>
                <div className="rounded-2xl bg-[#7cfc00] p-4 text-black"><Gift size={20} /><b className="mt-4 block text-xl">Rewards</b><small className="text-black/60">Game-inspired prizes</small></div>
                <div className="rounded-2xl border border-white/10 bg-white/4 p-4"><Trophy size={20} className="text-[#a5ff50]" /><b className="mt-4 block text-xl">Winners</b><small className="text-white/45">Community showcase</small></div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/40">
                <span>READY PLAYER ONE?</span>
                <span className="flex items-center gap-1 text-[#7cfc00]"><Zap size={12} /> LET'S GO</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0d110e]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>Event highlights</Eyebrow>
              <h2 className="font-['Orbitron'] text-2xl font-bold md:text-3xl">THE CELEBRATION STARTS HERE</h2>
            </div>
            <Button to="/how-it-works" variant="quiet">How it works <ChevronRight size={16} /></Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {highlights.map(([emoji, title, desc]) => (
              <motion.div whileHover={{ y: -4 }} key={title} className="rounded-2xl border border-white/8 bg-[#111612] p-6">
                <span className="text-3xl">{emoji}</span>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 text-center md:px-8">
        <Eyebrow>Ready to play?</Eyebrow>
        <h2 className="font-['Orbitron'] text-3xl font-extrabold">YOUR NEXT SPIN IS WAITING</h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/50">Everyone gets a spin, no account needed. Win, and you get a tracking number to claim your prize.</p>
        <div className="mt-7"><Button to="/spin">Launch the wheel <Sparkles size={16} /></Button></div>
      </section>
    </>
  );
}
