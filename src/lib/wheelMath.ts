// Wheel animation math. Kept separate from the page so it is easy to tune and test.

export const SPIN_MS = 8000; // total spin time. Raise it for more suspense, lower it for a quicker spin.
export const ROTATIONS = 6; // full turns before the wheel settles

// Progress 0 -> 1 over time: a short smooth start, a fast middle, then a long slowing crawl
// so the last few segments tick past one at a time and nobody knows where it will stop.
export function ease(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  const r = Math.min(1, x / 0.1);
  const ramp = r * r * (3 - 2 * r); // smooth start over the first 10%
  return (1 - (1 - x) ** 2.6) * ramp;
}

// Which segment is under the pointer (at the top) when the wheel is rotated by `deg` clockwise.
export function segmentAt(deg: number, n: number): number {
  const angle = (((360 - (deg % 360)) % 360) + 360) % 360;
  return Math.floor(angle / (360 / n)) % n;
}

// Final rotation that lands segment `index` under the pointer after `rotations` full turns.
// `jitter` is -1..1 and moves the stopping point off-centre inside the segment so it looks natural.
export function planSpin(current: number, index: number, n: number, rotations: number, jitter: number): number {
  const slice = 360 / n;
  const desired = (((360 - (index * slice + slice / 2 + jitter * slice * 0.3)) % 360) + 360) % 360;
  const cur = ((current % 360) + 360) % 360;
  return current + rotations * 360 + ((desired - cur + 360) % 360);
}
