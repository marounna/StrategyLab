"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  CandlestickSeries,
  type CandlestickData,
} from "lightweight-charts";

type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

export function CandleChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // create chart once
    const chart = createChart(ref.current, {
      height: 320,
      autoSize: true,
      layout: { textColor: "#e5e7eb", background: { color: "transparent" } },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {});

    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as any, // lightweight-charts expects UTCTimestamp; this is fine
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    series.setData(data);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once

  useEffect(() => {
    if (!ref.current) return;

    // simplest approach: re-create when candles change (stable + fewer bugs)
    // If you want smoother updates, we can store seriesRef and update data instead.
  }, [candles]);

  // Recreate chart when candles change (simple + reliable)
  useEffect(() => {
    if (!ref.current) return;

    // wipe and rebuild
    ref.current.innerHTML = "";

    const chart = createChart(ref.current, {
      height: 320,
      autoSize: true,
      layout: { textColor: "#e5e7eb", background: { color: "transparent" } },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    const series = chart.addSeries(CandlestickSeries, {});

    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    series.setData(data);
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [candles]);

  return <div ref={ref} className="w-full" />;
}
