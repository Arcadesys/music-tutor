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
import { playMidi, playSequence, playScramble, playFeedback } from "@/lib/audio";
import { INTERVAL_NAMES, midiToNoteName, pretty } from "@/lib/theory";
import {
  loadMisses,
  nextProgress,
  pickWeighted,
  recordItem,
  type Progress,
} from "@/lib/storage";

const MODE = "ear";
const START_MIDI = 60; // C4
const WHITE_PC = new Set([0, 2, 4, 5, 7, 9, 11]);
const FRETS = 12;

// Interval mode roots are picked from a comfortable, audible window…
const INTERVAL_ROOT_LO = 57; // A3
const INTERVAL_ROOT_HI = 69; // A4
// …and the second note is kept inside the sampler's range.
const SAMPLER_LO = 36;
const SAMPLER_HI = 84;

type Instrument = "piano" | "guitar" | "bass";
type Length = "single" | "melody" | "interval";
type IntervalDir = "asc" | "desc" | "both";

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
  const [mask, setMask] = useState(false);
  // Interval mode: which interval sizes are in play, and how they're played.
  const [intervals, setIntervals] = useState<Set<number>>(
    () => new Set(INTERVAL_NAMES.map((iv) => iv.semitones)),
  );
  const [direction, setDirection] = useState<IntervalDir>("asc");

  const isInterval = length === "interval";

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

  // Read masking via a ref so toggling it never re-rolls / auto-plays a target.
  const maskRef = useRef(mask);
  useEffect(() => {
    maskRef.current = mask;
  }, [mask]);

  const newTarget = useCallback(
    (play: boolean) => {
      const misses = loadMisses(MODE);
      let notes: number[];
      if (length === "interval") {
        // Bias the interval choice toward sizes the user keeps missing.
        const ids = [...intervals];
        const idMisses: Record<string, number> = {};
        ids.forEach((n) => (idMisses[String(n)] = misses["iv" + n] ?? 0));
        const semis = Number(pickWeighted(ids.map(String), idMisses));
        const root =
          INTERVAL_ROOT_LO + Math.floor(Math.random() * (INTERVAL_ROOT_HI - INTERVAL_ROOT_LO + 1));
        let sign = direction === "asc" ? 1 : direction === "desc" ? -1 : Math.random() < 0.5 ? -1 : 1;
        if (semis === 0) sign = 1; // unison has no direction
        let second = root + sign * semis;
        // Flip direction if the interval would fall outside the sampler's range.
        if (second < SAMPLER_LO || second > SAMPLER_HI) second = root - sign * semis;
        notes = [root, second];
      } else {
        const pool = candidates();
        const len = length === "single" ? 1 : MELODY_LEN[difficulty];
        // Misses are tracked by pitch class; bias selection toward weak notes.
        notes = [];
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
      }
      setSequence(notes);
      setPos(0);
      setWrong(null);
      setSolved(false);
      setFeedback(null);
      if (play) {
        if (maskRef.current) {
          // Scramble pitch memory of the previous trial, then play after it ends.
          void playScramble(6, 0);
          window.setTimeout(() => playTarget(notes), 900);
        } else {
          playTarget(notes);
        }
      }
    },
    [candidates, length, difficulty, intervals, direction, playTarget],
  );

  // Pick the first target on mount; re-roll when puzzle parameters change.
  // Don't auto-play on first mount (audio needs a user gesture first).
  const mounted = useRef(false);
  useEffect(() => {
    newTarget(mounted.current);
    mounted.current = true;
  }, [newTarget]);

  function guess(answer: number) {
    if (solved || sequence.length === 0) return;
    if (length === "interval") {
      const actual = Math.abs(sequence[1] - sequence[0]);
      const correct = answer === actual;
      void playFeedback(correct);
      setProgress((p) => nextProgress(p, correct));
      recordItem(MODE, "iv" + actual, correct);
      if (maskRef.current) void playScramble(6, 0.45);
      if (correct) {
        setSolved(true);
        setFeedback("correct");
      } else {
        setFeedback("wrong");
        setWrong(answer);
      }
      return;
    }
    const expected = sequence[pos];
    const correct = answer === expected;
    void playMidi(answer);
    void playFeedback(correct);
    setProgress((p) => nextProgress(p, correct));
    recordItem(MODE, String(((expected % 12) + 12) % 12), correct);
    if (maskRef.current) void playScramble(6, 0.45);
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
      setWrong(answer);
    }
  }

  const marks: Record<number, KeyMark & FretMark> = {};
  if (!isInterval) {
    // Show notes already answered correctly (green), and the last wrong guess (red).
    for (let i = 0; i < (solved ? sequence.length : pos); i++) {
      marks[sequence[i]] = { className: "fill-emerald-400" };
    }
    if (wrong != null && !solved) marks[wrong] = { className: "fill-rose-500" };
  }

  const whiteCount = 7 * octaves + 1;
  const isMelody = length === "melody";
  const intervalAnswer = isInterval ? Math.abs(sequence[1] - sequence[0]) : 0;
  const answer = isInterval
    ? INTERVAL_NAMES[intervalAnswer]?.long ?? ""
    : pretty(sequence.map(midiToNoteName).join(" "));

  // Wrong-answer message, suppressed to a generic line when masking is on.
  let wrongMessage = "";
  if (wrong != null) {
    if (mask) wrongMessage = "✗ Not quite — listen again";
    else if (isInterval) wrongMessage = `✗ That was a ${INTERVAL_NAMES[intervalAnswer]?.long} — listen again`;
    else wrongMessage = `✗ That was ${pretty(midiToNoteName(wrong))} — listen again`;
  }

  // Selected intervals as a sorted list, for the answer buttons.
  const selectedIntervals = INTERVAL_NAMES.filter((iv) => intervals.has(iv.semitones));

  function toggleInterval(semitones: number) {
    setIntervals((prev) => {
      const next = new Set(prev);
      if (next.has(semitones)) {
        if (next.size > 1) next.delete(semitones); // keep at least one
      } else {
        next.add(semitones);
      }
      return next;
    });
  }

  return (
    <QuizShell
      title="Ear Training"
      progress={progress}
      feedback={feedback}
      feedbackMessage={wrongMessage}
      prompt={
        <span>
          {isInterval
            ? "Listen, then name the interval"
            : isMelody
              ? "Listen, then play the notes in order"
              : "Listen, then click the matching key"}
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
            🔊 {isInterval ? "Play interval" : isMelody ? "Play melody" : "Play note"}
          </Button>
          <Button onClick={() => newTarget(true)}>{solved ? "Next →" : "Skip"}</Button>
        </>
      }
    >
      <DifficultySelect
        value={difficulty}
        onChange={setDifficulty}
        hint={
          isInterval
            ? `Interval — ${CAN_REPLAY[difficulty] ? "replay as needed" : "one listen only"}`
            : isMelody
              ? `Melody of ${MELODY_LEN[difficulty]} notes${CAN_REPLAY[difficulty] ? "" : " — one listen only"}`
              : CAN_REPLAY[difficulty]
                ? "Single note — replay as needed"
                : "Single note — one listen only"
        }
      />

      {isInterval ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {selectedIntervals.map((iv) => (
            <Button
              key={iv.semitones}
              variant="secondary"
              className="min-w-16 px-4 py-3 text-base"
              disabled={solved}
              onClick={() => guess(iv.semitones)}
            >
              {iv.short}
            </Button>
          ))}
        </div>
      ) : instrument === "piano" ? (
        <Piano startMidi={START_MIDI} whiteCount={whiteCount} marks={marks} onKeyClick={guess} width={620} />
      ) : (
        <Fretboard tuning={TUNINGS[instrument]} marks={marks} onFretClick={guess} width={700} />
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-slate-400">Mode:</span>
        {(["single", "melody", "interval"] as Length[]).map((l) => (
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

      {isInterval ? (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-slate-400">Intervals:</span>
            {INTERVAL_NAMES.map((iv) => (
              <Button
                key={iv.semitones}
                variant={intervals.has(iv.semitones) ? "primary" : "ghost"}
                className="px-2.5 py-1.5 text-sm"
                aria-pressed={intervals.has(iv.semitones)}
                onClick={() => toggleInterval(iv.semitones)}
              >
                {iv.short}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-slate-400">Direction:</span>
            {(["asc", "desc", "both"] as IntervalDir[]).map((d) => (
              <Button
                key={d}
                variant={direction === d ? "primary" : "ghost"}
                className="px-3 py-1.5 text-sm"
                onClick={() => setDirection(d)}
              >
                {d === "asc" ? "Ascending" : d === "desc" ? "Descending" : "Both"}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <>
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
        </>
      )}

      <div className="flex flex-col items-center gap-1">
        <Button
          variant={mask ? "primary" : "ghost"}
          className="px-3 py-1.5 text-sm"
          aria-pressed={mask}
          onClick={() => setMask((m) => !m)}
        >
          {mask ? "🎭 Masking on" : "Masking off"}
        </Button>
        <p className="text-xs text-slate-400">
          Scrambles pitch memory between guesses — trains absolute pitch, not relative cues.
        </p>
      </div>
    </QuizShell>
  );
}
