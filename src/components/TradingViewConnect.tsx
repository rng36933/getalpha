"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hasGoneQuiet } from "@/lib/mt5/liveness";

type TradingViewConnectProps = {
  connected: boolean;
  lastSeenAt: string | null;
  tradeCount: number;
};

/**
 * The alert message TradingView must send, verbatim.
 *
 * TradingView substitutes these placeholders itself when the alert fires —
 * nothing here is filled in by getALPHA. `positionSize`/`contracts` are left
 * unquoted on purpose: TradingView's numeric placeholders are not strings,
 * and quoting them would send `"5"` instead of `5`, which `/api/tradingview/sync`
 * rejects as the wrong type.
 */
const ALERT_TEMPLATE = `{"symbol": "{{ticker}}", "action": "{{strategy.order.action}}", "positionSize": {{strategy.position_size}}, "contracts": {{strategy.order.contracts}}, "price": {{strategy.order.price}}, "time": "{{time}}", "id": "{{strategy.order.id}}", "comment": "{{strategy.order.comment}}"}`;

const STEPS = [
  {
    title: "Generate your webhook URL",
    body: "One click below. It carries your connection token — treat it like a password and regenerate it if it ever leaks.",
  },
  {
    title: "This needs a Strategy, not a plain indicator",
    body: "Only strategy.entry() / strategy.close() calls fill strategy.order.* and strategy.position_size, which the message template below depends on. An indicator with a bare alert() has none of those.",
  },
  {
    title: "Create one alert on that strategy",
    body: "Right-click the chart → Add alert. Condition: your strategy, “Any alert() function call”. One alert covers every entry and exit — you do not need a second one.",
  },
  {
    title: "Paste the webhook URL and the message",
    body: "In the alert's Notifications tab, tick Webhook URL and paste yours. In Message, replace the default text with the template below exactly.",
  },
  {
    title: "Set it to Open-ended and create it",
    body: "An expiring alert stops syncing silently. Nothing here places or changes an order — the strategy only decides what to log, same as MT5/MT4/cTrader never touch your broker.",
  },
  {
    title: "Check that it is alive",
    body: "Trigger a signal (or wait for the next real one) and check back here — “Terminal connected” means the first webhook landed.",
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

export default function TradingViewConnect({
  connected,
  lastSeenAt,
  tradeCount,
}: TradingViewConnectProps) {
  const router = useRouter();
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/tradingview/connection", { method: "POST" });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? "Could not create a key. Try again.");
      } else {
        setWebhookUrl(`${window.location.origin}/api/tradingview/sync/${body.token}`);
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
      const response = await fetch("/api/tradingview/connection", { method: "DELETE" });
      if (!response.ok) {
        setError("Could not disconnect. Try again.");
      } else {
        setWebhookUrl(null);
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string, mark: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(value);
      mark(true);
      setTimeout(() => mark(false), 2000);
    } catch {
      mark(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] leading-relaxed text-muted">
          A TradingView alert sends this desk each order your strategy fills —
          it only sends, never places or changes an order, no broker
          connection involved.{" "}
          <strong className="font-medium text-foreground">
            getALPHA never connects to TradingView; the alert connects to us.
          </strong>{" "}
          Unlike MT5/MT4/cTrader, there is no real broker account behind a
          TradingView alert — a trade here is built from your strategy's own
          entry/exit signals, one open position per symbol at a time.
        </p>
      </div>

      {connected ? (
        <div
          className={`rounded-lg border px-3 py-2 ${
            lastSeenAt && hasGoneQuiet(lastSeenAt)
              ? "border-warning/30 bg-warning/10"
              : "border-positive/30 bg-positive/10"
          }`}
        >
          <p
            className={`text-[13px] font-medium ${
              lastSeenAt && hasGoneQuiet(lastSeenAt) ? "text-warning" : "text-positive"
            }`}
          >
            {!lastSeenAt
              ? "Key created, waiting for the first alert"
              : hasGoneQuiet(lastSeenAt)
                ? `Nothing received for ${ago(lastSeenAt).replace(" ago", "")}`
                : "Alert connected"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {lastSeenAt
              ? `Last sent ${ago(lastSeenAt)} · ${tradeCount} synced trade${
                  tradeCount === 1 ? "" : "s"
                }`
              : "Nothing yet — finish the steps below, then trigger a signal."}
          </p>
        </div>
      ) : null}

      {webhookUrl ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
          <p className="text-[13px] font-medium text-warning">
            Copy this now — it is not shown again
          </p>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={webhookUrl}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Your webhook URL"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2 font-mono text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => copy(webhookUrl, setCopiedUrl)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-[filter] hover:brightness-110"
            >
              {copiedUrl ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">Alert message — paste exactly as-is</p>
          <button
            type="button"
            onClick={() => copy(ALERT_TEMPLATE, setCopiedTemplate)}
            className="text-xs font-medium text-accent hover:brightness-110"
          >
            {copiedTemplate ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-1.5 overflow-x-auto rounded-lg border border-line bg-surface-raised px-3 py-2 font-mono text-[11px] leading-relaxed text-muted">
          {ALERT_TEMPLATE}
        </pre>
      </div>

      <ol className="space-y-1.5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-2 text-[13px] leading-relaxed">
            <span className="shrink-0 font-mono text-muted">{index + 1}.</span>
            <p className="text-muted">
              <span className="font-medium text-foreground">{step.title}</span>
              {" — "}
              {step.body}
            </p>
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

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-background transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted"
        >
          {busy ? "Working…" : connected ? "Generate a new URL" : "Generate my webhook URL"}
        </button>

        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="text-[13px] text-muted transition-colors hover:text-negative disabled:opacity-50"
          >
            Disconnect
          </button>
        ) : null}
      </div>

      <p className="border-t border-line pt-3 text-xs leading-relaxed text-muted">
        No stop, target or account balance is available from an alert, so
        those fields stay empty on these rows — everything else about them can
        still be edited and reviewed like any other trade.
      </p>
    </div>
  );
}
