import { after } from "next/server";
import { PostHog } from "posthog-node";
import { safeLabel } from "./redact";

/**
 * Product analytics, server-side only.
 *
 * There is no browser SDK on purpose. Autocapture would hoover up form values,
 * URLs and click targets from a page whose forms hold entry prices, stop losses
 * and account balances, and the only reliable way to guarantee none of that
 * leaves the server is never to run a collector where it lives. Everything
 * PostHog receives is assembled here, by hand, from the shapes below.
 *
 * The consequence: no pageviews, no session replay, no funnels through the UI.
 * Counts of things that actually happened, which is what the events below are.
 */

/**
 * Every event the app may send, and exactly which properties it carries.
 *
 * The map is the privacy boundary. Adding a property means adding it here
 * first, which is a deliberate speed bump in front of the one mistake that
 * matters — putting a number from someone's account into a third-party system.
 */
type EventProperties = {
  trade_logged: {
    /** Instrument only. Never size, price, stop, target or P&L. */
    instrument: string;
    direction: "BUY" | "SELL";
    /** Whether risk was defined, not what it was. */
    hasStopLoss: boolean;
    hasTakeProfit: boolean;
    /** Journalled after the fact, or while still open. */
    isClosed: boolean;
    timeframe: string;
  };
  ai_brief_requested: {
    session: "LONDON" | "NEW_YORK" | "ASIA";
    /** True when an existing brief was served instead of a new model call. */
    cacheHit: boolean;
    /** True when some market data source was stale or missing. */
    degraded: boolean;
  };
};

export type AnalyticsEvent = keyof EventProperties;

let client: PostHog | null = null;

function posthog(): PostHog | null {
  if (client) return client;

  const key = process.env.POSTHOG_API_KEY;
  if (!key) return null;

  client = new PostHog(key, {
    // EU by default: the users are in the EU and the data should stay there.
    host: process.env.POSTHOG_HOST || "https://eu.i.posthog.com",
    // Serverless functions are frozen the moment they respond, so a batch
    // waiting for more events would simply be lost.
    flushAt: 1,
    flushInterval: 0,
  });

  return client;
}

/**
 * Records one event.
 *
 * Never throws and never delays the response: the send is queued with `after`,
 * which runs it once the response has been flushed to the client. Analytics
 * failing is not a reason for a trade to fail to save.
 */
export function track<E extends AnalyticsEvent>(
  event: E,
  distinctId: string,
  properties: EventProperties[E],
): void {
  const posthogClient = posthog();
  if (!posthogClient) return;

  const send = async () => {
    try {
      // `captureImmediate` rather than `capture`: the latter queues, and there
      // is no later in a serverless invocation.
      await posthogClient.captureImmediate({
        distinctId,
        event,
        properties: { ...properties, $process_person_profile: false },
      });
    } catch (error) {
      console.error(`Analytics event "${event}" was not recorded:`, error);
    }
  };

  try {
    after(send);
  } catch {
    // Outside a request scope `after` throws; fall back to fire-and-forget.
    void send();
  }
}

export { safeLabel };

