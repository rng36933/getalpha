"use client";

import { SignUp } from "@clerk/nextjs";
import { useState } from "react";
import { LEGAL_PAGES } from "@/lib/legal/documents";

/**
 * The sign-up form, behind a required checkbox.
 *
 * The sign-up form itself belongs to Clerk and its submission never passes
 * through this app, so a tick here cannot be recorded as consent — it is the
 * visible requirement, not the evidence. The record is written by the consent
 * gate on first entry to the app, which is also what asks again when a document
 * changes.
 */
export default function RegisterConsent() {
  const [agreed, setAgreed] = useState(false);

  if (agreed) {
    return <SignUp signInUrl="/login" fallbackRedirectUrl="/welcome" />;
  }

  return (
    <div className="surface-lit w-full max-w-md rounded-none border border-zinc-800 p-6">
      <h1 className="font-mono text-lg font-semibold uppercase tracking-tight">Create your account</h1>

      <p className="mt-3 rounded-none border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm font-medium leading-relaxed text-warning">
        getALPHA is an educational and informational tool. It does not provide
        financial advice or trading signals, and every financial decision you
        make using it is yours alone.
      </p>

      <ul className="mt-4 space-y-1.5 text-sm">
        {LEGAL_PAGES.map((page) => (
          <li key={page.href}>
            <a
              href={page.href}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {page.label} ↗
            </a>
          </li>
        ))}
      </ul>

      <label className="mt-6 flex items-start gap-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-accent"
        />
        <span className="text-sm font-medium leading-relaxed text-warning">
          I agree to the Terms of Service and the Risk Disclaimer, and I accept
          that I am solely responsible for my own financial decisions.
        </span>
      </label>

      <p className="mt-4 text-xs text-muted">
        Tick the box to continue to sign-up.
      </p>
    </div>
  );
}
