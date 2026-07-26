"use client";

import { useState } from "react";
import type { RCurve as RCurveData } from "@/lib/dashboard/r-curve";

/**
 * The cumulative R curve.
 *
 * One series, so no legend — the card title names it. The accent hue carries
 * identity; green and red stay reserved for the figures, where a sign and a
 * word carry the same meaning for anyone who cannot separate the two hues.
 *
 * Drawn in a fixed viewBox and scaled by CSS, so it is responsive without
 * measuring the container. The x axis is trade number, not the calendar: see
 * the note in `r-curve.ts` for why.
 */

const W = 720;
const H = 220;
const PAD = { top: 14, right: 14, bottom: 20, left: 38 };

const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function format(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}R`;
}

export default function RCurve({ curve }: { curve: RCurveData }) {
  const [hover, setHover] = useState<number | null>(null);

  const { points, min, max, final, maxDrawdownR } = curve;

  // A flat curve would divide by zero. One R of headroom keeps a dead-flat
  // account drawn along the middle rather than smeared across the whole box.
  const span = max - min || 1;
  const padded = { lo: min - span * 0.08, hi: max + span * 0.08 };
  const range = padded.hi - padded.lo;

  const x = (n: number) =>
    PAD.left + ((n - 1) / Math.max(points.length - 1, 1)) * PLOT_W;
  const y = (value: number) =>
    PAD.top + ((padded.hi - value) / range) * PLOT_H;

  const zeroY = y(0);

  const line = points.map((p) => `${x(p.n)},${y(p.cumulative)}`).join(" ");
  // Closed against the zero line, not the floor of the box: the fill then reads
  // as "distance from break-even", which is the quantity being shown.
  const area = `${PAD.left},${zeroY} ${line} ${x(points.length)},${zeroY}`;

  const last = points[points.length - 1];
  const active = hover === null ? null : points[hover];

  const gridValues = [max, 0, min].filter(
    (value, index, all) => all.indexOf(value) === index,
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="flex items-baseline gap-2">
          <span
            className={`figure text-[1.75rem] ${
              final > 0 ? "text-positive" : final < 0 ? "text-negative" : ""
            }`}
          >
            {format(final)}
          </span>
          <span className="text-xs text-muted">over {points.length} trades</span>
        </span>

        <span className="flex items-baseline gap-2">
          <span className="figure text-base text-warning">
            −{maxDrawdownR.toFixed(2)}R
          </span>
          <span className="text-xs text-muted">deepest fall from a peak</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full touch-none"
        role="img"
        aria-label={`Cumulative R over ${points.length} trades, ending at ${format(final)}, with a deepest fall from a peak of ${maxDrawdownR.toFixed(2)}R.`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rcurve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Recessive grid: only the extremes and break-even are labelled. A line
            at every round number is noise on a chart this small. */}
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(value)}
              y2={y(value)}
              stroke="var(--line)"
              strokeWidth={1}
              strokeDasharray={value === 0 ? undefined : "3 4"}
            />
            <text
              x={PAD.left - 6}
              y={y(value) + 3.5}
              textAnchor="end"
              className="fill-[var(--muted)] text-[10px] tabular-nums"
            >
              {value > 0 ? `+${value}` : value}
            </text>
          </g>
        ))}

        <polygon points={area} fill="url(#rcurve-fill)" />

        <polyline
          points={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* The endpoint, emphasised: where the account stands now is the one
            point on the line worth marking permanently. */}
        <circle
          cx={x(last.n)}
          cy={y(last.cumulative)}
          r={4}
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth={2}
        />

        {active ? (
          <g pointerEvents="none">
            <line
              x1={x(active.n)}
              x2={x(active.n)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--muted)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={x(active.n)}
              cy={y(active.cumulative)}
              r={5}
              fill="var(--foreground)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          </g>
        ) : null}

        {/* Hit areas wider than the marks, one per trade, so a finger finds a
            point without having to land on a 2px line. */}
        {points.map((point, index) => (
          <rect
            key={point.n}
            x={x(point.n) - PLOT_W / Math.max(points.length - 1, 1) / 2}
            y={PAD.top}
            width={PLOT_W / Math.max(points.length - 1, 1) || PLOT_W}
            height={PLOT_H}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
            onFocus={() => setHover(index)}
          />
        ))}
      </svg>

      {/* The tooltip lives outside the SVG so it can use ordinary type tokens
          and wrap. A fixed slot rather than a floating box: on a phone a tooltip
          that follows the finger is a tooltip under the finger. */}
      <div className="mt-1 min-h-[1.25rem] text-xs text-muted">
        {active ? (
          <span className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-foreground">
              #{active.n} {active.asset}
            </span>
            <span
              className={`tabular-nums ${
                active.r > 0
                  ? "text-positive"
                  : active.r < 0
                    ? "text-negative"
                    : ""
              }`}
            >
              {format(active.r)}
            </span>
            <span className="tabular-nums">
              running {format(active.cumulative)}
            </span>
            <span>{active.at.slice(0, 10)}</span>
          </span>
        ) : (
          <span>Hover or tap a point for the trade behind it.</span>
        )}
      </div>
    </div>
  );
}
