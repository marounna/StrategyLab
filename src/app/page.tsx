"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pivots as calcPivots } from "@/lib/pivots";
import type { PivotPoint, TrendLines } from "@/components/CandleChart";
import HistoryBar, { upsertHistory } from "@/components/HistoryBar";
import AssetSearch from "@/components/AssetSearch";
import { ChecklistStepper } from "@/components/ChecklistStepper";
import { CandleChart } from "@/components/CandleChart";
import SettingsPanel from "@/components/SettingsPanel";

import { normalizeTwelveData, type Candle } from "@/lib/normalize";
import { evalLong, type LongEval } from "@/lib/evalLong";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";
import { toStepUI } from "@/lib/uiModel";

type Asset = { symbol: string; instrument_name?: string };

const REFRESH_SEC = 300;

export default function Page() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const [h4, setH4] = useState<Candle[]>([]);
  const [h1, setH1] = useState<Candle[]>([]);
  const [m15, setM15] = useState<Candle[]>([]);
  const [m5, setM5] = useState<Candle[]>([]);

  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextRefreshIn = useMemo(() => {
    if (!lastUpdate) return null;
    const elapsed = Math.floor((Date.now() - lastUpdate) / 1000);
    return Math.max(0, REFRESH_SEC - elapsed);
  }, [lastUpdate, tick]);

  async function fetchOne(
    symbol: string,
    interval: "4h" | "1h" | "15min" | "5min"
  ): Promise<Candle[]> {
    const r = await fetch(
      `/api/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(
        interval
      )}&outputsize=300`
    );
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || "Failed candles");
    return normalizeTwelveData(j.values);
  }

  async function refresh(symbol: string) {
    setErr("");
    setLoading(true);
    try {
      const [H4, H1, M15, M5] = await Promise.all([
        fetchOne(symbol, "4h"),
        fetchOne(symbol, "1h"),
        fetchOne(symbol, "15min"),
        fetchOne(symbol, "5min"),
      ]);

      setH4(H4);
      setH1(H1);
      setM15(M15);
      setM5(M5);
      setLastUpdate(Date.now());
    } catch (e: any) {
      setErr(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // countdown tick
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // auto-refresh on selected asset
  useEffect(() => {
    if (!asset?.symbol) return;

    refresh(asset.symbol);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => refresh(asset.symbol), REFRESH_SEC * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.symbol]);


  

  const evaluation: LongEval | null = useMemo(() => {
    if (!asset) return null;
    if (!h4.length || !h1.length || !m15.length || !m5.length) return null;
    return evalLong(h4, h1, m15, m5, settings);
  }, [asset, h4, h1, m15, m5, settings]);

      useEffect(() => {
      if (!asset?.symbol) return;
      if (!evaluation) return;

      upsertHistory({
        symbol: asset.symbol,
        name: asset.instrument_name,
        at: Date.now(),
        ok: evaluation.ok,
        entry: evaluation.entry ?? null,
        sl: evaluation.sl ?? null,
        tp1: evaluation.tp1 ?? null,
        rr: evaluation.rr ?? null,
      });
    }, [
      asset?.symbol,
      evaluation?.ok,
      evaluation?.entry,
      evaluation?.sl,
      evaluation?.tp1,
      evaluation?.rr,
    ]);


  const uiSteps = useMemo(() => {
    if (!evaluation) return [];
    return toStepUI(evaluation.steps);
  }, [evaluation]);

  const h4Overlays = useMemo(() => {
  if (!h4.length) return { pivots: [], highlights: [], trendLines: undefined as TrendLines | undefined };

  const psRaw = calcPivots(h4 as any, settings.pivot.leftBars, settings.pivot.rightBars);
  const ps = toPivotPoints(psRaw);

  const highs = lastTwoOfKind(ps, "high");
  const lows = lastTwoOfKind(ps, "low");

  const highlights: PivotPoint[] = [];
  if (highs.prev) highlights.push({ ...highs.prev, kind: "high", label: "Prev High" });
  if (highs.last) highlights.push({ ...highs.last, kind: "high", label: "Last High" });
  if (lows.prev) highlights.push({ ...lows.prev, kind: "low", label: "Prev Low" });
  if (lows.last) highlights.push({ ...lows.last, kind: "low", label: "Last Low" });

  const trendLines: TrendLines = {
    high: highs.prev && highs.last ? { a: highs.prev, b: highs.last } : undefined,
    low: lows.prev && lows.last ? { a: lows.prev, b: lows.last } : undefined,
  };

  return { pivots: ps, highlights, trendLines };
}, [h4, settings.pivot.leftBars, settings.pivot.rightBars]);

const h1Overlays = useMemo(() => {
  if (!h1.length) return { pivots: [], highlights: [], trendLines: undefined as TrendLines | undefined };

  const psRaw = calcPivots(h1 as any, settings.pivot.leftBars, settings.pivot.rightBars);
  const ps = toPivotPoints(psRaw);

  const highs = lastTwoOfKind(ps, "high");
  const lows = lastTwoOfKind(ps, "low");

  const highlights: PivotPoint[] = [];
  if (highs.prev) highlights.push({ ...highs.prev, kind: "high", label: "Prev High" });
  if (highs.last) highlights.push({ ...highs.last, kind: "high", label: "Last High" });
  if (lows.prev) highlights.push({ ...lows.prev, kind: "low", label: "Prev Low" });
  if (lows.last) highlights.push({ ...lows.last, kind: "low", label: "Last Low" });

  const trendLines: TrendLines = {
    high: highs.prev && highs.last ? { a: highs.prev, b: highs.last } : undefined,
    low: lows.prev && lows.last ? { a: lows.prev, b: lows.last } : undefined,
  };

  return { pivots: ps, highlights, trendLines };
}, [h1, settings.pivot.leftBars, settings.pivot.rightBars]);

const m15Overlays = useMemo(() => {
  if (!m15.length) return { pivots: [], highlights: [], trendLines: undefined as TrendLines | undefined };

  const psRaw = calcPivots(m15 as any, settings.pivot.leftBars, settings.pivot.rightBars);
  const ps = toPivotPoints(psRaw);

  const highs = lastTwoOfKind(ps, "high");
  const lows = lastTwoOfKind(ps, "low");

  const highlights: PivotPoint[] = [];
  if (highs.prev) highlights.push({ ...highs.prev, kind: "high", label: "Prev High" });
  if (highs.last) highlights.push({ ...highs.last, kind: "high", label: "Last High" });
  if (lows.prev) highlights.push({ ...lows.prev, kind: "low", label: "Prev Low" });
  if (lows.last) highlights.push({ ...lows.last, kind: "low", label: "Last Low" });

  const trendLines: TrendLines = {
    high: highs.prev && highs.last ? { a: highs.prev, b: highs.last } : undefined,
    low: lows.prev && lows.last ? { a: lows.prev, b: lows.last } : undefined,
  };

  return { pivots: ps, highlights, trendLines };
}, [m15, settings.pivot.leftBars, settings.pivot.rightBars]);

const m5Overlays = useMemo(() => {
  if (!m5.length) return { pivots: [], highlights: [], trendLines: undefined as TrendLines | undefined };

  const psRaw = calcPivots(m5 as any, settings.pivot.leftBars, settings.pivot.rightBars);
  const ps = toPivotPoints(psRaw);

  const highs = lastTwoOfKind(ps, "high");
  const lows = lastTwoOfKind(ps, "low");

  const highlights: PivotPoint[] = [];
  if (highs.prev) highlights.push({ ...highs.prev, kind: "high", label: "Prev High" });
  if (highs.last) highlights.push({ ...highs.last, kind: "high", label: "Last High" });
  if (lows.prev) highlights.push({ ...lows.prev, kind: "low", label: "Prev Low" });
  if (lows.last) highlights.push({ ...lows.last, kind: "low", label: "Last Low" });

  const trendLines: TrendLines = {
    high: highs.prev && highs.last ? { a: highs.prev, b: highs.last } : undefined,
    low: lows.prev && lows.last ? { a: lows.prev, b: lows.last } : undefined,
  };

  return { pivots: ps, highlights, trendLines };
}, [m5, settings.pivot.leftBars, settings.pivot.rightBars]);


  function lastTwoOfKind(
  ps: { time: number; price: number; kind: "high" | "low" }[],
  kind: "high" | "low"
) {
  const xs = ps.filter((p) => p.kind === kind);
  if (xs.length < 2) return { prev: null, last: null };
  return { prev: xs[xs.length - 2], last: xs[xs.length - 1] };
}

function toPivotPoints(
  ps: any[]
): PivotPoint[] {
  // your pivots() likely returns: { index, time, price, kind }
  return ps.map((p) => ({
    time: p.time,
    price: p.price,
    kind: p.kind,
  }));
}


  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">LONG Trading Checklist</h1>
      <p className="text-zinc-400 mt-2">
        H4 trend → H1 sweep → M15 confirm → M5 entry/SL → Targets + RR
      </p>

      <div className="mt-6">
        <AssetSearch
          onSelect={(a) =>
            setAsset({ symbol: a.symbol, instrument_name: a.instrument_name })
          }
        />
        <HistoryBar
            onPick={(symbol) => setAsset({ symbol })}
          />

      </div>

      {asset && (
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-lg">{asset.symbol}</div>
              <div className="text-sm text-zinc-400">
                {asset.instrument_name ?? ""}
              </div>
            </div>

            <div className="text-sm text-zinc-400">
              {lastUpdate ? (
                <>
                  Last update: {new Date(lastUpdate).toLocaleTimeString()} • Next
                  refresh: {nextRefreshIn}s
                </>
              ) : (
                "No data yet"
              )}
            </div>
          </div>

          {loading && <div className="text-zinc-300 mt-3">Loading…</div>}
          {err && <div className="text-red-400 mt-3">{err}</div>}

          {evaluation && (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    evaluation.ok
                      ? "bg-green-600/30 text-green-200"
                      : "bg-red-600/30 text-red-200"
                  }`}
                >
                  {evaluation.ok ? "TRADE OK" : "NO TRADE"}
                </div>

                <div className="text-sm text-zinc-300">
                  Entry: {evaluation.entry?.toFixed(2)} • SL:{" "}
                  {evaluation.sl?.toFixed(2)} • TP1:{" "}
                  {Number.isFinite(evaluation.tp1 ?? NaN)
                    ? evaluation.tp1?.toFixed(2)
                    : "—"}{" "}
                  • RR:{" "}
                  {Number.isFinite(evaluation.rr ?? NaN)
                    ? evaluation.rr?.toFixed(2)
                    : "—"}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Checklist</div>
                    <div className="text-xs text-zinc-400">
                      Pivot ({settings.pivot.leftBars},{settings.pivot.rightBars})
                    </div>
                  </div>

                  {evaluation && (
    <ChecklistStepper
      symbol={asset?.symbol}
      lastPrice={evaluation.lastPrice ?? null}
      steps={uiSteps}
    />
)}

                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="font-semibold mb-3">Charts</div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <div className="font-semibold mb-2">H4</div>
                      <CandleChart
  candles={h4}
  pivots={h4Overlays.pivots}
  highlights={h4Overlays.highlights}
  trendLines={h4Overlays.trendLines}
/>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <div className="font-semibold mb-2">H1</div>
                      <CandleChart
  candles={h1}
  pivots={h4Overlays.pivots}
  highlights={h4Overlays.highlights}
  trendLines={h4Overlays.trendLines}
/>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <div className="font-semibold mb-2">M15</div>
                      <CandleChart
  candles={m15}
  pivots={h4Overlays.pivots}
  highlights={h4Overlays.highlights}
  trendLines={h4Overlays.trendLines}
/>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <div className="font-semibold mb-2">M5</div>
                      <CandleChart
  candles={m5}
  pivots={h4Overlays.pivots}
  highlights={h4Overlays.highlights}
  trendLines={h4Overlays.trendLines}
/>
                    </div>
                  </div>
                </div>
                </div>


              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="font-semibold mb-3">Manual Override</div>
                <SettingsPanel settings={settings} onChange={setSettings} />
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
