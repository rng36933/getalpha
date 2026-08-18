"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeLog, type LogEntry } from "@/lib/liveLog";

const MAX_LINES = 12;

const TONE_CLASS: Record<NonNullable<LogEntry["tone"]>, string> = {
  default: "text-zinc-400",
  positive: "text-positive",
  negative: "text-negative",
  muted: "text-zinc-600",
};

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * A terminal-style feed of real client-side activity — a poll going out, a
 * price changing, a request failing — not a simulation.
 *
 * Starts empty rather than backfilled: there is no history to show for
 * events that happened before this panel mounted, and a panel that opens
 * with invented past entries would be exactly the fabrication this product
 * argues against everywhere else.
 */
export default function LiveLogPanel() {
  const [lines, setLines] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeLog((entry) => {
      setLines((current) => [...current, entry].slice(-MAX_LINES));
    });
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  return (
    <div className="border border-zinc-800 bg-[#0a0b0f]">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <span className="live-dot size-1.5 shrink-0 rounded-full bg-accent" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Live activity
        </span>
      </div>

      <div
        ref={containerRef}
        className="max-h-40 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
      >
        {lines.length === 0 ? (
          <p className="text-zinc-600">Waiting for the first poll…</p>
        ) : (
          lines.map((entry) => (
            <p key={entry.at} className={TONE_CLASS[entry.tone ?? "default"]}>
              <span className="text-zinc-600">[{timeLabel(entry.at)}]</span>{" "}
              {entry.text}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
