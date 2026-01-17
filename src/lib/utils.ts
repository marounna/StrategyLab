import { Candle, Settings } from "./types";

export function isStrongBullish(c: Candle, bodyPct: number, closeTopPct: number, s: Settings): boolean {
  if (!(c.close > c.open)) return false;
  const range = c.high - c.low;
  if (range <= 0) return false;

  const body = Math.abs(c.close - c.open);
  const bodyRatio = body / range;

  const closeFromTop = (c.high - c.close) / range; // 0 means at high
  const closeInTop = closeFromTop <= s.strongCloseTopPct;

  return bodyRatio >= s.strongBodyMin && closeInTop;
}

export function rr(entry: number, stop: number, target: number): number | null {
  const risk = entry - stop;
  const reward = target - entry;
  if (risk <= 0 || reward <= 0) return null;
  return reward / risk;
}
