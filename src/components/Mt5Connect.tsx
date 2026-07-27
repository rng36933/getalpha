"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { settingsCopy } from "@/lib/i18n/app/settings";
import type { Locale } from "@/lib/i18n/locales";
import { hasGoneQuiet } from "@/lib/mt5/liveness";

type Mt5ConnectProps = {
  connected: boolean;
  accountLogin: string | null;
  broker: string | null;
  /** ISO timestamp of the last sync, or null if the terminal never sent. */
  lastSeenAt: string | null;
  tradeCount: number;
  locale: Locale;
};

function minutesSince(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
}

export default function Mt5Connect({
  connected,
  accountLogin,
  broker,
  lastSeenAt,
  tradeCount,
  locale,
}: Mt5ConnectProps) {
  const copy = settingsCopy(locale).mt5;
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/mt5/connection", { method: "POST" });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? copy.generateFailed);
      } else {
        setToken(body.token);
        router.refresh();
      }
    } catch {
      setError(copy.networkError);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/mt5/connection", { method: "DELETE" });
      if (!response.ok) {
        setError(copy.disconnectFailed);
      } else {
        setToken(null);
        router.refresh();
      }
    } catch {
      setError(copy.networkError);
    } finally {
      setBusy(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm leading-relaxed text-muted">
          {copy.introLead}{" "}
          <strong className="font-medium text-foreground">{copy.introStrong}</strong>
        </p>

        <ul className="mt-4 space-y-2 text-sm text-muted">
          {copy.reasons.map((reason) => (
            <li key={reason} className="grid grid-cols-[1rem_1fr] gap-2.5">
              <span aria-hidden="true" className="text-accent">
                →
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* A silent terminal used to be reported as a timestamp in grey, which is
          a fact rather than a warning: the desk knew it had heard nothing for
          hours and said so in the same tone as everything else, while the
          journal simply looked like it had no new trades. Past the window it
          now states the problem and names its most common cause. */}
      {connected ? (
        <div
          className={`rounded-lg border px-4 py-3 ${
            lastSeenAt && hasGoneQuiet(lastSeenAt)
              ? "border-warning/30 bg-warning/10"
              : "border-positive/30 bg-positive/10"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              lastSeenAt && hasGoneQuiet(lastSeenAt) ? "text-warning" : "text-positive"
            }`}
          >
            {!lastSeenAt
              ? copy.keyCreatedWaiting
              : hasGoneQuiet(lastSeenAt)
                ? copy.nothingReceivedFor(copy.time.durationLabel(minutesSince(lastSeenAt)))
                : copy.terminalConnected}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {lastSeenAt
              ? copy.lastSent(
                  copy.time.agoLabel(minutesSince(lastSeenAt)),
                  accountLogin,
                  broker,
                  tradeCount,
                )
              : copy.nothingArrivedYet}
          </p>
          {lastSeenAt && hasGoneQuiet(lastSeenAt) ? (
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {copy.goneQuietDetail}
            </p>
          ) : null}
        </div>
      ) : null}

      {token ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-sm font-medium text-warning">{copy.tokenBoxTitle}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={token}
              onFocus={(event) => event.currentTarget.select()}
              aria-label={copy.tokenAriaLabel}
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2 font-mono text-xs outline-none"
            />
            <button
              type="button"
              onClick={copyToken}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-[filter] hover:brightness-110"
            >
              {copied ? copy.copiedLabel : copy.copyLabel}
            </button>
          </div>
        </div>
      ) : null}

      <ol className="space-y-4">
        {copy.steps.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[1.5rem_1fr] gap-3">
            <span className="mt-0.5 grid size-6 place-items-center rounded-md bg-surface-raised font-mono text-xs text-muted">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted"
        >
          {busy ? copy.working : connected ? copy.generateNewKey : copy.generateMyKey}
        </button>

        <a
          href="/getALPHA-Sync.mq5"
          download
          className="rounded-lg border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {copy.downloadFile}
        </a>

        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="text-sm text-muted transition-colors hover:text-negative disabled:opacity-50"
          >
            {copy.disconnect}
          </button>
        ) : null}
      </div>

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-muted">
        {copy.footerNote}
      </p>
    </div>
  );
}
