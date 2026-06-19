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

// --- Per-item miss tracking (lightweight spaced repetition) -----------------
// Each drill can record results for individual items (a chord degree, a key,
// a note…) so the ones the user misses resurface more often. Stored under a
// separate key so it never interferes with the headline Progress numbers.

type Misses = Record<string, number>;
const missKey = (mode: string) => `music-tutor:misses:${mode}`;

export function loadMisses(mode: string): Misses {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(missKey(mode));
    return raw ? (JSON.parse(raw) as Misses) : {};
  } catch {
    return {};
  }
}

/** Record one attempt at a specific item: misses climb on wrong, ease on right. */
export function recordItem(mode: string, itemId: string, correct: boolean): Misses {
  const misses = loadMisses(mode);
  const prev = misses[itemId] ?? 0;
  const next = correct ? Math.max(0, prev - 1) : prev + 1;
  if (next === 0) delete misses[itemId];
  else misses[itemId] = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(missKey(mode), JSON.stringify(misses));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }
  return misses;
}

/**
 * Pick an item id, biasing toward ones with more recorded misses. Every item
 * gets a base weight of 1 plus its miss count, so unseen items still appear.
 * Deterministic only in the `rand` you pass (defaults to Math.random).
 */
export function pickWeighted(ids: string[], misses: Misses, rand = Math.random): string {
  const weights = ids.map((id) => 1 + (misses[id] ?? 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < ids.length; i++) {
    r -= weights[i];
    if (r < 0) return ids[i];
  }
  return ids[ids.length - 1];
}
