"use client";

import { useEffect, useRef } from "react";

/**
 * Seeded PRNG — same reasoning as the landing page's version: the backdrop
 * has to be the same shape on every load, not a different picture each visit.
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
 * A faint, slowly-drifting candlestick strip behind the whole dashboard.
 *
 * Where the landing page's `AmbientCandles` draws once and only redraws on
 * resize, this one animates — the desk asked for "something animated,
 * trading-related, gold-dominant" as its backdrop, not the landing hero's
 * still image. Drawn once as a strip twice its own width, then drifted with
 * a CSS transform rather than redrawn every frame: a `translateX` loop costs
 * nothing per frame, where redrawing a canvas sixty times a second behind a
 * page full of live-updating cards would not be free.
 *
 * Gold and its shade rather than green/red: this is ambient texture, not a
 * reading, and the site's accent should dominate its own background.
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
      // Half the element's own width: the strip is drawn once and the CSS
      // animation slides a duplicate copy in behind it, so only half the
      // canvas needs unique content for a seamless loop.
      const width = canvas.clientWidth / 2;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      canvas.width = width * 2 * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width * 2, height);

      const step = 16;
      const count = Math.ceil(width / step) + 1;

      for (let pass = 0; pass < 2; pass += 1) {
        const offsetX = pass * width;
        // Reseeded identically each pass, so the second copy is pixel-for-
        // pixel the first — required for the loop to read as continuous
        // rather than as a visible seam.
        const passRandom = mulberry32(20260802);
        let passPrice = height * 0.55;

        for (let i = 0; i < count; i += 1) {
          const drift = (passRandom() - 0.48) * height * 0.06;
          const open = passPrice;
          const close = Math.max(
            height * 0.1,
            Math.min(height * 0.9, open + drift),
          );
          const high = Math.min(open, close) - passRandom() * height * 0.035;
          const low = Math.max(open, close) + passRandom() * height * 0.035;
          const x = offsetX + i * step + step / 2;

          const rising = close < open;

          context.strokeStyle = rising
            ? "rgba(242, 201, 76, 0.5)"
            : "rgba(180, 140, 40, 0.35)";
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

          passPrice = close;
        }
      }
    }

    draw();

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
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.16] [mask-image:linear-gradient(to_bottom,transparent_0%,#000_15%,#000_75%,transparent_100%)]"
    >
      <canvas
        ref={canvasRef}
        className="app-candle-drift h-full"
        style={{ width: "200%" }}
      />
    </div>
  );
}
