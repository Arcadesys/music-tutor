export type PracticeMode = "major" | "minor";

// Common working spellings for a practical cycle of ascending fourths.
// Enharmonic spellings keep the cycle playable without theoretical key names.
export const MAJOR_FOURTHS = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "B", "E", "A", "D", "G"] as const;
export const MINOR_FOURTHS = ["Am", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm", "G#m", "C#m", "F#m", "Bm", "Em"] as const;

export function cycleFor(mode: PracticeMode): readonly string[] {
  return mode === "major" ? MAJOR_FOURTHS : MINOR_FOURTHS;
}

export function tonicFor(mode: PracticeMode, key: string): string {
  return mode === "minor" && key.endsWith("m") ? key.slice(0, -1) : key;
}

export function rotateCycle(mode: PracticeMode, startingKey: string): string[] {
  const keys = [...cycleFor(mode)];
  const start = keys.indexOf(startingKey);
  if (start < 0) return keys;
  return [...keys.slice(start), ...keys.slice(0, start)];
}

export function splitSessionMinutes(total: number): {
  hanon: number;
  scales: number;
  arpeggios: number;
} {
  const remaining = Math.max(4, total - 2);
  const scales = Math.ceil(remaining * 0.6);
  return { hanon: 2, scales, arpeggios: remaining - scales };
}
