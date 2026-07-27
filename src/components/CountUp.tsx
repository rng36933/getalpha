"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, formatSignedMoney } from "@/lib/format/money";

/**
 * A figure that counts up the first time it is scrolled into view.
 *
 * On the readouts that are meant to read as computed rather than typed — the
 * landing page's demo cards, and the headline totals inside the app. A figure
 * that arrives by counting says "this was worked out" before any sentence does,
 * which happens to be the whole claim this product makes about its numbers.
 *
 * Once, never on a loop. A number that keeps re-counting as the page scrolls is
 * a number nobody can read, and this one is meant to be read.
 */

type CountUpProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /**
   * Format as money in this currency.
   *
   * A string rather than a formatter function, because most callers are server
   * components and a function cannot cross that boundary. Null formats the
   * figure bare — the same rule as everywhere else, since no symbol beats the
   * wrong symbol.
   */
  currency?: string | null;
  /** With `currency`, drops the leading sign for figures that are not a P&L. */
  unsigned?: boolean;
};

/**
 * How long the figure takes to arrive.
 *
 * Short. The landing page can afford a second of theatre; a journal somebody
 * opens ten times a day cannot, and a total that spins up on every visit stops
 * being information and becomes a small tax on reading it.
 */
const DURATION_MS = 650;

export default function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  currency,
  unsigned = false,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const [visible, setVisible] = useState(false);

  // Fires once, then stops watching. Nothing here needs to know that the card
  // scrolled away again.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer to hang it on, or a reader who asked for no motion: show the
    // figure. Scheduled rather than set here, because state written straight
    // into an effect body is the cascading render the React compiler rejects.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const immediate = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(immediate);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    /**
     * The figure appears even if the observer never speaks.
     *
     * This is the failure that matters here. A readout stuck at 0.00% sits
     * directly under a sentence claiming the numbers are computed for you, so
     * the one broken state is also the one that makes the card argue against
     * itself. Whatever the reason — a browser that never reports the
     * intersection, an ancestor it cannot resolve against, a tab that was never
     * painted — the number arrives.
     *
     * Long enough that a reader scrolling normally still sees it count.
     */
    const fallback = setTimeout(() => setVisible(true), 2500);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Zero duration for reduced motion, rather than a separate branch that
    // writes state on the spot: the first frame then lands on the final figure.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : DURATION_MS;

    let frame = 0;
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress =
        duration === 0 ? 1 : Math.min((now - startedAt) / duration, 1);

      setShown(value * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    // Frames do not run in a hidden tab, and a readout stuck at zero would say
    // the opposite of what the card claims. Same guarantee as the hero.
    const safety = setTimeout(() => setShown(value), duration + 400);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(safety);
    };
  }, [visible, value]);

  const body =
    currency === undefined
      ? `${prefix}${shown.toFixed(decimals)}${suffix}`
      : unsigned
        ? formatMoney(shown, currency)
        : formatSignedMoney(shown, currency);

  return (
    <span ref={ref} className={className}>
      {body}
    </span>
  );
}
