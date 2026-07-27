"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hasGoneQuiet } from "@/lib/mt5/liveness";

type Mt5ConnectProps = {
  connected: boolean;
  accountLogin: string | null;
  broker: string | null;
  /** ISO timestamp of the last sync, or null if the terminal never sent. */
  lastSeenAt: string | null;
  tradeCount: number;
};

/** Why somebody would bother, in the terms they would use. */
const REASONS = [
  "Every trade lands in the journal by itself — including the ones you would not have bothered to type in, which are usually the ones worth reading later.",
  "Open positions show what they risk while they are still open, not after.",
  "The stop, the size and the units per lot come from the terminal, so the risk and the result are exact rather than approximate.",
];

const STEPS = [
  {
    title: "Generate your key",
    body: "One click below. It is shown once and never stored, so keep it somewhere until the EA has it.",
  },
  {
    title: "Save the file into MetaTrader",
    body: "Download it, then in MT5 open File → Open Data Folder → MQL5 → Experts, and drop it in.",
  },
  {
    // The step whose absence sends everybody to support. MetaTrader's Navigator
    // lists compiled .ex5 programs, so the .mq5 source it was just given is
    // invisible until this happens — and the symptom is "it isn't there", which
    // reads like the download failed.
    title: "Compile it — this is the step people miss",
    body: "Double-click getALPHA-Sync.mq5 to open it in MetaEditor and press F7. It should report 0 errors. Until you do this the Navigator will not list it: MetaTrader only shows compiled programs, and what you downloaded is the readable source.",
  },
  {
    // A chart holds exactly one Expert Advisor. Attaching a second one removes
    // the first with no warning, no dialog and no line in the log — the only
    // symptom is that trades quietly stop arriving, which reads as a fault here
    // rather than a change made in MetaTrader. Anyone running a second EA will
    // hit this eventually, so the fix is in the instructions rather than in a
    // support reply.
    title: "Give it a chart of its own",
    body: "Back in MT5, right-click Expert Advisors in the Navigator → Refresh. Open a fresh chart — File → New Chart, any symbol, it does not have to be one you trade — and drag getALPHA-Sync onto that. Paste the key into ConnectionToken and press OK. Keep this chart for getALPHA alone: MetaTrader runs one Expert Advisor per chart, so attaching another to the same chart removes this one without saying so.",
  },
  {
    title: "Allow it to reach us",
    body: "Tools → Options → Expert Advisors → tick “Allow WebRequest for listed URL” and add https://www.getalpha.org — MetaTrader blocks every outbound request until you do.",
  },
  {
    title: "Check that it is alive",
    body: "A smiling face appears in the top-right corner of that chart, and within two minutes the Experts tab (Ctrl+T) shows a line beginning “getALPHA:”. If AutoTrading in the toolbar is grey rather than green, press Ctrl+E. No getALPHA line after two minutes means it is not running, whatever the chart looks like.",
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

export default function Mt5Connect({
  connected,
  accountLogin,
  broker,
  lastSeenAt,
  tradeCount,
}: Mt5ConnectProps) {
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
      const response = await fetch("/api/mt5/connection", { method: "DELETE" });
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
          A small program runs inside your MetaTrader and sends this desk what
          you traded. It only ever sends — it cannot place an order, cannot
          change one, and there is no password involved anywhere.{" "}
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
              : "Nothing has arrived yet. Finish the steps below, then check the Experts tab in MetaTrader for a message from getALPHA."}
          </p>
          {lastSeenAt && hasGoneQuiet(lastSeenAt) ? (
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Anything opened since then is missing from this desk. Usually
              MetaTrader is closed — it has to be running for trades to arrive.
              If it is open, check the Experts tab (Ctrl+T): no line beginning
              “getALPHA:” in the last two minutes means the program is not
              running, and the common reason is that a second Expert Advisor was
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
          href="/getALPHA-Sync.mq5"
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
        Two things worth knowing before you start. MetaTrader has to be running
        for anything to arrive — close it and syncing stops until you open it
        again, at which point it catches up. And this only works on the desktop
        terminal: the phone app cannot run programs like this one.
      </p>
    </div>
  );
}
