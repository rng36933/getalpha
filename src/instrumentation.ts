import * as Sentry from "@sentry/nextjs";
import { sharedOptions } from "@/lib/observability/sentry-options";

/**
 * Server and edge error reporting.
 *
 * Next calls `register` once per runtime, and the two runtimes need separate
 * initialisation because the edge runtime has no Node APIs to instrument.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(sharedOptions);
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(sharedOptions);
  }
}

/**
 * Errors thrown while rendering or in a route handler.
 *
 * Without this hook Next swallows them into a digest and the report never
 * reaches Sentry.
 */
export const onRequestError = Sentry.captureRequestError;
