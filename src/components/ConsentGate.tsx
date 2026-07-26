"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ConsentGateProps = {
  version: string;
  documents: readonly { href: string; label: string }[];
};

/**
 * Blocks the application until the current documents are accepted.
 *
 * A checkbox on the sign-up form alone proves nothing — the form is Clerk's,
 * the tick never reaches our database, and it cannot ask again when the terms
 * change. This screen is what produces the record: the user's id, the exact
 * version they were shown, and the moment they agreed.
 */
export default function ConsentGate({ version, documents }: ConsentGateProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/legal/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);

        if (body?.reason === "VERSION_MISMATCH") {
          setError(
            "These documents were updated while this page was open. Reload to see the current version.",
          );
        } else {
          setError(body?.error ?? "Could not save. Try again.");
        }

        setSaving(false);
        return;
      }

      // The gate is decided on the server, so the page has to be re-rendered
      // there rather than hidden on the client.
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setSaving(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 py-10">
      <div className="surface-lit w-full max-w-lg rounded-xl border border-line p-6">
        <h1 className="text-lg font-semibold tracking-tight">
          Before you continue
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          getALPHA is an educational and informational tool. It does not provide
          financial advice or trading signals, and every financial decision you
          make using it is yours alone.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          Please read these before agreeing:
        </p>

        <ul className="mt-3 space-y-1.5 text-sm">
          {documents.map((document) => (
            <li key={document.href}>
              <a
                href={document.href}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {document.label} ↗
              </a>
            </li>
          ))}
        </ul>

        <label className="mt-6 flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            disabled={saving}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-accent"
          />
          <span className="text-sm leading-relaxed">
            I have read and agree to the Terms of Service, the Privacy Policy and
            the Risk Disclaimer, and I accept that I am solely responsible for my
            own financial decisions.
          </span>
        </label>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={accept}
          disabled={!agreed || saving}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted"
        >
          {saving ? "Saving…" : "Agree and continue"}
        </button>

        <p className="mt-3 text-center text-[11px] text-muted">
          Version {version.replaceAll("|", " · ")}
        </p>
      </div>
    </div>
  );
}
