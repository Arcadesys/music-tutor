// Tone.js audio wrapper. Audio is core to this app (ear training over reading
// tiny notation), so every quiz plays what it asks about. Browsers block audio
// until a user gesture — call initAudio() from a click handler before playing.

import * as Tone from "tone";
import { ascendingScaleMidis, noteToMidi } from "./theory";

let sampler: Tone.Sampler | null = null;
let loaded: Promise<void> | null = null;

/** Initialize the audio context + piano sampler. Safe to call repeatedly. */
export async function initAudio(): Promise<void> {
  await Tone.start();
  if (!sampler) {
    sampler = new Tone.Sampler({
      urls: {
        C2: "C2.mp3", "F#2": "Fs2.mp3", C3: "C3.mp3", "F#3": "Fs3.mp3",
        C4: "C4.mp3", "F#4": "Fs4.mp3", C5: "C5.mp3", "F#5": "Fs5.mp3", C6: "C6.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      release: 1,
    }).toDestination();
    loaded = Tone.loaded();
  }
  await loaded;
}

export function isAudioReady(): boolean {
  return sampler !== null;
}

function midiToToneName(midi: number): string {
  return Tone.Frequency(midi, "midi").toNote();
}

/** Play one spelled note. */
export async function playNote(note: string, octave = 4, duration = "8n"): Promise<void> {
  await initAudio();
  sampler!.triggerAttackRelease(midiToToneName(noteToMidi(note, octave)), duration);
}

/** Play a note by MIDI number. */
export async function playMidi(midi: number, duration = "4n"): Promise<void> {
  await initAudio();
  sampler!.triggerAttackRelease(midiToToneName(midi), duration);
}

/**
 * Play a list of spelled notes as an ascending scale, then add the octave tonic.
 * Handles octave wrapping so the line always rises.
 */
export async function playScale(notes: string[], startOctave = 4, noteDur = 0.32): Promise<void> {
  await initAudio();
  const midis = ascendingScaleMidis(notes, startOctave);
  const now = Tone.now();
  midis.forEach((m, i) => {
    sampler!.triggerAttackRelease(midiToToneName(m), noteDur * 0.95, now + i * noteDur);
  });
}

/**
 * Play spelled notes as a chord. With `roll` > 0 the notes are strummed that
 * many seconds apart (root first) so each chord tone is clearly heard rather
 * than blurring into the root; they still overlap and ring together. With
 * `roll` = 0 they sound as a simultaneous block chord.
 */
export async function playChord(
  notes: string[],
  octave = 4,
  duration = "2n",
  roll = 0,
): Promise<void> {
  await initAudio();
  const names: string[] = [];
  let prev = -Infinity;
  let oct = octave;
  for (const n of notes) {
    let m = noteToMidi(n, oct);
    while (m <= prev) {
      oct++;
      m = noteToMidi(n, oct);
    }
    names.push(midiToToneName(m));
    prev = m;
  }
  if (roll > 0) {
    const now = Tone.now();
    names.forEach((n, i) => sampler!.triggerAttackRelease(n, duration, now + i * roll));
  } else {
    sampler!.triggerAttackRelease(names, duration);
  }
}

/** Play a sequence of MIDI notes one after another (a melody / phrase). */
export async function playSequence(midis: number[], noteDur = 0.5): Promise<void> {
  await initAudio();
  const now = Tone.now();
  midis.forEach((m, i) => {
    sampler!.triggerAttackRelease(midiToToneName(m), noteDur * 0.9, now + i * noteDur);
  });
}

/**
 * Play a fast burst of random notes to scramble working-memory pitch tracking,
 * so relative-pitch cues can't carry between trials (perfect-pitch practice).
 * Starts `startDelay` seconds after now so it can follow a guess/feedback note.
 */
export async function playScramble(
  count = 6,
  startDelay = 0,
  lo = 48,
  hi = 84,
  noteDur = 0.13,
): Promise<void> {
  await initAudio();
  const start = Tone.now() + startDelay;
  for (let i = 0; i < count; i++) {
    const m = lo + Math.floor(Math.random() * (hi - lo + 1));
    sampler!.triggerAttackRelease(midiToToneName(m), noteDur * 0.9, start + i * noteDur);
  }
}

/** Short non-pitched cue for answer feedback (rising = correct, falling = wrong). */
export async function playFeedback(correct: boolean): Promise<void> {
  await initAudio();
  const now = Tone.now();
  const notes = correct ? ["C5", "G5"] : ["G3", "C3"];
  notes.forEach((n, i) => sampler!.triggerAttackRelease(n, "16n", now + i * 0.09));
}
