// Tiny localStorage helper for per-mode progress. No backend needed.

export interface Progress {
  correct: number;
  attempts: number;
  streak: number;
  bestStreak: number;
}

const EMPTY: Progress = { correct: 0, attempts: 0, streak: 0, bestStreak: 0 };
const key = (mode: string) => `music-tutor:progress:${mode}`;

export function loadProgress(mode: string): Progress {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(key(mode));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export function recordResult(mode: string, correct: boolean): Progress {
  const prev = loadProgress(mode);
  const streak = correct ? prev.streak + 1 : 0;
  const next: Progress = {
    correct: prev.correct + (correct ? 1 : 0),
    attempts: prev.attempts + 1,
    streak,
    bestStreak: Math.max(prev.bestStreak, streak),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key(mode), JSON.stringify(next));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }
  return next;
}

export function resetProgress(mode: string): Progress {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(key(mode));
    } catch {
      // ignore
    }
  }
  return { ...EMPTY };
}
