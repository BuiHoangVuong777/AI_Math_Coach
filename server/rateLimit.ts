/** Minimal fixed-window rate limiter (in memory; single process). */
export interface RateLimiter {
  /** Returns 0 when allowed, otherwise seconds until the window resets. */
  take(key: string, now?: number): number;
}

export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    take(key, now = Date.now()) {
      let w = windows.get(key);
      if (!w || now - w.start >= windowMs) {
        w = { start: now, count: 0 };
        windows.set(key, w);
        // Opportunistic cleanup so the map cannot grow without bound.
        if (windows.size > 10_000) {
          for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k);
        }
      }
      if (w.count >= max) return Math.ceil((w.start + windowMs - now) / 1000);
      w.count += 1;
      return 0;
    },
  };
}
