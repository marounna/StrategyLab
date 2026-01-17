import { NextResponse } from "next/server";

type Interval = "5min" | "15min" | "1h" | "4h";

const CACHE_MS = 5 * 60 * 1000;
const mem = new Map<string, { at: number; data: any }>();

export async function GET(req: Request) {
  const u = new URL(req.url);
  const symbol = (u.searchParams.get("symbol") || "").trim().toUpperCase();
  const interval = (u.searchParams.get("interval") || "").trim() as Interval;
  const outputsize = Number(u.searchParams.get("outputsize") || "300");

  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  if (!["5min", "15min", "1h", "4h"].includes(interval))
    return NextResponse.json({ error: "Invalid interval" }, { status: 400 });

  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) return NextResponse.json({ error: "Missing TWELVEDATA_API_KEY" }, { status: 500 });

  const cacheKey = `${symbol}:${interval}:${outputsize}`;
  const hit = mem.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json({ ...hit.data, cached: true });
  }

  const url =
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&outputsize=${encodeURIComponent(String(outputsize))}` +
    `&apikey=${encodeURIComponent(key)}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  // TwelveData errors often come as { status:"error", message:"...", code:... }
  if (data?.status === "error") {
    return NextResponse.json(
      { error: data.message || "Provider error", code: data.code },
      { status: 429 }
    );
  }

  mem.set(cacheKey, { at: Date.now(), data });
  return NextResponse.json({ ...data, cached: false });
}
