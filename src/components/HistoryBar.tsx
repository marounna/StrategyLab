"use client";

import { useEffect, useState } from "react";

export type HistoryItem = {
  symbol: string;
  name?: string;
  at: number; // Date.now()
  ok: boolean;
  entry?: number | null;
  sl?: number | null;
  tp1?: number | null;
  rr?: number | null;
};

const KEY = "long-checklist:history:v1";
const MAX = 7;

// Always visible quick picks (7)
const QUICK_PICKS: PickItem[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "META", name: "Meta Platforms" },
];

type PickItem = { symbol: string; name?: string };

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
}

export function upsertHistory(next: HistoryItem) {
  const sym = next.symbol.toUpperCase();
  const items = loadHistory();
  const filtered = items.filter((x) => x.symbol.toUpperCase() !== sym);
  const merged = [next, ...filtered].slice(0, MAX);
  saveHistory(merged);
  return merged;
}

function fmt(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : "—";
}

function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-200">{title}</div>
        {right ?? null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function HistoryBar({ onPick }: { onPick: (symbol: string) => void }) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  // load on mount
  useEffect(() => {
    setItems(loadHistory());
  }, []);

  // optional: keep in sync if other tabs change history
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setItems(loadHistory());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function clearHistory() {
    localStorage.removeItem(KEY);
    setItems([]);
  }

  return (
    <div className="mt-4 space-y-3">
      {/* QUICK PICKS (always) */}
      <Section title="Quick Picks">
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-pro">
          {QUICK_PICKS.map((p, idx) => (
            <button
              key={`${p.symbol}-${idx}`}
              type="button"
              onClick={() => onPick(p.symbol)}
              className="min-w-[220px] text-left rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 px-3 py-2"
              title="Click to run checklist"
            >
              <div className="flex items-center justify-between gap-2 ">
                <div className="font-semibold">{p.symbol}</div>
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">
                  Run
                </span>
              </div>
              {p.name ? <div className="text-xs text-zinc-400 truncate">{p.name}</div> : null}
              <div className="mt-2 text-xs text-zinc-400">Click to run checklist</div>
            </button>
          ))}
        </div>
      </Section>

      {/* HISTORY */}
      <Section
        title={`History (last ${Math.min(MAX, items.length)})`}
        right={
          items.length ? (
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Clear
            </button>
          ) : null
        }
      >
        {items.length === 0 ? (
          <div className="text-sm text-zinc-400">No history yet. Pick something above.</div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-pro">
            {items.map((h) => (
              <button
                key={`${h.symbol}-${h.at}`}
                type="button"
                onClick={() => onPick(h.symbol)}
                className="min-w-[260px] text-left rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 px-3 py-2"
                title="Click to load"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{h.symbol}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      h.ok
                        ? "text-green-200 border-green-700/60"
                        : "text-red-200 border-red-700/60"
                    }`}
                  >
                    {h.ok ? "TRADE OK" : "NO TRADE"}
                  </span>
                </div>

                {h.name ? <div className="text-xs text-zinc-400 truncate">{h.name}</div> : null}

                <div className="mt-2 text-xs text-zinc-300">
                  Entry {fmt(h.entry)} • SL {fmt(h.sl)} • TP1 {fmt(h.tp1)} • RR {fmt(h.rr)}
                </div>

                <div className="mt-1 text-[11px] text-zinc-500">
                  {new Date(h.at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
