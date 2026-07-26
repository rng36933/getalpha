import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Options shared by every Sentry runtime.
 *
 * The app holds entry prices, stop losses, account balances and a journal of
 * how somebody felt about their trading. An error report is allowed to say
 * what broke; it is not allowed to carry any of that with it, and the
 * scrubbing below is what enforces the difference.
 */

/** Query and body keys that must never appear in a report. */
const SENSITIVE_KEYS = [
  "entryprice",
  "exitprice",
  "stoploss",
  "takeprofit",
  "size",
  "contractsize",
  "pnl",
  "accountbalance",
  "marketcontext",
  "emotionalstate",
  "email",
  "password",
  "token",
  "secret",
  "key",
  "authorization",
  "cookie",
];

function isSensitive(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((candidate) => lower.includes(candidate));
}

/** Recursive redaction. Depth-limited, because a cycle would hang the reporter. */
function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, depth + 1));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        isSensitive(key) ? "[redacted]" : redact(entry, depth + 1),
      ]),
    );
  }

  return value;
}

/**
 * Last gate before an event leaves the process.
 *
 * Strips the request body outright rather than redacting it. A body is only
 * ever needed to reproduce a bug, and every body this app receives is either a
 * trade or a credential — neither is worth the risk of a missed key name.
 */
export function beforeSend(event: ErrorEvent): ErrorEvent | null {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;

    if (event.request.headers) {
      event.request.headers = redact(event.request.headers) as Record<
        string,
        string
      >;
    }

    // A query string can carry anything a link was built with.
    delete event.request.query_string;
  }

  if (event.extra) {
    event.extra = redact(event.extra) as Record<string, unknown>;
  }

  if (event.contexts) {
    event.contexts = redact(event.contexts) as typeof event.contexts;
  }

  return event;
}

export const sharedOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // With no DSN configured Sentry is inert, which is what local development
  // and CI should be.
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
  // IP addresses, headers and user details are off. The Clerk id is attached
  // deliberately where it helps, and nothing else identifies anyone.
  sendDefaultPii: false,
  // Errors only. Performance tracing would sample URLs and payloads from every
  // request, which is a much wider surface than the thing being asked for.
  tracesSampleRate: 0,
  beforeSend,
};
