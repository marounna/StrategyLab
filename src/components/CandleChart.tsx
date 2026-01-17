"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type Time,
  type CandlestickData,
  type SeriesMarker,
  type ISeriesMarkersPluginApi,
} from "lightweight-charts";

export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

export type PivotPoint = {
  time: number; // unix seconds
  price: number;
  kind: "high" | "low";
  label?: string;
};

export type TrendLine = {
  a: { time: number; price: number };
  b: { time: number; price: number };
};
export type TrendLines = { high?: TrendLine; low?: TrendLine };

type Props = {
  candles: Candle[];
  pivots?: PivotPoint[];
  highlights?: PivotPoint[];
  trendLines?: TrendLines;
  height?: number;
};

function ts(t: number): UTCTimestamp {
  return t as UTCTimestamp;
}

export function CandleChart({
  candles,
  pivots = [],
  highlights = [],
  trendLines,
  height = 320,
}: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const highLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const lowLineRef = useRef<ISeriesApi<"Line"> | null>(null);

  // ✅ Use library Time generic (v5 Time can be UTCTimestamp | BusinessDay | string)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const candleData = useMemo<CandlestickData[]>(() => {
    return (candles ?? []).map((c) => ({
      time: ts(c.time),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
  }, [candles]);

  useEffect(() => {
    if (!elRef.current) return;

    const chart = createChart(elRef.current, {
      height,
      autoSize: true,
      layout: { textColor: "#e5e7eb", background: { color: "transparent" } },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: 1 },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {});
    candleSeriesRef.current = candleSeries;

    // ✅ v5+ markers plugin
    markersRef.current = createSeriesMarkers(candleSeries);

    const highLine = chart.addSeries(LineSeries, { lineWidth: 2 });
    const lowLine = chart.addSeries(LineSeries, { lineWidth: 2 });
    highLineRef.current = highLine;
    lowLineRef.current = lowLine;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      highLineRef.current = null;
      lowLineRef.current = null;
      markersRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    candleSeries.setData(candleData);
    chart.timeScale().fitContent();

    const markers: SeriesMarker<Time>[] = [];

    for (const p of pivots) {
      markers.push({
        time: ts(p.time) as Time,
        position: p.kind === "high" ? "aboveBar" : "belowBar",
        shape: "circle",
        color: p.kind === "high" ? "#fbbf24" : "#60a5fa",
        size: 1,
      });
    }

    for (const p of highlights) {
      markers.push({
        time: ts(p.time) as Time,
        position: p.kind === "high" ? "aboveBar" : "belowBar",
        shape: p.kind === "high" ? "arrowDown" : "arrowUp",
        color: p.kind === "high" ? "#f97316" : "#22c55e",
        text: p.label ?? (p.kind === "high" ? "High" : "Low"),
        size: 2,
      });
    }

    markersRef.current?.setMarkers(markers);

    const highLine = highLineRef.current;
    const lowLine = lowLineRef.current;

    if (highLine) {
      if (trendLines?.high) {
        highLine.setData([
          { time: ts(trendLines.high.a.time), value: trendLines.high.a.price },
          { time: ts(trendLines.high.b.time), value: trendLines.high.b.price },
        ]);
      } else {
        highLine.setData([]);
      }
    }

    if (lowLine) {
      if (trendLines?.low) {
        lowLine.setData([
          { time: ts(trendLines.low.a.time), value: trendLines.low.a.price },
          { time: ts(trendLines.low.b.time), value: trendLines.low.b.price },
        ]);
      } else {
        lowLine.setData([]);
      }
    }
  }, [candleData, pivots, highlights, trendLines]);

  return <div ref={elRef} className="w-full" />;
}
