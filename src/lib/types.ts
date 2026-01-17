export type IntervalKey = "h4" | "h1" | "m15" | "m5";

export type Settings = {
  strongBodyMin: number;
  strongCloseTopPct: number;
  pivot: { leftBars: number; rightBars: number };
  strongBull: { bodyPct: number; closeTopPct: number };
  sweepLookbackBars: number;
  m5StopLookbackBars: number;
  minRR: number;
};

export const DEFAULT_SETTINGS: Settings = {
  pivot: { leftBars: 3, rightBars: 3 },
  strongBull: { bodyPct: 0.6, closeTopPct: 0.25 },
  sweepLookbackBars: 20,
  m5StopLookbackBars: 30,
  minRR: 2.0,
  strongBodyMin: 0,
  strongCloseTopPct: 0
};

export type Candle = {
  time: number;
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type Pivot = {
  index: number;
  time: number;
  price: number;
  kind: "high" | "low";
};

export type StepKey = string; // tighten later

export type ChecklistStep = {
  key: StepKey;
  title: string;
  pass?: string | null;
  details: Record<string, string>;
};

export type ChecklistResult = {
  symbol: string;
  lastPrice: number | null;
  steps: ChecklistStep[];
  entry?: { price: number; time: number; datetime: string };
  stop?: { price: number; time: number; datetime: string };
  targets?: { tp1: number; tp2: number };
  rr?: number | null;
};
