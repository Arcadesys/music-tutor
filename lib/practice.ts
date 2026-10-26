export type PracticeMode = "major" | "minor";

// Common working spellings for a practical cycle of ascending fourths.
// Enharmonic spellings keep the cycle playable without theoretical key names.
export const MAJOR_FOURTHS = [
  "C",
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
  "Gb",
  "B",
  "E",
  "A",
  "D",
  "G",
] as const;
export const MINOR_FOURTHS = [
  "Am",
  "Dm",
  "Gm",
  "Cm",
  "Fm",
  "Bbm",
  "Ebm",
  "G#m",
  "C#m",
  "F#m",
  "Bm",
  "Em",
] as const;

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

import {
  ascendingScaleMidis,
  diatonicTriads,
  modeScale,
  noteToMidi,
  pitchClass,
  type Chord,
} from "./theory";
export type Activity =
  | "Hanon"
  | "Scales"
  | "Arpeggios"
  | "Chord-chart accompaniment"
  | "Listening / reflection";
export const ACTIVITIES: Activity[] = [
  "Hanon",
  "Scales",
  "Arpeggios",
  "Chord-chart accompaniment",
  "Listening / reflection",
];
export type Rating = "Needs work" | "Getting there" | "Comfortable";
export const RATINGS: Rating[] = ["Needs work", "Getting there", "Comfortable"];
export interface Progression {
  id: string;
  mode: PracticeMode;
  degrees: number[];
  romans: string[];
  altered?: boolean;
}
export const PROGRESSIONS: Progression[] = [
  {
    id: "major-1451",
    mode: "major",
    degrees: [0, 3, 4, 0],
    romans: ["I", "IV", "V", "I"],
  },
  {
    id: "major-251",
    mode: "major",
    degrees: [1, 4, 0, 0],
    romans: ["ii", "V", "I", "I"],
  },
  {
    id: "major-1645",
    mode: "major",
    degrees: [0, 5, 3, 4],
    romans: ["I", "vi", "IV", "V"],
  },
  {
    id: "major-1564",
    mode: "major",
    degrees: [0, 4, 5, 3],
    romans: ["I", "V", "vi", "IV"],
  },
  {
    id: "minor-1451",
    mode: "minor",
    degrees: [0, 3, 4, 0],
    romans: ["i", "iv", "v", "i"],
  },
  {
    id: "minor-1671",
    mode: "minor",
    degrees: [0, 5, 6, 0],
    romans: ["i", "♭VI", "♭VII", "i"],
  },
  {
    id: "minor-14V1",
    mode: "minor",
    degrees: [0, 3, 4, 0],
    romans: ["i", "iv", "V", "i"],
    altered: true,
  },
  {
    id: "minor-2V1",
    mode: "minor",
    degrees: [1, 4, 0, 0],
    romans: ["ii°", "V", "i", "i"],
    altered: true,
  },
];
export interface AccompanimentPattern {
  id: string;
  label: string;
  offsets: number[];
  beats: number[];
  lengths: number[];
}
export const PATTERNS: AccompanimentPattern[] = [
  { id: "roots", label: "Held roots", offsets: [0], beats: [0], lengths: [4] },
  {
    id: "alternating",
    label: "Alternating root / fifth",
    offsets: [0, 7],
    beats: [0, 2],
    lengths: [2, 2],
  },
  {
    id: "broken",
    label: "Broken root–fifth–octave–fifth",
    offsets: [0, 7, 12, 7],
    beats: [0, 1, 2, 3],
    lengths: [1, 1, 1, 1],
  },
];
export interface SessionPlan {
  mode: PracticeMode;
  keys: string[];
  minutes: number[];
}
export function sessionPlan(
  mode: PracticeMode,
  start: string,
  duration: number,
): SessionPlan {
  return {
    mode,
    keys: rotateCycle(mode, start).slice(0, 3),
    minutes: [
      duration * 0.1,
      duration * 0.2,
      duration * 0.2,
      duration * 0.35,
      duration * 0.15,
    ],
  };
}
export function nextSessionKey(mode: PracticeMode, start: string): string {
  return rotateCycle(mode, start)[3];
}
export interface ChartBar {
  chord: Chord;
  name: string;
  roman: string;
}
export function chartFor(key: string, progression: Progression): ChartBar[] {
  const tonic = tonicFor(progression.mode, key);
  const triads = diatonicTriads(
    tonic,
    progression.mode === "major" ? "ionian" : "aeolian",
  );
  return progression.degrees.map((degree, index) => {
    let chord = triads[degree];
    if (degree === 4 && progression.altered) {
      const notes = [...chord.notes];
      // Raise the spelled third of V by a semitone: the natural minor leading note.
      const third = notes[1];
      notes[1] = third.endsWith("b") ? third.slice(0, -1) : third + "#";
      chord = { ...chord, quality: "major", notes };
    }
    return {
      chord,
      roman: progression.romans[index],
      name:
        chord.root +
        (chord.quality === "minor"
          ? "m"
          : chord.quality === "diminished"
            ? "°"
            : ""),
    };
  });
}
export interface PlaybackEvent {
  midis: number[];
  beat: number;
  beats: number;
}
export function techniqueEvents(
  key: string,
  mode: PracticeMode,
  arpeggio: boolean,
): PlaybackEvent[] {
  const tonic = tonicFor(mode, key);
  const notes = arpeggio
    ? diatonicTriads(tonic, mode === "major" ? "ionian" : "aeolian")[0].notes
    : modeScale(tonic, mode === "major" ? "ionian" : "aeolian");
  const up = ascendingScaleMidis(notes, 4);
  return [...up, ...up.slice(0, -1).reverse()].map((midi, beat) => ({
    midis: [midi],
    beat,
    beats: 1,
  }));
}
export function accompanimentEvents(
  chart: ChartBar[],
  pattern: AccompanimentPattern,
): PlaybackEvent[] {
  return chart.flatMap((bar, i) => {
    const right = ascendingScaleMidis(bar.chord.notes, 4).slice(0, -1);
    const root = noteToMidi(bar.chord.root, 2);
    const sameAsPrevious = i > 0 && chart[i - 1].name === bar.name;
    const sameAsNext = i < chart.length - 1 && chart[i + 1].name === bar.name;
    return [
      ...(sameAsPrevious
        ? []
        : [{ midis: right, beat: i * 4, beats: sameAsNext ? 8 : 4 }]),
      ...pattern.offsets.map((offset, j) => ({
        midis: [
          root +
            (offset === 7
              ? (pitchClass(bar.chord.notes[2]) -
                  pitchClass(bar.chord.root) +
                  12) %
                12
              : offset),
        ],
        beat: i * 4 + pattern.beats[j],
        beats: pattern.lengths[j],
      })),
    ];
  });
}
export function timedEvents(events: PlaybackEvent[], tempo: number) {
  return events.map((event) => ({
    ...event,
    seconds: (event.beat * 60) / tempo,
    duration: ((event.beats * 60) / tempo) * 0.9,
  }));
}
export interface PracticeAttempt {
  key: string;
  mode: PracticeMode;
  activity: Activity;
  rating: Rating;
  notes: string;
  tempo: number;
  progression: string;
  pattern: string;
  date: string;
}
export function nextActivity(step: number, keyIndex: number): [number, number] {
  return step === 0 || keyIndex === 2 ? [step + 1, 0] : [step, keyIndex + 1];
}

export function techniqueLabels(
  key: string,
  mode: PracticeMode,
  arpeggio: boolean,
): string[] {
  const tonic = tonicFor(mode, key);
  const notes = arpeggio
    ? diatonicTriads(tonic, mode === "major" ? "ionian" : "aeolian")[0].notes
    : modeScale(tonic, mode === "major" ? "ionian" : "aeolian");
  const up = [...notes, notes[0]];
  const spelled = [...up, ...up.slice(0, -1).reverse()];
  return techniqueEvents(key, mode, arpeggio).map(
    (event, i) => spelled[i] + (Math.floor(event.midis[0] / 12) - 1),
  );
}
