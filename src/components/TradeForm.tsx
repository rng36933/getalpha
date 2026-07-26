"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Fields the form sends. Everything is a string because that is what an input
 * holds; the route parses and validates, and it is the only thing allowed to
 * decide what a valid trade is.
 */
type Fields = {
  asset: string;
  direction: "BUY" | "SELL";
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  size: string;
  contractSize: string;
  pnl: string;
  accountBalance: string;
  setup: string;
  timeframe: string;
  marketContext: string;
  emotionalState: string;
};

const EMPTY: Fields = {
  asset: "",
  direction: "BUY",
  entryPrice: "",
  exitPrice: "",
  stopLoss: "",
  takeProfit: "",
  size: "",
  contractSize: "1",
  pnl: "",
  accountBalance: "",
  setup: "",
  timeframe: "",
  marketContext: "",
  emotionalState: "",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";

export default function TradeForm() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setDetails([]);

    // Blank optional fields are omitted rather than sent as "", so the route
    // treats them as absent instead of as an unparseable number.
    const payload: Record<string, unknown> = {
      asset: fields.asset,
      direction: fields.direction,
      entryPrice: fields.entryPrice,
      size: fields.size,
    };

    for (const key of [
      "exitPrice",
      "stopLoss",
      "takeProfit",
      "contractSize",
      "pnl",
      "accountBalance",
      "setup",
      "timeframe",
      "marketContext",
      "emotionalState",
    ] as const) {
      if (fields[key].trim() !== "") payload[key] = fields[key];
    }

    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? "Could not save that trade.");
        setDetails(Array.isArray(body?.details) ? body.details : []);
        setSaving(false);
        return;
      }

      setFields(EMPTY);
      setSaving(false);
      // The list is rendered on the server, so it has to be re-rendered there.
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={saving} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Instrument">
            <input
              required
              value={fields.asset}
              onChange={(event) => set("asset", event.target.value.toUpperCase())}
              placeholder="XAUUSD"
              className={inputClass}
            />
          </Field>

          <Field label="Direction">
            <select
              value={fields.direction}
              onChange={(event) =>
                set("direction", event.target.value as "BUY" | "SELL")
              }
              className={inputClass}
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </Field>

          <Field label="Size" hint="In lots, if your broker quotes lots.">
            <input
              required
              inputMode="decimal"
              value={fields.size}
              onChange={(event) => set("size", event.target.value)}
              placeholder="0.5"
              className={inputClass}
            />
          </Field>

          <Field label="Units per lot" hint="1 XAUUSD lot is 100 oz.">
            <input
              inputMode="decimal"
              value={fields.contractSize}
              onChange={(event) => set("contractSize", event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Entry">
            <input
              required
              inputMode="decimal"
              value={fields.entryPrice}
              onChange={(event) => set("entryPrice", event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Stop loss" hint="Without this there is no R.">
            <input
              inputMode="decimal"
              value={fields.stopLoss}
              onChange={(event) => set("stopLoss", event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Take profit">
            <input
              inputMode="decimal"
              value={fields.takeProfit}
              onChange={(event) => set("takeProfit", event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Exit" hint="Leave blank while it is open.">
            <input
              inputMode="decimal"
              value={fields.exitPrice}
              onChange={(event) => set("exitPrice", event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="P&L">
            <input
              inputMode="decimal"
              value={fields.pnl}
              onChange={(event) => set("pnl", event.target.value)}
              placeholder="-120.50"
              className={inputClass}
            />
          </Field>

          <Field label="Account balance" hint="Turns risk into a percentage.">
            <input
              inputMode="decimal"
              value={fields.accountBalance}
              onChange={(event) => set("accountBalance", event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Setup">
            <input
              value={fields.setup}
              onChange={(event) => set("setup", event.target.value)}
              placeholder="London sweep"
              className={inputClass}
            />
          </Field>

          <Field label="Timeframe">
            <input
              value={fields.timeframe}
              onChange={(event) => set("timeframe", event.target.value)}
              placeholder="M15"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Market context" hint="Why you took it.">
            <textarea
              rows={2}
              value={fields.marketContext}
              onChange={(event) => set("marketContext", event.target.value)}
              className={`${inputClass} resize-y`}
            />
          </Field>

          <Field label="How you felt" hint="Honest beats flattering.">
            <textarea
              rows={2}
              value={fields.emotionalState}
              onChange={(event) => set("emotionalState", event.target.value)}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative"
          >
            <p>{error}</p>
            {details.length > 0 ? (
              <ul className="mt-1 list-disc pl-4">
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted"
        >
          {saving ? "Saving…" : "Log trade"}
        </button>
      </fieldset>
    </form>
  );
}
