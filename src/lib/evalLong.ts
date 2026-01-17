import { pivots } from "@/lib/pivots";
import { isStrongBullish, rr } from "@/lib/utils";
import type { Candle } from "@/lib/normalize";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";

type Step = {
  id: string;
  title: string;
  pass: boolean;
  details: Record<string, any>;
};

export type LongEval = {
  ok: boolean;
  steps: Step[];
  entry?: number;
  sl?: number;
  tp1?: number;
  tp2?: number;
  rr?: number;
};

function last<T>(a: T[]) {
  return a[a.length - 1];
}

function lastPivot(p: ReturnType<typeof pivots>, kind: "high" | "low") {
  const arr = p.filter((x) => x.kind === kind);
  return arr.length ? arr[arr.length - 1] : null;
}

// “small high/low” = last pivot on that timeframe
export function evalLong(
  h4: Candle[],
  h1: Candle[],
  m15: Candle[],
  m5: Candle[],
  settings: Settings = DEFAULT_SETTINGS
): LongEval {
  const steps: Step[] = [];

  // 1) H4 uptrend: last two pivot highs/lows are higher highs + higher lows
  const h4P = pivots(h4 as any, settings.pivot.leftBars, settings.pivot.rightBars);
  const h4Highs = h4P.filter((x) => x.kind === "high");
  const h4Lows = h4P.filter((x) => x.kind === "low");

  const h4TrendPass =
    h4Highs.length >= 2 &&
    h4Lows.length >= 2 &&
    h4Highs[h4Highs.length - 1].price > h4Highs[h4Highs.length - 2].price &&
    h4Lows[h4Lows.length - 1].price > h4Lows[h4Lows.length - 2].price;

  steps.push({
    id: "h4_trend",
    title: "H4 Trend (Higher Highs & Higher Lows)",
    pass: h4TrendPass,
    details: {
      lastH4High: h4Highs.at(-1) ?? null,
      prevH4High: h4Highs.at(-2) ?? null,
      lastH4Low: h4Lows.at(-1) ?? null,
      prevH4Low: h4Lows.at(-2) ?? null,
    },
  });

  // 2) H1 pullback + sweep: break below last pivot low (“small low”) then recover (close back above it)
  const h1P = pivots(h1 as any, settings.pivot.leftBars, settings.pivot.rightBars);
  const smallLow = lastPivot(h1P, "low");
  const lastH1 = last(h1);

  const h1SweepPass =
    !!smallLow &&
    // sweep happened at some candle in last N bars
    h1.slice(-settings.sweepLookbackBars).some((c) => c.low < smallLow.price) &&
    // current close recovered above swept low
    lastH1.close > smallLow.price;

  steps.push({
    id: "h1_sweep",
    title: "H1 Pullback + Liquidity Sweep (break small low then reclaim)",
    pass: h1SweepPass,
    details: {
      smallLow,
      lastH1Candle: lastH1,
      lookback: settings.sweepLookbackBars,
    },
  });

  // 3) M15 confirmation: strong bullish candle closing above last pivot high (“small high”)
  const m15P = pivots(m15 as any, settings.pivot.leftBars, settings.pivot.rightBars);
  const smallHigh = lastPivot(m15P, "high");
  const lastM15 = last(m15);

  const strongBull = isStrongBullish(
    lastM15,
    settings.strongBull.bodyPct,
    settings.strongBull.closeTopPct,
    settings
  );

  const m15ConfirmPass = !!smallHigh && strongBull && lastM15.close > smallHigh.price;

  steps.push({
    id: "m15_confirm",
    title: "M15 Confirmation (Strong Bullish close above small high)",
    pass: m15ConfirmPass,
    details: {
      smallHigh,
      lastM15Candle: lastM15,
      strongBull,
      thresholds: settings.strongBull,
    },
  });

  // 4) M5 entry + SL: entry = last M5 close, SL below lowest M5 low of last N bars
  const entry = last(m5).close;
  const window = m5.slice(-settings.m5StopLookbackBars);
  const lowest = window.reduce((min, c) => Math.min(min, c.low), Number.POSITIVE_INFINITY);
  const sl = lowest;

  const m5Pass = Number.isFinite(entry) && Number.isFinite(sl) && sl < entry;
  steps.push({
    id: "m5_entry",
    title: "M5 Entry/SL (SL below lowest M5 low of setup)",
    pass: m5Pass,
    details: {
      entry,
      sl,
      lookback: settings.m5StopLookbackBars,
      lowestLowCandleTimeRange: { from: window[0]?.datetime, to: last(window)?.datetime },
    },
  });

  // 5) Targets + RR: TP1=last H1 swing high, TP2=last H4 swing high, require RR>=1:2 (2.0)
  const h1High = lastPivot(h1P, "high");
  const h4High = lastPivot(h4P, "high");
  const tp1 = h1High?.price ?? NaN;
  const tp2 = h4High?.price ?? NaN;

  const rr1 = rr(entry, sl, tp1);
  const allow = rr1 !== null && Number.isFinite(rr1) && rr1 >= settings.minRR;

  steps.push({
    id: "targets_rr",
    title: "Targets + RR (TP1/TP2, require RR >= 1:2)",
    pass: allow,
    details: {
      tp1: h1High,
      tp2: h4High,
      rrToTP1: rr1,
      minRR: settings.minRR,
    },
  });

  const ok = steps.every((s) => s.pass);
  return { ok, steps, entry, sl, tp1, tp2, rr: rr1 ?? undefined };
}
