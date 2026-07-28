"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  BookOpen,
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

/**
 * Visual onboarding banner for first-time users.
 *
 * Improved with visual steps, emojis, and interactive elements instead of
 * long text explanations. Makes it clear what to do next and why.
 */

const STORAGE_KEY = "getalpha.firstRun.dismissed";

const noSubscribe = () => () => {};

/** False on the server and during the first client render, true afterwards. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Visual onboarding steps with icons and emojis
 */
const ONBOARDING_STEPS = [
  {
    icon: BookOpen,
    emoji: "📖",
    title: "Record Your First Trade",
    description: "Every number is computed from your trades.",
    action: { label: "Start", href: "/dashboard/journal" },
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Or Connect MetaTrader",
    description: "Sync 90 days automatically.",
    action: { label: "Connect", href: "/dashboard/settings" },
  },
  {
    icon: TrendingUp,
    emoji: "📊",
    title: "Get Your Metrics",
    description: "Win rate, risk, where losses cluster.",
    action: null,
  },
];

const KEY_BENEFITS = [
  "🎯 Your win rate per pair",
  "📍 Where your losses cluster",
  "⚖️ Real risk you actually took",
];

export default function FirstRun() {
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated || dismissed || wasDismissed()) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Closed either way
    }
  }

  return (
    <section className="relative mb-4 overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-br from-accent-soft/50 via-background to-background p-5 sm:p-6 shadow-sm">
      {/* Close button */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss onboarding"
        className="absolute right-3 top-3 rounded-md px-2 py-1 text-lg leading-none text-muted transition-colors hover:text-foreground"
      >
        ×
      </button>

      <div className="max-w-4xl">
        {/* Header with icon */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h2 className="text-lg font-semibold tracking-tight text-balance">
              Welcome to getALPHA
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A journal that judges your <span className="font-semibold text-accent">decision</span>, not just the result.
          </p>
        </div>

        {/* Key benefits in a highlight box */}
        <div className="mb-6 rounded-lg border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-accent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              What you'll get
            </p>
          </div>
          <ul className="space-y-2">
            {KEY_BENEFITS.map((benefit) => (
              <li key={benefit} className="text-sm text-muted flex items-center gap-2">
                <span className="text-base">{benefit.split(" ")[0]}</span>
                <span>{benefit.substring(benefit.indexOf(" ") + 1)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Onboarding steps grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
          {ONBOARDING_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-lg border border-line bg-surface-raised p-4 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl">{step.emoji}</span>
                  <span className="text-xs font-bold text-accent bg-accent/10 rounded px-2 py-0.5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {step.description}
                </p>

                {step.action && (
                  <Link
                    href={step.action.href}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors group"
                  >
                    {step.action.label}
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Primary CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/journal"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-all hover:brightness-110 active:scale-95"
          >
            <CheckCircle2 size={16} />
            Start your first trade
          </Link>
          <span className="text-xs text-muted">
            Takes 2 minutes · No manual entry needed if you use MetaTrader
          </span>
        </div>
      </div>
    </section>
  );
}
