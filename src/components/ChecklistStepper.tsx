"use client";

export type StepUI = {
  id: string;
  title: string;
  pass: boolean;
  bullets: string[];
};

export function ChecklistStepper({
  symbol,
  lastPrice,
  steps,
}: {
  symbol?: string;
  lastPrice?: number | null;
  steps: StepUI[];
}) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-lg font-semibold">{symbol ?? ""}</div>
        <div className="text-sm opacity-70">Last price: {lastPrice ?? "—"}</div>
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex gap-3">
            <div className="mt-1 h-6 w-6 rounded-full border flex items-center justify-center text-xs">
              {idx + 1}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium">{s.title}</div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    s.pass ? "text-green-200 border-green-700/60" : "text-red-200 border-red-700/60"
                  }`}
                >
                  {s.pass ? "PASS" : "FAIL"}
                </span>
              </div>

              <ul className="mt-2 text-sm text-zinc-300 space-y-1">
                {s.bullets.map((b, i) => (
                  <li key={`${s.id}-${i}`} className="leading-relaxed">
                    • {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
