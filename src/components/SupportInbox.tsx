"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type Ticket = {
  id: string;
  kind: "BUG" | "FEEDBACK" | "QUESTION";
  message: string;
  pageUrl: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
};

const KIND_LABEL: Record<Ticket["kind"], { label: string; className: string }> = {
  BUG: { label: "Bug", className: "bg-negative/15 text-negative" },
  FEEDBACK: { label: "Feedback", className: "bg-accent-soft text-accent" },
  QUESTION: { label: "Question", className: "bg-muted/15 text-muted" },
};

export default function SupportInbox({ tickets }: { tickets: Ticket[] }) {
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
        setError(body?.error ?? "Could not update that ticket.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  if (tickets.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Nothing here.</p>;
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
                  KIND_LABEL[ticket.kind].className
                }`}
              >
                {KIND_LABEL[ticket.kind].label}
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
                <span className="text-xs text-muted">closed</span>
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
                ? "Saving…"
                : ticket.status === "OPEN"
                  ? "Mark done"
                  : "Reopen"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
