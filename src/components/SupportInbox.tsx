"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supportCopy } from "@/lib/i18n/app/support";
import type { Locale } from "@/lib/i18n/locales";

export type Ticket = {
  id: string;
  kind: "BUG" | "FEEDBACK" | "QUESTION";
  message: string;
  pageUrl: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
};

const KIND_CLASSNAME: Record<Ticket["kind"], string> = {
  BUG: "bg-negative/15 text-negative",
  FEEDBACK: "bg-accent-soft text-accent",
  QUESTION: "bg-muted/15 text-muted",
};

export default function SupportInbox({
  tickets,
  locale,
}: {
  tickets: Ticket[];
  locale: Locale;
}) {
  const copy = supportCopy(locale);
  const kindLabel: Record<Ticket["kind"], string> = {
    BUG: copy.inbox.kinds.bug,
    FEEDBACK: copy.inbox.kinds.feedback,
    QUESTION: copy.inbox.kinds.question,
  };
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: Ticket["status"]) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/support/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? copy.inbox.updateFailed);
      } else {
        router.refresh();
      }
    } catch {
      setError(copy.inbox.networkError);
    } finally {
      setBusyId(null);
    }
  }

  if (tickets.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">{copy.inbox.nothingHere}</p>
    );
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 text-xs text-negative">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-line">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  KIND_CLASSNAME[ticket.kind]
                }`}
              >
                {kindLabel[ticket.kind]}
              </span>

              <span className="font-mono text-xs text-muted">
                {ticket.createdAt.slice(0, 16).replace("T", " ")}
              </span>

              {ticket.pageUrl ? (
                <span className="font-mono text-xs text-muted">
                  {ticket.pageUrl}
                </span>
              ) : null}

              {ticket.status === "CLOSED" ? (
                <span className="text-xs text-muted">{copy.inbox.closed}</span>
              ) : null}
            </div>

            {/* Rendered as text, never as markup: React escapes it, which is
                what makes it safe to show whatever somebody typed. */}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {ticket.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setStatus(ticket.id, ticket.status === "OPEN" ? "CLOSED" : "OPEN")
              }
              disabled={busyId === ticket.id}
              className="mt-3 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {busyId === ticket.id
                ? copy.inbox.saving
                : ticket.status === "OPEN"
                  ? copy.inbox.markDone
                  : copy.inbox.reopen}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
