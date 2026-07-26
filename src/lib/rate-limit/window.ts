/**
 * The counting, with no framework attached.
 *
 * Split out so it can be tested directly: the module that turns a refusal into
 * an HTTP response imports `next/server`, and a plain test runner cannot
 * resolve that.
 *
 * Be clear about what this is and is not. Each serverless instance keeps its
 * own counters, so with N warm instances the real ceiling is N times the limit
 * given. That is a weak guarantee against a determined attacker and a strong
 * one against the thing that actually happens: a runaway client, a retry loop,
 * a double-clicked button, a script pointed at the API to see what it does. It
 * turns "the database falls over" into "the caller gets 429".
 *
 * A hard guarantee needs shared state — Redis, or a counter in Postgres. Redis
 * is another service to run and pay for; a Postgres counter puts write load on
 * the database this exists to protect. Neither earns its place at this size.
 * When it does, replace the map below and nothing above it changes.
 */

type Window = {
  /** Request timestamps inside the current window, oldest first. */
  hits: number[];
};

const windows = new Map<string, Window>();

/**
 * Stops the map growing without bound.
 *
 * Every key is a user id or an address, so in principle the map is bounded by
 * active callers — but a process that lives for days accumulates everyone who
 * passed through it. Swept when it gets large rather than on a timer, because
 * a serverless instance may be frozen between requests and a timer would not
 * fire.
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
    // The refused attempt is deliberately not recorded. Counting rejected
    // requests against the window would turn a retry loop into a permanent
    // lockout that never expires.
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
