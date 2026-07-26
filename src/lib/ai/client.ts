import Anthropic from "@anthropic-ai/sdk";

/**
 * Model used for every AI feature.
 *
 * Overridable by environment so a deprecated model can be swapped in the
 * Vercel dashboard instead of in a deploy — providers retire versions on their
 * own schedule, and the paid features stop working the day one goes. An
 * unknown model is billed at the most expensive known rate rather than at
 * zero, so an override cannot quietly blind the spending cap.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/**
 * Server-side fallback: if Claude's safety classifiers decline a request,
 * the API re-runs it on the recommended fallback model inside the same call
 * instead of handing us a refusal. Routed by refusal category.
 */
export const AI_BETAS = ["server-side-fallback-2026-07-01"] as const;

/** Thrown when the app is missing its Anthropic credentials. */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

let client: Anthropic | null = null;

/**
 * Lazily constructed so that a missing key fails on the first AI request
 * rather than at build time or on unrelated routes.
 */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiConfigError("ANTHROPIC_API_KEY is not set");
  }

  client ??= new Anthropic();
  return client;
}

/**
 * JSON.stringify with sorted object keys.
 *
 * Prompt caching is a prefix match, so the same input data must serialise to
 * the same bytes every time. Plain JSON.stringify preserves insertion order,
 * which varies between callers and silently destroys the cache hit rate.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value), null, 2);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, sortKeys(entry)]),
    );
  }

  return value;
}
