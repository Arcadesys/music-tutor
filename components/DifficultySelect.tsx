"use client";

import { Button } from "./Button";

/** Shared difficulty levels. Each drill decides what they mean. */
export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  /** Optional short hint shown under the buttons describing the current level. */
  hint?: string;
}

export function DifficultySelect({ value, onChange, hint }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">Difficulty:</span>
        {DIFFICULTIES.map((d) => (
          <Button
            key={d}
            variant={value === d ? "primary" : "ghost"}
            className="px-3 py-1.5 text-sm capitalize"
            aria-pressed={value === d}
            onClick={() => onChange(d)}
          >
            {d}
          </Button>
        ))}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
