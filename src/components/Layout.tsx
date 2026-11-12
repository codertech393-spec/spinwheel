import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search } from 'lucide-react';
import { EVENT } from '../config/event';
import xLogo from '../images/xbox-white-logo.png'

const links: [string, string][] = [
  ['Home', '/'],
  ['Spin & Win', '/spin'],
  ['Rewards', '/rewards'],
  ['Winners', '/winners'],
  ['How it works', '/how-it-works'],
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();
  useEffect(() => setMobile(false), [loc.pathname]);

  return (
    <div className="min-h-screen bg-[#080b09] text-[#f3f5f3]">
      <div className="h-1 bg-gradient-to-r from-[#164b27] via-[#7cfc00] to-[#164b27]" />
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#080b09]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-1">
            <span className="grid h-14 w-14 place-items-center text-black"><img src={xLogo} alt="Xbox Logo" /></span>
            <span>
              <b className="font-['Orbitron'] text-lg tracking-tight">XBOX <span className="text-[#7cfc00]">25</span></b>
              <small className="block text-[9px] font-bold tracking-[.25em] text-white/45">GAMING CELEBRATION</small>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/8 text-[#7cfc00]' : 'text-white/60 hover:text-white'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:flex">
            <Link to="/track" className="flex items-center gap-2 rounded-full border border-[#7cfc00]/30 bg-[#7cfc00]/8 px-4 py-2 text-sm font-bold text-[#a5ff50]">
              <Search size={16} /> Track my prize
            </Link>
          </div>
          <button className="lg:hidden" aria-label="Toggle navigation" onClick={() => setMobile(!mobile)}>
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {mobile && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10 px-5 pb-4 lg:hidden"
            >
              {links.map(([label, path]) => (
                <NavLink key={path} to={path} className="block rounded-lg px-3 py-3 text-sm text-white/75">{label}</NavLink>
              ))}
              <Link to="/track" className="block px-3 py-3 text-[#7cfc00]">Track my prize</Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/8 bg-[#060806]">
        <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row">
            <div>
              <b className="font-['Orbitron'] tracking-tight">XBOX <span className="text-[#7cfc00]">25</span></b>
              <p className="mt-2 max-w-md text-xs leading-6 text-white/40">{EVENT.footerBlurb}</p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-white/45">
              <Link to="/official-rules">Official rules</Link>
              <Link to="/faq">FAQ</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-white/8 pt-5 text-[10px] text-white/30">{EVENT.copyright}</div>
        </div>
      </footer>
    </div>
  );
}
