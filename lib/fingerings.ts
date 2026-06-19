// Standard one-octave major-scale piano fingerings, ascending (root → octave).
// RH = right hand, LH = left hand. These are the conventionally-taught fingerings;
// edit here if your teacher prefers a variant. Keyed by the circle-of-fifths major
// spelling used in lib/theory.ts (Gb stands in for F#).

export interface Fingering {
  rh: number[];
  lh: number[];
}

// White-key scales share the standard pattern.
const STANDARD: Fingering = {
  rh: [1, 2, 3, 1, 2, 3, 4, 5],
  lh: [5, 4, 3, 2, 1, 3, 2, 1],
};

export const FINGERINGS: Record<string, Fingering> = {
  C: STANDARD,
  G: STANDARD,
  D: STANDARD,
  A: STANDARD,
  E: STANDARD,
  B: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [4, 3, 2, 1, 4, 3, 2, 1] },
  Gb: { rh: [2, 3, 4, 1, 2, 3, 1, 2], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
  Db: { rh: [2, 3, 1, 2, 3, 4, 1, 2], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
  Ab: { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
  Eb: { rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
  Bb: { rh: [4, 1, 2, 3, 1, 2, 3, 4], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
  F: { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
};

export function fingeringFor(major: string): Fingering {
  return FINGERINGS[major] ?? STANDARD;
}
