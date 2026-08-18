import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import { SubscriptionStatus } from "@/generated/prisma/client";
import { isAdmin } from "@/lib/admin";
import { PAID_PLANS, priceIdFor } from "@/lib/billing/plans";
import { stripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin",
};

/**
 * Unlisted on purpose.
 *
 * Nothing in the sidebar links here — `isAdmin` is the only door, and a
 * visitor who is not on the list gets the same 404 as a route that does not
 * exist, not a 403 that confirms it does.
 */

const RECENT_LIMIT = 15;

const VISIT_STATS_DAYS = 7;

type DayVisits = { label: string; views: number; unique: number };
type VisitStats = { totalViews: number; uniqueVisitors: number; days: DayVisits[] };

/**
 * Website visits over the last week, bucketed by UTC day.
 *
 * Computed here rather than in the database: the row count is small (this is
 * the marketing site, not the app), and a `groupBy` cannot express "distinct
 * visitors per day" directly — reducing rows already in memory is simpler
 * than a raw query for a number this size.
 */
async function loadVisitStats(): Promise<VisitStats> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (VISIT_STATS_DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    select: { visitorId: true, createdAt: true },
  });

  const byDay = new Map<string, { views: number; visitors: Set<string> }>();
  for (let i = 0; i < VISIT_STATS_DAYS; i++) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);
    byDay.set(day.toISOString().slice(0, 10), { views: 0, visitors: new Set() });
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (!bucket) continue;
    bucket.views += 1;
    bucket.visitors.add(row.visitorId);
  }

  const days: DayVisits[] = [...byDay.entries()].map(([key, bucket]) => ({
    label: new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IE", {
      weekday: "short",
    }),
    views: bucket.views,
    unique: bucket.visitors.size,
  }));

  return {
    totalViews: rows.length,
    uniqueVisitors: new Set(rows.map((r) => r.visitorId)).size,
    days,
  };
}

type PlanAmount = { slug: string; amountEuros: number; interval: string | null };

/** The live price behind each paid plan, read from Stripe once per render. */
async function loadPlanAmounts(): Promise<PlanAmount[]> {
  const amounts = await Promise.all(
    PAID_PLANS.map(async (plan): Promise<PlanAmount | null> => {
      const priceId = priceIdFor(plan);
      if (!priceId) return null;

      try {
        const price = await stripe().prices.retrieve(priceId);
        if (price.unit_amount === null) return null;

        return {
          slug: plan.slug,
          amountEuros: price.unit_amount / 100,
          interval: price.recurring?.interval ?? null,
        };
      } catch (error) {
        console.error(`Admin panel could not read the Stripe price for ${plan.slug}:`, error);
        return null;
      }
    }),
  );

  return amounts.filter((a): a is PlanAmount => a !== null);
}

type ActivityItem = {
  id: string;
  at: Date;
  label: string;
  detail: string;
};

