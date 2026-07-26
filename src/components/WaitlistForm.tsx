"use client";

import { useState } from "react";

type WaitlistFormProps = {
  /** Referral code from the link the visitor arrived through. */
  referralCode: string | null;
};

export default function WaitlistForm({ referralCode }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, ref: referralCode }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Try again.");
        setState("idle");
        return;
      }

      setState("done");
    } catch {
      setError("Could not reach the server. Check your connection.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p
        role="status"
        className="rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
      >
        You&rsquo;re on the list. We&rsquo;ll write when there is something worth
        writing about.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          disabled={state === "sending"}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted"
        >
          {state === "sending" ? "Joining…" : "Join the waitlist"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-negative">
          {error}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-muted">
        One address, no sharing, unsubscribe in a click.
        {referralCode ? " You were invited by an existing member." : ""}
      </p>
    </form>
  );
}
