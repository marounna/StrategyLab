import { Candle, Pivot } from "./types";

export function pivots(candles: Candle[], left: number, right: number): Pivot[] {
  const out: Pivot[] = [];
  for (let i = left; i < candles.length - right; i++) {
    const c = candles[i];

    let isHigh = true;
    let isLow = true;

    for (let j = i - left; j <= i + right; j++) {
      if (j === i) continue;
      if (candles[j].high >= c.high) isHigh = false;
      if (candles[j].low <= c.low) isLow = false;
      if (!isHigh && !isLow) break;
    }

    if (isHigh) out.push({ index: i, time: c.time, price: c.high, kind: "high" });
    if (isLow) out.push({ index: i, time: c.time, price: c.low, kind: "low" });
  }
  return out;
}

export function lastPivot(p: Pivot[], kind: "high" | "low"): Pivot | null {
  for (let i = p.length - 1; i >= 0; i--) if (p[i].kind === kind) return p[i];
  return null;
}

export function lastTwoPivots(p: Pivot[], kind: "high" | "low"): [Pivot, Pivot] | null {
  const arr = p.filter(x => x.kind === kind);
  if (arr.length < 2) return null;
  return [arr[arr.length - 2], arr[arr.length - 1]];
}
