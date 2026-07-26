"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const KINDS = [
  { value: "BUG", label: "Something is broken" },
  { value: "FEEDBACK", label: "Feedback or an idea" },
  { value: "QUESTION", label: "A question" },
] as const;

const MAX_LENGTH = 2000;

export default function SupportForm() {
  const pathname = usePathname();

  const [kind, setKind] = useState<string>("BUG");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError(null);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, message, pageUrl: pathname }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Could not send that. Try again.");
        setState("idle");
        return;
      }

      setState("done");
      setMessage("");
    } catch {
      setError("Could not reach the server. Check your connection.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div>
        <p
          role="status"
          className="rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
        >
          Sent. Thank you — this gets read.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Send something else
        </button>
      </div>
    );
  }

  const remaining = MAX_LENGTH - message.length;

  return (
    <form onSubmit={submit}>
      <fieldset disabled={state === "sending"}>
        <legend className="sr-only">What kind of message is this?</legend>

        <div className="flex flex-wrap gap-2">
          {KINDS.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                kind === option.value
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-muted hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                checked={kind === option.value}
                onChange={(event) => setKind(event.target.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>

        <label htmlFor="support-message" className="sr-only">
          Your message
        </label>
        <textarea
          id="support-message"
          required
          rows={6}
          maxLength={MAX_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={
            kind === "BUG"
              ? "What did you do, what did you expect, and what happened instead?"
              : "Tell us what you are thinking."
          }
          className="mt-4 w-full resize-y rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            The page you are on is attached automatically.
          </p>
          <p
            className={`text-xs tabular-nums ${
              remaining < 100 ? "text-warning" : "text-muted"
            }`}
          >
            {remaining}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted"
        >
          {state === "sending" ? "Sending…" : "Send"}
        </button>
      </fieldset>
    </form>
  );
}
