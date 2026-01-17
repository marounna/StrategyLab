export type StepUI = {
  id: string;
  title: string;
  pass: boolean;
  bullets: string[];
};

function fmtPrice(x: any) {
  return Number.isFinite(Number(x)) ? Number(x).toFixed(2) : "—";
}

function fmtTime(sec: any) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return "—";
  // TwelveData gives unix seconds
  return new Date(n * 1000).toLocaleString();
}

export function toStepUI(steps: any[]): StepUI[] {
  return steps.map((s) => {
    const d = s.details ?? {};
    const bullets: string[] = [];

    // STEP: H4 trend
    if (s.id === "h4_trend") {
      bullets.push("Rule: Uptrend = last H4 swing HIGH > previous H4 swing HIGH AND last H4 swing LOW > previous H4 swing LOW.");

      bullets.push(`Last H4 swing HIGH: ${fmtPrice(d?.lastH4High?.price)} @ ${fmtTime(d?.lastH4High?.time)}`);
      bullets.push(`Prev H4 swing HIGH: ${fmtPrice(d?.prevH4High?.price)} @ ${fmtTime(d?.prevH4High?.time)}`);
      bullets.push(`Last H4 swing LOW:  ${fmtPrice(d?.lastH4Low?.price)} @ ${fmtTime(d?.lastH4Low?.time)}`);
      bullets.push(`Prev H4 swing LOW:  ${fmtPrice(d?.prevH4Low?.price)} @ ${fmtTime(d?.prevH4Low?.time)}`);

      const hh = Number(d?.lastH4High?.price) > Number(d?.prevH4High?.price);
      const hl = Number(d?.lastH4Low?.price) > Number(d?.prevH4Low?.price);
      bullets.push(`Why: Higher High = ${hh ? "YES ✅" : "NO ❌"} • Higher Low = ${hl ? "YES ✅" : "NO ❌"}`);
    }

    // STEP: H1 pullback + sweep
    if (s.id === "h1_sweep") {
      bullets.push("Rule: Pullback + liquidity sweep = price breaks below the most recent 'small low' (H1 swing low).");
      bullets.push(`Small low (H1 swing low): ${fmtPrice(d?.smallLow?.price)} @ ${fmtTime(d?.smallLow?.time)}`);
      bullets.push(`Sweep candle low:        ${fmtPrice(d?.sweepCandle?.low)} @ ${fmtTime(d?.sweepCandle?.time)}`);

      const swept = Number(d?.sweepCandle?.low) < Number(d?.smallLow?.price);
      bullets.push(`Why: sweep happened (low < small low) = ${swept ? "YES ✅" : "NO ❌"}`);
    }

    // STEP: M15 confirmation candle
    if (s.id === "m15_confirm") {
      bullets.push("Rule: Strong bullish M15 candle that closes ABOVE the 'small high' (M15 swing high).");
      bullets.push(`Small high (M15 swing high): ${fmtPrice(d?.smallHigh?.price)} @ ${fmtTime(d?.smallHigh?.time)}`);

      const c = d?.confirmCandle;
      bullets.push(`Confirm candle: O ${fmtPrice(c?.open)} • H ${fmtPrice(c?.high)} • L ${fmtPrice(c?.low)} • C ${fmtPrice(c?.close)} @ ${fmtTime(c?.time)}`);
      bullets.push(`Close above small high? C ${fmtPrice(c?.close)} > ${fmtPrice(d?.smallHigh?.price)}`);

      bullets.push(`Strong bullish definition: close>open, body>=${d?.thresholds?.bodyPct ?? 0.6} of range, close in top ${d?.thresholds?.closeTopPct ?? 0.25} of range`);
      bullets.push(`Why: strong bullish = ${d?.isStrongBullish ? "YES ✅" : "NO ❌"} • break small high = ${d?.brokeHigh ? "YES ✅" : "NO ❌"}`);
    }

    // STEP: M5 entry / SL
    if (s.id === "m5_entry") {
      bullets.push("Rule: Entry zone from setup, SL below the lowest M5 low of the setup.");
      bullets.push(`Entry: ${fmtPrice(d?.entry)}`);
      bullets.push(`Stop Loss (SL): ${fmtPrice(d?.sl)}`);
      bullets.push(`Lowest M5 low used: ${fmtPrice(d?.lowestLow?.price)} @ ${fmtTime(d?.lowestLow?.time)}`);
      bullets.push(`Why: SL is below that low = ${d?.slBelow ? "YES ✅" : "NO ❌"}`);
    }

    // STEP: Targets + RR
    if (s.id === "targets_rr") {
      bullets.push("Targets: TP1 = last H1 swing high, TP2 = last H4 swing high.");
      bullets.push(`TP1 (H1 swing high): ${fmtPrice(d?.tp1)} @ ${fmtTime(d?.tp1Time)}`);
      bullets.push(`TP2 (H4 swing high): ${fmtPrice(d?.tp2)} @ ${fmtTime(d?.tp2Time)}`);
      bullets.push(`RR rule: trade allowed only if RR >= 1:${d?.minRR ?? 2}`);

      bullets.push(`Computed RR: ${fmtPrice(d?.rr)}`);
      bullets.push(`Why: RR >= min = ${d?.rrOk ? "YES ✅" : "NO ❌"}`);
    }

    // Fallback if step id unknown
    if (bullets.length === 0) {
      bullets.push("Details:");
      bullets.push(JSON.stringify(d, null, 2));
    }

    return {
      id: s.id,
      title: s.title,
      pass: !!s.pass,
      bullets,
    };
  });
}
