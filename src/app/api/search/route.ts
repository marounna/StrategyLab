import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Missing TWELVEDATA_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(
    q
  )}&apikey=${encodeURIComponent(key)}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  return NextResponse.json(Array.isArray(data?.data) ? data.data : []);
}
