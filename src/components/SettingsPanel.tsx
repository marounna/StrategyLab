"use client";

import type { Settings } from "@/lib/types";

export default function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
}) {
  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="text-sm text-zinc-300">Pivot Left Bars</div>
        <input
          type="number"
          className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2"
          value={settings.pivot.leftBars}
          min={1}
          max={10}
          onChange={(e) =>
            update("pivot", { ...settings.pivot, leftBars: Number(e.target.value) })
          }
        />
        <div className="text-xs text-zinc-500">default 3</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="text-sm text-zinc-300">Pivot Right Bars</div>
        <input
          type="number"
          className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2"
          value={settings.pivot.rightBars}
          min={1}
          max={10}
          onChange={(e) =>
            update("pivot", { ...settings.pivot, rightBars: Number(e.target.value) })
          }
        />
        <div className="text-xs text-zinc-500">default 3</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="text-sm text-zinc-300">Strong Bull Body %</div>
        <input
          type="number"
          className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2"
          value={settings.strongBull.bodyPct}
          step={0.05}
          min={0.3}
          max={0.9}
          onChange={(e) =>
            update("strongBull", { ...settings.strongBull, bodyPct: Number(e.target.value) })
          }
        />
        <div className="text-xs text-zinc-500">default 0.6</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="text-sm text-zinc-300">Strong Bull Close Top %</div>
        <input
          type="number"
          className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2"
          value={settings.strongBull.closeTopPct}
          step={0.05}
          min={0.1}
          max={0.5}
          onChange={(e) =>
            update("strongBull", {
              ...settings.strongBull,
              closeTopPct: Number(e.target.value),
            })
          }
        />
        <div className="text-xs text-zinc-500">default 0.25</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="text-sm text-zinc-300">Sweep Lookback (H1 bars)</div>
        <input
          type="number"
          className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2"
          value={settings.sweepLookbackBars}
          min={5}
          max={200}
          onChange={(e) => update("sweepLookbackBars", Number(e.target.value))}
        />
        <div className="text-xs text-zinc-500">default 20</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="text-sm text-zinc-300">M5 SL Lookback (bars)</div>
        <input
          type="number"
          className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2"
          value={settings.m5StopLookbackBars}
          min={5}
          max={300}
          onChange={(e) => update("m5StopLookbackBars", Number(e.target.value))}
        />
        <div className="text-xs text-zinc-500">default 30</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="text-sm text-zinc-300">Min RR</div>
        <input
          type="number"
          className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2"
          value={settings.minRR}
          step={0.25}
          min={1}
          max={10}
          onChange={(e) => update("minRR", Number(e.target.value))}
        />
        <div className="text-xs text-zinc-500">default 2.0</div>
      </div>
    </div>
  );
}
