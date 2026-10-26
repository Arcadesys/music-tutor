"use client";

import type { Progress } from "@/lib/storage";

export function ScoreBoard({ progress }: { progress: Progress }) {
  const pct = progress.attempts ? Math.round((progress.correct / progress.attempts) * 100) : 0;
  const stat = (label: string, value: string | number) => (
    <div className="flex flex-col items-center px-3">
      <span className="text-2xl font-bold tabular-nums text-[var(--ink)]">{value}</span>
      <span className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</span>
    </div>
  );
  return (
    <div
      className="flex items-center divide-x divide-slate-700 rounded-xl bg-[var(--surface)] py-2"
      aria-label="Score"
    >
      {stat("Streak", progress.streak)}
      {stat("Best", progress.bestStreak)}
      {stat("Correct", `${progress.correct}/${progress.attempts}`)}
      {stat("Accuracy", `${pct}%`)}
    </div>
  );
}
