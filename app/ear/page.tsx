"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { DifficultySelect, type Difficulty } from "@/components/DifficultySelect";
import { Piano, type KeyMark } from "@/components/Piano";
import {
  Fretboard,
  GUITAR_TUNING,
  BASS_TUNING,
  type FretMark,
} from "@/components/Fretboard";
import { QuizShell, type Feedback } from "@/components/QuizShell";
import { playMidi, playSequence, playFeedback } from "@/lib/audio";
import { midiToNoteName, pretty } from "@/lib/theory";
import {
  loadMisses,
  loadProgress,
  pickWeighted,
  recordItem,
  recordResult,
  type Progress,
} from "@/lib/storage";

const MODE = "ear";
const START_MIDI = 60; // C4
const WHITE_PC = new Set([0, 2, 4, 5, 7, 9, 11]);
const FRETS = 12;

type Instrument = "piano" | "guitar" | "bass";
type Length = "single" | "melody";

const TUNINGS: Record<"guitar" | "bass", number[]> = {
  guitar: GUITAR_TUNING,
  bass: BASS_TUNING,
};

/** Number of notes in a melody at each difficulty. */
const MELODY_LEN: Record<Difficulty, number> = { easy: 2, medium: 3, hard: 4 };
/** Hard means fewer replays — one listen only. */
const CAN_REPLAY: Record<Difficulty, boolean> = { easy: true, medium: true, hard: false };

/** Distinct MIDI pitches reachable on a fretboard, lowest to highest. */
function fretboardMidis(tuning: number[]): number[] {
  const set = new Set<number>();
  for (const open of tuning) for (let f = 0; f <= FRETS; f++) set.add(open + f);
  return [...set].sort((a, b) => a - b);
}

