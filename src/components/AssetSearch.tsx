"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";

type Asset = {
  symbol: string;
  instrument_name?: string;
  exchange?: string;
  mic_code?: string;
  currency?: string;
};

export default function AssetSearch({
  onSelect,
}: {
  onSelect: (asset: Asset) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawResults, setRawResults] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close on ESC (global)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Fetch server results (debounced)
  useEffect(() => {
    const qq = q.trim();
    if (qq.length === 0) {
      setRawResults([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(qq)}`);
        const data = (await res.json()) as Asset[];
        const arr = Array.isArray(data) ? data : [];
        setRawResults(arr);
        setOpen(true);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q]);

  const fuse = useMemo(() => {
    return new Fuse(rawResults, {
      keys: ["symbol", "instrument_name", "exchange"],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [rawResults]);

  const results = useMemo(() => {
    const qq = q.trim();
    if (!qq) return [];
    return fuse.search(qq).slice(0, 8).map((r) => r.item);
  }, [fuse, q]);

  // Keep activeIndex in range
  useEffect(() => {
    if (!open) return;
    if (results.length === 0) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= results.length) setActiveIndex(results.length - 1);
  }, [results.length, open, activeIndex]);

  function pick(a: Asset) {
    onSelect(a);
    setQ(a.symbol);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur(); // hide mobile keyboard
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (q.trim().length > 0) setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i < 0 ? 0 : Math.min(results.length - 1, i + 1)));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? 0 : i - 1));
    }

    if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      if (results.length === 0) return;
      const idx = activeIndex >= 0 ? activeIndex : 0;
      const a = results[idx];
      if (a) pick(a);
    }
  }

  const showDropdown = open && q.trim().length > 0;

  return (
    <div ref={rootRef} className="relative mt-6">
      <label className="block text-sm text-zinc-300 mb-2">Symbol / Name</label>

      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (!open && e.target.value.trim().length > 0) setOpen(true);
        }}
        onFocus={() => {
          if (q.trim().length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder='Try "TSLA", "SPY", "jp morgan"...'
        className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-2 text-white outline-none focus:border-zinc-500"
      />

      <div className="mt-2 text-xs text-zinc-500">
        {loading ? "Searching..." : " "}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 shadow-lg overflow-hidden">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-zinc-400">
              No results for <span className="text-zinc-200">"{q.trim()}"</span>
            </div>
          ) : (
            results.map((a, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={`${a.symbol}-${a.exchange ?? ""}-${a.mic_code ?? ""}-${idx}`}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => pick(a)}
                  className={`w-full text-left px-4 py-3 ${
                    active ? "bg-zinc-900" : "hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{a.symbol}</div>
                    <div className="text-xs text-zinc-400">
                      {a.exchange ?? a.mic_code ?? ""}
                    </div>
                  </div>
                  <div className="text-sm text-zinc-300">
                    {a.instrument_name ?? ""}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
