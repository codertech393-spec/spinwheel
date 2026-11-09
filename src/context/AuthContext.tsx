import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokens, type User, type Winning } from '../api';

type AuthState = {
  user: User | null;
  winnings: Winning[];
  loading: boolean;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setSpinsLeft: (n: number) => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [winnings, setWinnings] = useState<Winning[]>([]);
  const [loading, setLoading] = useState(!!tokens.user());

  const refresh = useCallback(async () => {
    if (!tokens.user()) { setUser(null); setWinnings([]); setLoading(false); return; }
    try {
      const d = await api.me();
      setUser(d.user);
      setWinnings(d.winnings);
    } catch {
      tokens.setUser(null); // expired / invalid token
      setUser(null); setWinnings([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const verify = async (email: string, code: string) => {
    const d = await api.verifyCode(email, code);
    tokens.setUser(d.token);
    await refresh();
  };
  const logout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    tokens.setUser(null);
    setUser(null); setWinnings([]);
  };
  const setSpinsLeft = (n: number) => setUser((u) => (u ? { ...u, spinsLeft: n } : u));

  return <Ctx.Provider value={{ user, winnings, loading, verify, logout, refresh, setSpinsLeft }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside <AuthProvider>');
  return c;
}
