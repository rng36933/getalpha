"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hasGoneQuiet } from "@/lib/mt5/liveness";

type Mt4ConnectProps = {
  connected: boolean;
  accountLogin: string | null;
  broker: string | null;
  /** ISO timestamp of the last sync, or null if the terminal never sent. */
  lastSeenAt: string | null;
  tradeCount: number;
};

/** The MT4 twin of Mt5Connect — same flow, same copy where the platform doesn't change it. */
const REASONS = [
  "Every trade lands in the journal by itself — even the ones you'd skip typing in.",
  "Open orders show their risk while still open, not after.",
  "Stop, size and units come straight from the terminal — exact, not estimated.",
];

const STEPS = [
  {
    title: "Generate your key",
    body: "One click below. Shown once — save it somewhere until the EA has it.",
  },
  {
    title: "Save the file into MetaTrader",
    body: "Download it. In MT4: File → Open Data Folder → MQL4 → Experts, then drop it in.",
  },
  {
    title: "Compile it — this is the step people miss",
    body: "Double-click getALPHA-Sync.mq4 to open MetaEditor, press F7. 0 errors. Until compiled, the Navigator won't show it.",
  },
  {
    title: "Give it a chart of its own",
    body: "Refresh Expert Advisors in the Navigator. Open any new chart, drag getALPHA-Sync onto it, paste the key, press OK. One EA per chart — a second one silently replaces this.",
  },
  {
    title: "Allow it to reach us",
    body: "Tools → Options → Expert Advisors → allow WebRequest for https://www.getalpha.org.",
  },
  {
    title: "Check that it is alive",
    body: "A smiley appears on the chart; the Experts tab (Ctrl+T) shows a “getALPHA:” line within two minutes. Toolbar grey, not green? Press Ctrl+E.",
  },
];

function ago(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "moments ago";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.round(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export default function Mt4Connect({
  connected,
  accountLogin,
  broker,
  lastSeenAt,
  tradeCount,
}: Mt4ConnectProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/mt4/connection", { method: "POST" });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? "Could not create a key. Try again.");
      } else {
        setToken(body.token);
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/mt4/connection", { method: "DELETE" });
      if (!response.ok) {
        setError("Could not disconnect. Try again.");
      } else {
        setToken(null);
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
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
          A small program inside MetaTrader sends this desk what you traded. It
          only sends — never places or changes an order, no password involved.{" "}
          <strong className="font-medium text-foreground">
            We never connect to your account; your terminal connects to us.
          </strong>
        </p>

        <ul className="mt-4 space-y-2 text-sm text-muted">
          {REASONS.map((reason) => (
            <li key={reason} className="grid grid-cols-[1rem_1fr] gap-2.5">
              <span aria-hidden="true" className="text-accent">
                →
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

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
              ? "Key created, waiting for the terminal"
              : hasGoneQuiet(lastSeenAt)
                ? `Nothing received for ${ago(lastSeenAt).replace(" ago", "")}`
                : "Terminal connected"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {lastSeenAt
              ? `Last sent ${ago(lastSeenAt)}${
                  accountLogin ? ` · account ${accountLogin}` : ""
                }${broker ? ` · ${broker}` : ""} · ${tradeCount} synced trade${
                  tradeCount === 1 ? "" : "s"
                }`
              : "Nothing yet — finish the steps below, then check the Experts tab."}
          </p>
          {lastSeenAt && hasGoneQuiet(lastSeenAt) ? (
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Anything opened since then is missing. Usually MetaTrader is just
              closed — it has to run to sync. If open, check the Experts tab
              (Ctrl+T): no “getALPHA:” line in the last two minutes means the
              program is not running, often because a second Expert Advisor was
              attached to the same chart, which removes the first one silently.
            </p>
          ) : null}
        </div>
      ) : null}

      {token ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-sm font-medium text-warning">
            Copy this now — it is not shown again
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={token}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Your connection key"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2 font-mono text-xs outline-none"
            />
            <button
              type="button"
              onClick={copy}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-[filter] hover:brightness-110"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}

      <ol className="space-y-4">
        {STEPS.map((step, index) => (
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
          {busy ? "Working…" : connected ? "Generate a new key" : "Generate my key"}
        </button>

        <a
          href="/getALPHA-Sync.mq4"
          download
          className="rounded-lg border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Download the file
        </a>

        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="text-sm text-muted transition-colors hover:text-negative disabled:opacity-50"
          >
            Disconnect
          </button>
        ) : null}
      </div>

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-muted">
        MetaTrader has to be running to sync — it catches up when reopened.
        Desktop terminal only; the phone app can&rsquo;t run this.
      </p>
    </div>
  );
}
