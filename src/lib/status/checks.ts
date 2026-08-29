import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing/stripe";

export type ComponentStatus = "operational" | "degraded" | "down";

export type ComponentCheck = {
  name: string;
  description: string;
  status: ComponentStatus;
  latencyMs: number | null;
};

/** A check that never hangs the page: whatever it's watching, this caps it. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timed out")), ms),
    ),
  ]);
}

async function checkDatabase(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 4000);
    return {
      name: "Database",
      description: "Journal, trades, and account data",
      status: "operational",
      latencyMs: Date.now() - start,
    };
  } catch {
    return {
      name: "Database",
      description: "Journal, trades, and account data",
      status: "down",
      latencyMs: null,
    };
  }
}

/**
 * A direct call against our own Stripe account rather than Stripe's public
 * status feed — that feed's API shape isn't stable enough to depend on, and
 * this answers the more relevant question anyway: can *our* checkout reach
 * Stripe. `balance.retrieve` is one of the cheapest reads in their API.
 */
async function checkPayments(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    await withTimeout(stripe().balance.retrieve(), 4000);
    return {
      name: "Payments",
      description: "Stripe checkout and billing",
      status: "operational",
      latencyMs: Date.now() - start,
    };
  } catch {
    return {
      name: "Payments",
      description: "Stripe checkout and billing",
      status: "down",
      latencyMs: null,
    };
  }
}

/** Trivially true: if this ran, the site served the request. */
function checkWebsite(): ComponentCheck {
  return {
    name: "Website",
    description: "getalpha.org and the dashboard",
    status: "operational",
    latencyMs: 0,
  };
}

export async function runStatusChecks(): Promise<ComponentCheck[]> {
  const [database, payments] = await Promise.all([
    checkDatabase(),
    checkPayments(),
  ]);

  return [checkWebsite(), database, payments];
}

export function overallStatus(checks: ComponentCheck[]): ComponentStatus {
  if (checks.some((c) => c.status === "down")) return "down";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "operational";
}
