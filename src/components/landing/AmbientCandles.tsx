"use client";

import { useEffect, useRef } from "react";

/**
 * Seeded PRNG.
 *
 * The backdrop has to be the same shape on every load. `Math.random` would
 * redraw a different picture each visit, which reads as noise rather than as
 * a considered background — and would differ between two people looking at
 * the page together.
 */
function mulberry32(seed: number) {
  let state = seed;

  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Candlesticks drawn faintly behind the hero.
 *
 * Canvas rather than hand-authored SVG paths: it is a couple of hundred
 * rectangles that have to re-lay-out at every width, and as markup that is
 * unreadable and unmaintainable.
 */
export default function AmbientCandles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    function draw() {
      if (!canvas || !context) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const random = mulberry32(20260726);
      const step = 13;
      const count = Math.ceil(width / step) + 1;
      let price = height * 0.62;

      for (let i = 0; i < count; i += 1) {
        const drift = (random() - 0.46) * height * 0.05;
        const open = price;
        const close = Math.max(
          height * 0.12,
          Math.min(height * 0.92, open + drift),
        );
        const high = Math.min(open, close) - random() * height * 0.03;
        const low = Math.max(open, close) + random() * height * 0.03;
        const x = i * step + step / 2;

        // Canvas y grows downwards, so a lower number is a higher price.
        const rising = close < open;

        context.strokeStyle = rising
          ? "rgba(52, 211, 153, 0.5)"
          : "rgba(248, 113, 113, 0.45)";
        context.fillStyle = context.strokeStyle;
        context.lineWidth = 1;

        context.beginPath();
        context.moveTo(x, high);
        context.lineTo(x, low);
        context.stroke();

        context.fillRect(
          x - 3,
          Math.min(open, close),
          6,
          Math.max(1, Math.abs(close - open)),
        );

        price = close;
      }
    }

    draw();

    // Debounced: a drag-resize fires continuously and each redraw walks the
    // whole series.
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(draw, 150);
    };

    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-35 [mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,transparent_100%)]"
    />
  );
}