export default async function AdminPage() {
  const { userId } = await auth();
  if (!isAdmin(userId)) notFound();

  const [
    activeSubs,
    trialing,
    pastDue,
    planAmounts,
    recentSubs,
    recentTickets,
    memberCount,
    visitStats,
  ] = await Promise.all([
      prisma.subscription.groupBy({
        by: ["planSlug"],
        where: { status: SubscriptionStatus.ACTIVE },
        _count: { _all: true },
      }),
      prisma.subscription.count({ where: { status: SubscriptionStatus.TRIALING } }),
      prisma.subscription.count({ where: { status: SubscriptionStatus.PAST_DUE } }),
      loadPlanAmounts(),
      prisma.subscription.findMany({
        orderBy: { updatedAt: "desc" },
        take: RECENT_LIMIT,
      }),
      prisma.supportTicket.findMany({
        orderBy: { createdAt: "desc" },
        take: RECENT_LIMIT,
      }),
      // Clerk is the source of truth for who has an account at all — nothing
      // in this app's own tables is written until somebody does something,
      // which undercounts a visitor who signed up and never took a trade.
      clerkClient()
        .then((clerk) => clerk.users.getCount())
        .catch((error) => {
          console.error("Admin panel could not read the Clerk user count:", error);
          return null;
        }),
      loadVisitStats(),
    ]);

  const byPlan = new Map(activeSubs.map((row) => [row.planSlug, row._count._all]));
  const amountFor = new Map(planAmounts.map((p) => [p.slug, p.amountEuros]));

  // Monthly-equivalent revenue: a yearly subscriber's price divided across
  // the twelve months it actually covers, so a single €199.99/year account
  // does not read as thirteen times a €19.99/month one.
  let mrr = 0;
  for (const [slug, count] of byPlan) {
    if (!slug) continue;
    const amount = amountFor.get(slug);
    if (amount === undefined) continue;
    const plan = PAID_PLANS.find((p) => p.slug === slug);
    mrr += plan?.tagline.includes("year") ? (amount / 12) * count : amount * count;
  }

  const totalActive = [...byPlan.values()].reduce((sum, n) => sum + n, 0);

  const activity: ActivityItem[] = [
    ...recentSubs.map((sub) => ({
      id: `sub-${sub.id}`,
      at: sub.updatedAt,
      label:
        sub.status === SubscriptionStatus.ACTIVE
          ? "Subscription active"
          : sub.status === SubscriptionStatus.CANCELED
            ? "Subscription cancelled"
            : sub.status === SubscriptionStatus.PAST_DUE
              ? "Payment failed"
              : `Subscription ${sub.status.toLowerCase()}`,
      detail: `${sub.planSlug ?? "no plan"} · ${sub.userId}`,
    })),
    ...recentTickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      at: ticket.createdAt,
      label: `New ${ticket.kind.toLowerCase()} ticket`,
      detail: ticket.message.slice(0, 80) + (ticket.message.length > 80 ? "…" : ""),
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, RECENT_LIMIT);

  return (
    <>
      <PageHeader title="Admin" subtitle="Revenue, members, and what just happened." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="MRR (estimate)">
          <p className="figure text-2xl">
            {new Intl.NumberFormat("en-IE", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 2,
            }).format(mrr)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {totalActive} active
            {trialing > 0 ? ` · ${trialing} trialing` : ""}
            {pastDue > 0 ? ` · ${pastDue} past due` : ""}
          </p>
        </Card>

        <Card title="Members">
          <p className="figure text-2xl">{memberCount ?? "—"}</p>
          <p className="mt-1 text-xs text-muted">Registered accounts, via Clerk</p>
        </Card>

        <Card title="Website visits (7d)">
          <p className="figure text-2xl">{visitStats.uniqueVisitors}</p>
          <p className="mt-1 text-xs text-muted">
            unique visitors · {visitStats.totalViews} page views
          </p>
        </Card>

        <Card title="By plan">
          <div className="space-y-1 text-sm">
            {PAID_PLANS.map((plan) => (
              <div key={plan.slug} className="flex items-baseline justify-between">
                <span className="text-muted">{plan.slug}</span>
                <span className="figure">{byPlan.get(plan.slug) ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Website visits, last 7 days">
          <div className="flex items-end gap-3">
            {visitStats.days.map((day) => {
              const max = Math.max(1, ...visitStats.days.map((d) => d.unique));
              const height = Math.round((day.unique / max) * 100);
              return (
                <div key={day.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="figure text-xs text-muted">{day.unique}</span>
                  <div className="flex h-24 w-full items-end rounded-md bg-white/[0.03]">
                    <div
                      className="w-full rounded-md bg-accent/70"
                      style={{ height: `${Math.max(4, height)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted">{day.label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">
            Bars show unique visitors per day.{" "}
            <a
              href="https://vercel.com/almintasv-2246s-projects/getalpha/analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Open Vercel Analytics
            </a>{" "}
            for a second source.
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Recent activity">
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm">{item.label}</p>
                    <p className="truncate text-xs text-muted">{item.detail}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    {item.at.toLocaleString("en-IE", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
