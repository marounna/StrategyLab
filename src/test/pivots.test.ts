import { describe, expect, it } from "vitest";
import { pivots } from "@/lib/pivots";

function c(high: number, low: number) {
  return { time: 0, datetime: "x", open: low, high, low, close: high };
}

describe("pivots", () => {
  it("finds a pivot high/low", () => {
    // Pivot high at index 2 (15)
    // Pivot low at index 4 (6) with neighbors higher lows
    const candles = [
      c(10, 8),
      c(12, 9),
      c(15, 10),
      c(11, 9),
      c(9, 6),
      c(10, 8),
    ];

    const p = pivots(candles as any, 1, 1);
    expect(p.some((x) => x.kind === "high")).toBe(true);
    expect(p.some((x) => x.kind === "low")).toBe(true);
  });
});
