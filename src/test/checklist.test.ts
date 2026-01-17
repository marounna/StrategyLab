import { describe, expect, it } from "vitest";
import { isStrongBullish, rr } from "@/lib/utils";
import { DEFAULT_SETTINGS } from "@/lib/types";

describe("utils", () => {
  it("strong bullish candle rules", () => {
    const s = DEFAULT_SETTINGS;
    const c = { time: 0, datetime: "x", open: 10, low: 9, high: 15, close: 14.5 };
    expect(isStrongBullish(c as any, s)).toBe(true);
  });

  it("rr calc", () => {
    expect(rr(100, 95, 110)).toBeCloseTo(2);
  });
});
