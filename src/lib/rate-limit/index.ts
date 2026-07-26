import { NextResponse } from "next/server";
import { check } from "./window";

export { LIMITS, check } from "./window";
export type { RateLimitResult } from "./window";

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
