// Pure, framework-free music-theory core.
// Everything here is deterministic and unit-tested in __tests__/theory.test.ts.

export type Quality = "major" | "minor" | "diminished" | "augmented";

/** The seven diatonic modes, named by their classical Greek labels. */
export type Mode =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian";

/** Scale degree (0-based) each mode starts on within the parent major scale. */
const MODE_DEGREE: Record<Mode, number> = {
  ionian: 0,
  dorian: 1,
  phrygian: 2,
  lydian: 3,
  mixolydian: 4,
  aeolian: 5,
  locrian: 6,
};

/** Human-facing label for each mode, e.g. "Mixolydian". */
export function modeLabel(mode: Mode): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export interface Chord {
  /** Roman-numeral label, e.g. "I", "ii", "vii°", "♭VII". */
  roman: string;
  /** Spelled root note, e.g. "C", "F#", "Bb". */
  root: string;
  quality: Quality;
  /** The three spelled triad notes, root position. */
  notes: string[];
}

export interface CircleKey {
  /** Position 0..11 clockwise from C. */
  position: number;
  /** Major key, primary spelling. */
  major: string;
  /** Relative minor, e.g. "Am". */
  minor: string;
  /** Number of accidentals in the key signature. */
  accidentals: number;
  /** True for sharp keys, false for flat keys (C has 0, treated as neither). */
  sharps: boolean;
  /** Alternate enharmonic major spelling where one exists (e.g. "F#" for "Gb"). */
  enharmonicMajor?: string;
}

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const NATURAL_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_STEPS = [2, 2, 1, 2, 2, 2, 1]; // semitones between consecutive scale degrees

function parseNote(name: string): { letter: string; acc: number } {
  const letter = name[0].toUpperCase();
  let acc = 0;
  for (const ch of name.slice(1)) {
    if (ch === "#" || ch === "♯") acc++;
    else if (ch === "b" || ch === "♭") acc--;
  }
  return { letter, acc };
}

function pitchClassOf(letter: string, acc: number): number {
  return (((NATURAL_PC[letter] + acc) % 12) + 12) % 12;
}

/** Pitch class (0–11) of a spelled note. */
export function pitchClass(note: string): number {
  const { letter, acc } = parseNote(note);
  return pitchClassOf(letter, acc);
}

function noteName(letter: string, acc: number): string {
  const sym = acc > 0 ? "#".repeat(acc) : acc < 0 ? "b".repeat(-acc) : "";
  return letter + sym;
}

/** Nearest accidental so that `letter` spells `targetPc`. Range roughly -2..+2. */
function accidentalFor(letter: string, targetPc: number): number {
  let a = targetPc - NATURAL_PC[letter];
  if (a > 6) a -= 12;
  if (a < -6) a += 12;
  return a;
}

/** Spell an interval above a root by stepping `letterSteps` letters and `semitones`. */
function spellInterval(root: string, letterSteps: number, semitones: number): string {
  const { letter, acc } = parseNote(root);
  const rootPc = pitchClassOf(letter, acc);
  const li = (LETTERS.indexOf(letter as (typeof LETTERS)[number]) + letterSteps) % 7;
  const l = LETTERS[li];
  const targetPc = (rootPc + semitones) % 12;
  return noteName(l, accidentalFor(l, targetPc));
}

/**
 * Notes of a diatonic mode with correct enharmonic spelling (one note per
 * letter). The step pattern is the major-scale pattern rotated to start on the
 * mode's degree, so e.g. Dorian uses the major steps beginning at degree 2.
 */
export function modeScale(tonic: string, mode: Mode = "ionian"): string[] {
  const { letter, acc } = parseNote(tonic);
  const startLetterIdx = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
  const startPc = pitchClassOf(letter, acc);
  const offset = MODE_DEGREE[mode];
  const notes: string[] = [];
  let pc = startPc;
  for (let i = 0; i < 7; i++) {
    const l = LETTERS[(startLetterIdx + i) % 7];
    const targetPc = i === 0 ? startPc : (pc + MAJOR_STEPS[(offset + i - 1) % 7]) % 12;
    notes.push(noteName(l, accidentalFor(l, targetPc)));
    pc = targetPc;
  }
  return notes;
}

/** Notes of a major (Ionian) scale. Thin wrapper over {@link modeScale}. */
export function majorScale(tonic: string): string[] {
  return modeScale(tonic, "ionian");
}

