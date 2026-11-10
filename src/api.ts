import type { ContactMethod } from './config/contactMethods';

export type Segment = { name: string; kind: string; value: string; color: string; icon: string; odds?: number };
export type WheelSegment = { name: string; kind: string; value: string; color: string; icon: string; weight: number };
export type Reward = { id: string; name: string; kind: string; value: string; icon: string; active: boolean; claimInstructions: string };
export type WinStatus = 'pending' | 'claim_requested' | 'fulfilled' | 'rejected';

// What a winner sees when they look up a tracking number (claim email is masked by the server).
export type TrackedPrize = {
  trackingId: string; rewardName: string; kind: string; value: string; icon: string;
  claimInstructions: string; status: WinStatus; note: string; createdAt: string;
  claimRequestedAt?: string; claimMethod?: ContactMethod; claimContact?: string;
  bonus?: string; // name of the extra prize that comes with every win (the limited edition console)
};
// Admin view of a winning (full details).
export type Winning = {
  id: string; trackingId: string; rewardName: string; kind: string; value: string; icon: string;
  claimInstructions: string; source: 'spin' | 'admin'; status: WinStatus; public: boolean; note: string;
  claimName?: string; claimMethod?: ContactMethod; claimValue?: string; claimRequestedAt?: string; bonus?: { name: string }; createdAt: string;
};
export type PublicWinner = { code: string; rewardName: string; icon: string; createdAt: string; bonus?: string };
export type Bonus = { enabled: boolean; name: string };
export type ContactMessage = { id: string; name: string; email: string; topic: string; message: string; createdAt: string };
export type SpinStatus = { spinsLeft: number; limitedByNetwork: boolean; wins: TrackedPrize[] };

const ADMIN_KEY = 'spinfest-admin-token';
export const tokens = {
  admin: () => sessionStorage.getItem(ADMIN_KEY),
  setAdmin: (t: string | null) => (t ? sessionStorage.setItem(ADMIN_KEY, t) : sessionStorage.removeItem(ADMIN_KEY)),
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function request<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const res = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) throw new ApiError(data?.error || 'Something went wrong.', res.status);
  if (data === null) {
    // A 200 that isn't JSON usually means /api is not being forwarded to the server (the site's own HTML came back).
    throw new ApiError("Can't reach the Xbox 25 server. Make sure it is running and that the /api proxy is set in vite.config.ts.", 502);
  }
  return data as T;
}

const a = () => tokens.admin();

export const api = {
  wheel: () => request<Segment[]>('/wheel'),
  rewards: () => request<Reward[]>('/rewards'),
  winners: () => request<PublicWinner[]>('/winners'),
  bonus: () => request<Bonus>('/bonus'),
  spinStatus: () => request<SpinStatus>('/spin/status'),
  spin: () => request<{ index: number; segment: Segment; winning: TrackedPrize | null; spinsLeft: number }>('/spin', { method: 'POST' }),
  track: (code: string) => request<TrackedPrize>(`/track/${encodeURIComponent(code)}`),
  claim: (code: string, body: { name: string; method: ContactMethod; contact: string }) =>
    request<TrackedPrize>(`/track/${encodeURIComponent(code)}/claim`, { method: 'POST', body }),
  contact: (body: { name: string; email: string; topic: string; message: string }) => request<{ ok: boolean }>('/contact', { method: 'POST', body }),

  adminLogin: (key: string) => request<{ token: string }>('/admin/login', { method: 'POST', body: { key } }),
  adminOverview: () => request<{ winnings: Winning[]; rewards: Reward[]; wheel: WheelSegment[]; messages: ContactMessage[]; stats: { winnings: number; claimRequests: number; spins: number; consoles: number } }>('/admin/overview', { token: a() }),
  adminAward: (body: { rewardId: string; note?: string }) => request<Winning>('/admin/award', { method: 'POST', body, token: a() }),
  adminPatchWinning: (id: string, body: Partial<Pick<Winning, 'status' | 'public' | 'note' | 'claimInstructions'>>) => request<Winning>(`/admin/winnings/${id}`, { method: 'PATCH', body, token: a() }),
  adminDeleteWinning: (id: string) => request(`/admin/winnings/${id}`, { method: 'DELETE', token: a() }),
  adminSaveWheel: (wheel: WheelSegment[]) => request<WheelSegment[]>('/admin/wheel', { method: 'PUT', body: { wheel }, token: a() }),
  adminSaveReward: (r: Partial<Reward>) => (r.id
    ? request<Reward>(`/admin/rewards/${r.id}`, { method: 'PUT', body: r, token: a() })
    : request<Reward>('/admin/rewards', { method: 'POST', body: r, token: a() })),
  adminDeleteReward: (id: string) => request(`/admin/rewards/${id}`, { method: 'DELETE', token: a() }),
};
