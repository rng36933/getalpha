"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type CandlestickData,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import type { Candle } from "@/lib/market-data/display";

type PriceChartProps = {
  data: Candle[];
  height?: number;
};

export default function PriceChart({ data, height = 320 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // The bars the chart was built with, read only while creating it. Held in a
  // ref so the setup effect can seed the series without listing `data` as a
  // dependency and rebuilding the whole chart on every refresh.
  const dataRef = useRef<Candle[]>(data);

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

    seriesRef.current = series;
    series.setData(dataRef.current as CandlestickData<Time>[]);
    chart.timeScale().fitContent();

    // The chart is drawn on a canvas and cannot reflow on its own.
    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      seriesRef.current = null;
      chart.remove();
    };
    // Deliberately not depending on `data`. Rebuilding the chart on every
    // refresh would throw away wherever the reader had panned or zoomed to,
    // once a minute, which is worse than not refreshing at all. New bars go in
    // through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // New bars, into the existing chart.
  //
  // `setData` replaces the series rather than appending: the last candle of a
  // live timeframe is still forming, so its high, low and close all change
  // between refreshes. Appending would leave a stale copy of it on the chart
  // beside the new one. The time scale is left alone on purpose — the reader's
  // view is theirs.
  useEffect(() => {
    dataRef.current = data;
    seriesRef.current?.setData(data as CandlestickData<Time>[]);
  }, [data]);

  return <div ref={containerRef} className="w-full" />;
}
