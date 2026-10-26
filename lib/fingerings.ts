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

// Suggested one-octave patterns, not a claim that one fingering suits every hand.
// Natural minor uses the same note-to-finger choices in both directions.
// References (variants are normal):
// https://vip.wartburg.edu/musicdept/fandp.pdf
// https://colorinmypiano.com/download/scale__arpeggio_fingerings_for_piano_2_octave.pdf
// The latter's octave-ending RH 5 / LH 1 is used for white/all-black triads;
// mixed black-key arpeggios retain their turning finger on the top tonic.
export const NATURAL_MINOR_FINGERINGS: Record<string, Fingering> = {
  A: STANDARD,
  D: STANDARD,
  G: STANDARD,
  C: STANDARD,
  F: { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
  Bb: { rh: [2, 1, 2, 3, 1, 2, 3, 4], lh: [2, 1, 3, 2, 1, 4, 3, 2] },
  Eb: { rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [2, 1, 4, 3, 2, 1, 3, 2] },
  "G#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 3, 2, 1, 4, 3] },
  "C#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
  "F#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
  B: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [4, 3, 2, 1, 4, 3, 2, 1] },
  E: STANDARD,
};

const WHITE_ARPEGGIO: Fingering = { rh: [1, 2, 3, 5], lh: [5, 4, 2, 1] };
const WIDE_ARPEGGIO: Fingering = { rh: [1, 2, 3, 5], lh: [5, 3, 2, 1] };
const BLACK_WHITE_BLACK: Fingering = { rh: [2, 1, 2, 4], lh: [3, 1, 4, 2] };
export const MAJOR_ARPEGGIO_FINGERINGS: Record<string, Fingering> = {
  C: WHITE_ARPEGGIO,
  F: WHITE_ARPEGGIO,
  G: WHITE_ARPEGGIO,
  D: WIDE_ARPEGGIO,
  A: WIDE_ARPEGGIO,
  E: WIDE_ARPEGGIO,
  B: WIDE_ARPEGGIO,
  Gb: WIDE_ARPEGGIO,
  Db: BLACK_WHITE_BLACK,
  Eb: BLACK_WHITE_BLACK,
  Ab: BLACK_WHITE_BLACK,
  Bb: BLACK_WHITE_BLACK,
};
export const MINOR_ARPEGGIO_FINGERINGS: Record<string, Fingering> = {
  A: WHITE_ARPEGGIO,
  D: WHITE_ARPEGGIO,
  E: WHITE_ARPEGGIO,
  B: WHITE_ARPEGGIO,
  C: WHITE_ARPEGGIO,
  F: WHITE_ARPEGGIO,
  G: WHITE_ARPEGGIO,
  Eb: WHITE_ARPEGGIO,
  "C#": BLACK_WHITE_BLACK,
  "F#": BLACK_WHITE_BLACK,
  "G#": BLACK_WHITE_BLACK,
  Bb: { rh: [2, 3, 1, 2], lh: [3, 2, 1, 3] },
};

/** Explicit lookup: unsupported keys must not silently acquire C's fingering. */
export function practiceFingeringFor(
  tonic: string,
  mode: "major" | "minor",
  arpeggio: boolean,
): Fingering | undefined {
  const table = arpeggio
    ? mode === "major"
      ? MAJOR_ARPEGGIO_FINGERINGS
      : MINOR_ARPEGGIO_FINGERINGS
    : mode === "major"
      ? FINGERINGS
      : NATURAL_MINOR_FINGERINGS;
  const fingering = table[tonic];
  return fingering
    ? { rh: [...fingering.rh], lh: [...fingering.lh] }
    : undefined;
}
