import { NextResponse } from "next/server";

/**
 * A per-process sliding-window limiter.
 *
 * Be clear about what this is and is not. Each serverless instance keeps its
 * own counters, so with N warm instances the real ceiling is N times the limit
 * below. That is a weak guarantee against a determined attacker and a strong
 * one against the thing that actually happens: a runaway client, a retry loop,
 * a double-clicked button, a script someone points at the API to see what it
 * does. It turns "the database falls over" into "the database is fine and the
 * caller gets 429".
 *
 * A hard guarantee needs shared state — Redis, or a counter in Postgres. Redis
 * is another service to run and pay for; a Postgres counter puts write load on
 * the database this exists to protect. Neither earns its place at this size.
 * When it does, replace the map behind `check` and nothing above it changes.
 */

type Window = {
  /** Request timestamps inside the current window, oldest first. */
  hits: number[];
};

const windows = new Map<string, Window>();

/**
 * Stops the map growing without bound.
 *
 * Every key is a user id, so the map is bounded by active users in principle —
 * but a process that lives for days accumulates every user who passed through
 * it, and a signed-out attacker's keys are unbounded. Swept whenever it gets
 * large rather than on a timer, because a serverless instance may be frozen
 * between requests and a timer would not fire.
 */
const MAX_KEYS = 10_000;

function sweep(now: number): void {
  for (const [key, window] of windows) {
    const newest = window.hits[window.hits.length - 1];
    // An hour with no traffic under this key means nothing is being limited.
    if (newest === undefined || now - newest > 60 * 60 * 1000) {
      windows.delete(key);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Seconds until the oldest request falls out of the window. */
  retryAfterSeconds: number;
};

export function check(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  if (windows.size > MAX_KEYS) sweep(now);

  const window = windows.get(key) ?? { hits: [] };
  const cutoff = now - windowMs;

  // Sliding, not fixed: a fixed window lets someone spend the whole allowance
  // at the end of one window and again at the start of the next.
  const hits = window.hits.filter((at) => at > cutoff);

  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    windows.set(key, { hits });

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  windows.set(key, { hits });

  return {
    allowed: true,
    remaining: limit - hits.length,
    retryAfterSeconds: 0,
  };
}

/** Sensible ceilings per kind of route. Generous for a person, tight for a loop. */
export const LIMITS = {
  /** Writes that create rows. */
  write: { limit: 30, windowMs: 60_000 },
  /** Reads that run a query per keystroke, such as instrument search. */
  search: { limit: 60, windowMs: 60_000 },
  /** Calls that spend money at the model provider. */
  ai: { limit: 10, windowMs: 60_000 },
} as const;

/**
 * Returns null when the caller may proceed, or the 429 to send back.
 *
 * Shaped like `requirePaidAccess` so a route reads as a pair of early returns
 * rather than nested conditionals.
 */
export function enforceRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): NextResponse | null {
  const result = check(key, limit, windowMs);
  if (result.allowed) return null;

  return NextResponse.json(
    {
      error: "Too many requests. Slow down and try again shortly.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: { "retry-after": String(result.retryAfterSeconds) },
    },
  );
}
