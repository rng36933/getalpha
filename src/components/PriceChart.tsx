"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type CandlestickData,
  type Time,
} from "lightweight-charts";
import type { Candle } from "@/lib/market-data/display";

type PriceChartProps = {
  data: Candle[];
  height?: number;
};

export default function PriceChart({ data, height = 320 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Pull colours from the CSS variables so the chart follows the app theme
    // instead of hardcoding a second palette.
    const rootStyles = getComputedStyle(document.documentElement);
    const cssVar = (name: string, fallback: string) =>
      rootStyles.getPropertyValue(name).trim() || fallback;

    const line = cssVar("--line", "#252935");
    const muted = cssVar("--muted", "#8a90a0");
    const positive = cssVar("--positive", "#34d399");
    const negative = cssVar("--negative", "#f87171");

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: muted,
        fontFamily: getComputedStyle(container).fontFamily,
      },
      grid: {
        vertLines: { color: line },
        horzLines: { color: line },
      },
      rightPriceScale: { borderColor: line },
      timeScale: { borderColor: line },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: muted, labelBackgroundColor: line },
        horzLine: { color: muted, labelBackgroundColor: line },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: positive,
      downColor: negative,
      borderUpColor: positive,
      borderDownColor: negative,
      wickUpColor: positive,
      wickDownColor: negative,
    });

    series.setData(data as CandlestickData<Time>[]);
    chart.timeScale().fitContent();

    // The chart is drawn on a canvas and cannot reflow on its own.
    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, height]);

  return <div ref={containerRef} className="w-full" />;
}
