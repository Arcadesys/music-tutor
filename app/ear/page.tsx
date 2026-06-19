"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Piano, type KeyMark } from "@/components/Piano";
import {
  Fretboard,
  GUITAR_TUNING,
  BASS_TUNING,
  type FretMark,
} from "@/components/Fretboard";
import { QuizShell, type Feedback } from "@/components/QuizShell";
import { playMidi, playFeedback } from "@/lib/audio";
import { midiToNoteName, pretty } from "@/lib/theory";
import { loadProgress, recordResult, type Progress } from "@/lib/storage";

const MODE = "ear";
const START_MIDI = 60; // C4
const WHITE_PC = new Set([0, 2, 4, 5, 7, 9, 11]);
const FRETS = 12;

type Instrument = "piano" | "guitar" | "bass";

const TUNINGS: Record<"guitar" | "bass", number[]> = {
  guitar: GUITAR_TUNING,
  bass: BASS_TUNING,
};

/** Distinct MIDI pitches reachable on a fretboard, lowest to highest. */
function fretboardMidis(tuning: number[]): number[] {
  const set = new Set<number>();
  for (const open of tuning) for (let f = 0; f <= FRETS; f++) set.add(open + f);
  return [...set].sort((a, b) => a - b);
}

export default function EarPage() {
  const [instrument, setInstrument] = useState<Instrument>("piano");
  const [octaves, setOctaves] = useState(1);
  const [naturalsOnly, setNaturalsOnly] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [progress, setProgress] = useState<Progress>({ correct: 0, attempts: 0, streak: 0, bestStreak: 0 });

  const candidates = useCallback(() => {
    const pool =
      instrument === "piano"
        ? Array.from(
            { length: 12 * octaves + 1 },
            (_, i) => START_MIDI + i,
          )
        : fretboardMidis(TUNINGS[instrument]);
    return pool.filter(
      (m) => !naturalsOnly || WHITE_PC.has(((m % 12) + 12) % 12),
    );
  }, [instrument, octaves, naturalsOnly]);

  const newTarget = useCallback(
    (play: boolean) => {
      const pool = candidates();
      const next = pool[Math.floor(Math.random() * pool.length)];
      setTarget(next);
      setWrong(null);
      setSolved(false);
      setFeedback(null);
      if (play) void playMidi(next);
    },
    [candidates],
  );

  // Pick the first target on mount (client-only avoids hydration mismatch). Audio
  // waits for the first user gesture, so don't auto-play here.
  useEffect(() => {
    setProgress(loadProgress(MODE));
    newTarget(false);
  }, [newTarget]);

  function guess(midi: number) {
    if (target == null || solved) return;
    const correct = midi === target;
    void playMidi(midi);
    void playFeedback(correct);
    setProgress(recordResult(MODE, correct));
    if (correct) {
      setSolved(true);
      setFeedback("correct");
      setWrong(null);
    } else {
      setFeedback("wrong");
      setWrong(midi);
    }
  }

  const marks: Record<number, KeyMark & FretMark> = {};
  if (solved && target != null) marks[target] = { className: "fill-emerald-400" };
  if (wrong != null && !solved) marks[wrong] = { className: "fill-rose-500" };

  const whiteCount = 7 * octaves + 1;

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
          Listen, then click the matching key
          {solved && target != null && (
            <span className="block text-emerald-400">✓ {pretty(midiToNoteName(target))}</span>
          )}
        </span>
      }
      controls={
        <>
          <Button
            variant="secondary"
            onClick={() => target != null && void playMidi(target)}
          >
            🔊 Play note
          </Button>
          <Button onClick={() => newTarget(true)}>{solved ? "Next →" : "Skip"}</Button>
        </>
      }
    >
      {instrument === "piano" ? (
        <Piano startMidi={START_MIDI} whiteCount={whiteCount} marks={marks} onKeyClick={guess} width={620} />
      ) : (
        <Fretboard tuning={TUNINGS[instrument]} marks={marks} onFretClick={guess} width={700} />
      )}

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
                onClick={() => {
                  setOctaves(o);
                }}
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