function qualityFromTriad(rootPc: number, thirdPc: number, fifthPc: number): Quality {
  const t = (((thirdPc - rootPc) % 12) + 12) % 12;
  const f = (((fifthPc - rootPc) % 12) + 12) % 12;
  if (t === 4 && f === 7) return "major";
  if (t === 3 && f === 7) return "minor";
  if (t === 3 && f === 6) return "diminished";
  if (t === 4 && f === 8) return "augmented";
  throw new Error(`Unrecognized triad intervals: third ${t}, fifth ${f}`);
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
/** Semitones above the tonic for each major-scale degree. */
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

/** How far a degree is altered vs. its parallel-major counterpart: -1 ♭, +1 ♯. */
function degreeAlter(pc: number, tonicPc: number, degree: number): number {
  const interval = (((pc - tonicPc) % 12) + 12) % 12;
  let d = interval - MAJOR_INTERVALS[degree];
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return d;
}

/** Roman numeral for a degree, with quality casing and any chromatic prefix. */
function romanFor(degree: number, quality: Quality, alter = 0): string {
  let r = ROMAN[degree];
  if (quality === "minor" || quality === "diminished") r = r.toLowerCase();
  if (quality === "diminished") r += "°";
  if (quality === "augmented") r += "+";
  const prefix = alter < 0 ? "♭".repeat(-alter) : alter > 0 ? "♯".repeat(alter) : "";
  return prefix + r;
}

/** The seven diatonic triads of a key in the given mode, by scale degree. */
export function diatonicTriads(tonic: string, mode: Mode = "ionian"): Chord[] {
  const scale = modeScale(tonic, mode);
  const pcs = scale.map(pitchClass);
  const tonicPc = pcs[0];
  const chords: Chord[] = [];
  for (let i = 0; i < 7; i++) {
    const third = (i + 2) % 7;
    const fifth = (i + 4) % 7;
    const quality = qualityFromTriad(pcs[i], pcs[third], pcs[fifth]);
    chords.push({
      roman: romanFor(i, quality, degreeAlter(pcs[i], tonicPc, i)),
      root: scale[i],
      quality,
      notes: [scale[i], scale[third], scale[fifth]],
    });
  }
  return chords;
}

/** The ♭VII major chord (Mixolydian / borrowed), e.g. Bb in C major. */
export function flatSevenChord(tonic: string): Chord {
  const { letter, acc } = parseNote(tonic);
  const tonicPc = pitchClassOf(letter, acc);
  const rootLetter = LETTERS[(LETTERS.indexOf(letter as (typeof LETTERS)[number]) + 6) % 7];
  const rootPc = ((tonicPc - 2) % 12 + 12) % 12;
  const root = noteName(rootLetter, accidentalFor(rootLetter, rootPc));
  return {
    roman: "♭VII",
    root,
    quality: "major",
    notes: [root, spellInterval(root, 2, 4), spellInterval(root, 4, 7)],
  };
}

/** The circle of fifths, clockwise from C (position 0). */
export const CIRCLE: CircleKey[] = [
  { position: 0, major: "C", minor: "Am", accidentals: 0, sharps: true },
  { position: 1, major: "G", minor: "Em", accidentals: 1, sharps: true },
  { position: 2, major: "D", minor: "Bm", accidentals: 2, sharps: true },
  { position: 3, major: "A", minor: "F#m", accidentals: 3, sharps: true },
  { position: 4, major: "E", minor: "C#m", accidentals: 4, sharps: true },
  { position: 5, major: "B", minor: "G#m", accidentals: 5, sharps: true, enharmonicMajor: "Cb" },
  { position: 6, major: "Gb", minor: "Ebm", accidentals: 6, sharps: false, enharmonicMajor: "F#" },
  { position: 7, major: "Db", minor: "Bbm", accidentals: 5, sharps: false, enharmonicMajor: "C#" },
  { position: 8, major: "Ab", minor: "Fm", accidentals: 4, sharps: false },
  { position: 9, major: "Eb", minor: "Cm", accidentals: 3, sharps: false },
  { position: 10, major: "Bb", minor: "Gm", accidentals: 2, sharps: false },
  { position: 11, major: "F", minor: "Dm", accidentals: 1, sharps: false },
];

/** Keys in circle order. Clockwise adds sharps (C,G,D…); counter adds flats (C,F,Bb…). */
export function keysAroundCircle(direction: "clockwise" | "counterclockwise"): string[] {
  const majors = CIRCLE.map((k) => k.major);
  if (direction === "clockwise") return majors;
  // counterclockwise: C, then walk backwards (F, Bb, Eb …)
  return [majors[0], ...majors.slice(1).reverse()];
}

/** Look up a circle entry by either major or minor spelling (incl. enharmonics). */
export function findCircleKey(name: string): CircleKey | undefined {
  return CIRCLE.find(
    (k) => k.major === name || k.minor === name || k.enharmonicMajor === name,
  );
}

/** MIDI number for a spelled note at a given octave (C4 = middle C = 60). */
export function noteToMidi(note: string, octave: number): number {
  return 12 * (octave + 1) + pitchClass(note);
}

/**
 * Ascending MIDI numbers for a scale: each note placed so the line keeps rising,
 * with the octave tonic appended. Shared by the audio engine and the keyboard view.
 */
export function ascendingScaleMidis(notes: string[], startOctave = 4): number[] {
  const midis: number[] = [];
  let oct = startOctave;
  let prev = -Infinity;
  for (const n of notes) {
    let m = noteToMidi(n, oct);
    while (m <= prev) {
      oct++;
      m = noteToMidi(n, oct);
    }
    midis.push(m);
    prev = m;
  }
  midis.push(midis[0] + 12);
  return midis;
}

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Sharp-spelled note name with octave for a MIDI number (60 → "C4"). */
export function midiToNoteName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${SHARP_NAMES[pc]}${octave}`;
}

// Movable-do solfège: Do = tonic. Lowered degrees use the descending forms
// (ra/me/se/le/te); the raised fourth uses fi (Lydian). Indexed by semitones
// above the tonic.
const SOLFEGE = ["do", "ra", "re", "me", "mi", "fa", "fi", "sol", "le", "la", "te", "ti"];

/**
 * Movable-do solfège syllable for a note relative to a tonic, e.g.
 * solfege("E", "C") → "mi", solfege("Bb", "C") → "te".
 */
export function solfege(note: string, tonic: string): string {
  const interval = (((pitchClass(note) - pitchClass(tonic)) % 12) + 12) % 12;
  return SOLFEGE[interval];
}

/** Convert ascii accidentals to pretty Unicode symbols for display. */
export function pretty(note: string): string {
  return note.replace(/##/g, "𝄪").replace(/bb/g, "𝄫").replace(/#/g, "♯").replace(/b/g, "♭");
}
