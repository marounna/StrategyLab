import { z } from "zod";

const BASE = "https://api.twelvedata.com";

function mustKey() {
  const k = process.env.TWELVEDATA_API_KEY;
  if (!k) throw new Error("Missing TWELVEDATA_API_KEY in .env.local");
  return k;
}

export const SymbolSearchItem = z.object({
  symbol: z.string(),
  instrument_name: z.string().optional(),
  exchange: z.string().optional(),
  mic_code: z.string().optional(),
  currency: z.string().optional(),
  country: z.string().optional(),
  instrument_type: z.string().optional(),
});
export type SymbolSearchItem = z.infer<typeof SymbolSearchItem>;

export async function symbolSearch(query: string): Promise<SymbolSearchItem[]> {
  const url = new URL(`${BASE}/symbol_search`);
  url.searchParams.set("symbol", query);
  url.searchParams.set("apikey", mustKey());

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`TwelveData symbol_search failed: ${res.status}`);
  const data = await res.json();

  // Twelve Data returns { data: [...] } on success
  const arr = Array.isArray(data?.data) ? data.data : [];
  return arr.map((x: unknown) => SymbolSearchItem.parse(x));
}

export type Candle = {
  time: number; // unix seconds (chart lib uses seconds)
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export async function timeSeries(symbol: string, interval: string, outputsize = 500): Promise<{
  meta: any;
  candles: Candle[];
}> {
  const url = new URL(`${BASE}/time_series`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("apikey", mustKey());

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok || data?.status === "error") {
    throw new Error(data?.message ?? `TwelveData time_series failed: ${res.status}`);
  }

  const values = Array.isArray(data?.values) ? data.values : [];
  // values are time-desc; convert to asc for calculations
  const candles: Candle[] = values
    .map((v: any) => ({
      datetime: String(v.datetime),
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
      volume: v.volume != null ? Number(v.volume) : undefined,
    }))
    .reverse();

  return { meta: data?.meta, candles };
}
