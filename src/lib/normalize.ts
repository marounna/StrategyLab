export type Candle = {
  time: number; // unix seconds
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export function normalizeTwelveData(values: any[]): Candle[] {
  // TwelveData returns newest first -> we want oldest first
  const arr = (values ?? [])
    .map((v) => ({
      datetime: v.datetime,
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
    }))
    .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.open))
    .sort((a, b) => a.time - b.time);

  return arr;
}