export default function EarPage() {
  const [instrument, setInstrument] = useState<Instrument>("piano");
  const [length, setLength] = useState<Length>("single");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [octaves, setOctaves] = useState(1);
  const [naturalsOnly, setNaturalsOnly] = useState(false);

  const [sequence, setSequence] = useState<number[]>([]); // the target notes
  const [pos, setPos] = useState(0); // how many notes answered correctly
  const [wrong, setWrong] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [progress, setProgress] = useState<Progress>({ correct: 0, attempts: 0, streak: 0, bestStreak: 0 });

  const candidates = useCallback(() => {
    const pool =
      instrument === "piano"
        ? Array.from({ length: 12 * octaves + 1 }, (_, i) => START_MIDI + i)
        : fretboardMidis(TUNINGS[instrument]);
    return pool.filter((m) => !naturalsOnly || WHITE_PC.has(((m % 12) + 12) % 12));
  }, [instrument, octaves, naturalsOnly]);

  const playTarget = useCallback(
    (notes: number[]) => {
      if (notes.length <= 1) void playMidi(notes[0]);
      else void playSequence(notes, 0.55);
    },
    [],
  );

  const newTarget = useCallback(
    (play: boolean) => {
      const pool = candidates();
      const len = length === "single" ? 1 : MELODY_LEN[difficulty];
      // Misses are tracked by pitch class; bias selection toward weak notes.
      const misses = loadMisses(MODE);
      const notes: number[] = [];
      for (let i = 0; i < len; i++) {
        // Avoid an immediate repeat so melodies have movement.
        const activePool = i > 0 && pool.length > 1 ? pool.filter((m) => m !== notes[i - 1]) : pool;
        const midiMisses: Record<string, number> = {};
        activePool.forEach((m) => {
          midiMisses[String(m)] = misses[String(((m % 12) + 12) % 12)] ?? 0;
        });
        const chosen = pickWeighted(activePool.map(String), midiMisses);
        notes.push(Number(chosen));
      }
      setSequence(notes);
      setPos(0);
      setWrong(null);
      setSolved(false);
      setFeedback(null);
      if (play) playTarget(notes);
    },
    [candidates, length, difficulty, playTarget],
  );

  // Pick the first target on mount; re-roll when puzzle parameters change.
  // Don't auto-play on first mount (audio needs a user gesture first).
  const mounted = useRef(false);
  useEffect(() => {
    setProgress(loadProgress(MODE));
    newTarget(mounted.current);
    mounted.current = true;
  }, [newTarget]);

  function guess(midi: number) {
    if (solved || sequence.length === 0) return;
    const expected = sequence[pos];
    const correct = midi === expected;
    void playMidi(midi);
    void playFeedback(correct);
    setProgress(recordResult(MODE, correct));
    recordItem(MODE, String(((expected % 12) + 12) % 12), correct);
    if (correct) {
      const np = pos + 1;
      setWrong(null);
      if (np >= sequence.length) {
        setSolved(true);
        setFeedback("correct");
      } else {
        setPos(np);
        setFeedback(null);
      }
    } else {
      setFeedback("wrong");
      setWrong(midi);
    }
  }

  const marks: Record<number, KeyMark & FretMark> = {};
  // Show notes already answered correctly (green), and the last wrong guess (red).
  for (let i = 0; i < (solved ? sequence.length : pos); i++) {
    marks[sequence[i]] = { className: "fill-emerald-400" };
  }
  if (wrong != null && !solved) marks[wrong] = { className: "fill-rose-500" };

  const whiteCount = 7 * octaves + 1;
  const isMelody = length === "melody";
  const answer = pretty(sequence.map(midiToNoteName).join(" "));

  return (
    <QuizShell
      title="Ear Training"
      progress={progress}
      feedback={feedback}
      feedbackMessage={
        wrong != null ? `✗ That was ${pretty(midiToNoteName(wrong))} — listen again` : ""
      }
      prompt={
        <span>
          {isMelody ? "Listen, then play the notes in order" : "Listen, then click the matching key"}
          {isMelody && !solved && sequence.length > 0 && (
            <span className="block text-base font-normal text-slate-400">
              Note {pos + 1} of {sequence.length}
            </span>
          )}
          {solved && (
            <span className="block text-emerald-400">✓ {answer}</span>
          )}
        </span>
      }
      controls={
        <>
          <Button
            variant="secondary"
            disabled={!CAN_REPLAY[difficulty] && !solved}
            onClick={() => playTarget(sequence)}
          >
            🔊 {isMelody ? "Play melody" : "Play note"}
          </Button>
          <Button onClick={() => newTarget(true)}>{solved ? "Next →" : "Skip"}</Button>
        </>
      }
    >
      <DifficultySelect
        value={difficulty}
        onChange={setDifficulty}
        hint={
          isMelody
            ? `Melody of ${MELODY_LEN[difficulty]} notes${CAN_REPLAY[difficulty] ? "" : " — one listen only"}`
            : CAN_REPLAY[difficulty]
              ? "Single note — replay as needed"
              : "Single note — one listen only"
        }
      />

      {instrument === "piano" ? (
        <Piano startMidi={START_MIDI} whiteCount={whiteCount} marks={marks} onKeyClick={guess} width={620} />
      ) : (
        <Fretboard tuning={TUNINGS[instrument]} marks={marks} onFretClick={guess} width={700} />
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-slate-400">Length:</span>
        {(["single", "melody"] as Length[]).map((l) => (
          <Button
            key={l}
            variant={length === l ? "primary" : "ghost"}
            className="px-3 py-1.5 text-sm capitalize"
            onClick={() => setLength(l)}
          >
            {l}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-slate-400">Instrument:</span>
        {(["piano", "guitar", "bass"] as Instrument[]).map((inst) => (
          <Button
            key={inst}
            variant={instrument === inst ? "primary" : "ghost"}
            className="px-3 py-1.5 text-sm capitalize"
            onClick={() => setInstrument(inst)}
          >
            {inst}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {instrument === "piano" && (
          <>
            <span className="text-slate-400">Range:</span>
            {[1, 2].map((o) => (
              <Button
                key={o}
                variant={octaves === o ? "primary" : "ghost"}
                className="px-3 py-1.5 text-sm"
                onClick={() => setOctaves(o)}
              >
                {o} octave{o > 1 ? "s" : ""}
              </Button>
            ))}
          </>
        )}
        <Button
          variant={naturalsOnly ? "primary" : "ghost"}
          className="ml-3 px-3 py-1.5 text-sm"
          onClick={() => setNaturalsOnly((n) => !n)}
        >
          {naturalsOnly ? "Naturals only" : "All notes"}
        </Button>
      </div>
    </QuizShell>
  );
}
