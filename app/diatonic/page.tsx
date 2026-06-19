"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { CircleOfFifths, type Ring, type WedgeMark } from "@/components/CircleOfFifths";
import { DifficultySelect, type Difficulty } from "@/components/DifficultySelect";
import { QuizShell, type Feedback } from "@/components/QuizShell";
import { playChord, playFeedback } from "@/lib/audio";
import {
  CIRCLE,
  diatonicTriads,
  keysAroundCircle,
  modeLabel,
  pitchClass,
  pretty,
  type Chord,
  type Mode,
} from "@/lib/theory";
import {
  loadMisses,
  loadProgress,
  pickWeighted,
  recordItem,
  recordResult,
  type Progress,
} from "@/lib/storage";

const MODE = "diatonic";

const MODES: Mode[] = [
  "ionian",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "aeolian",
  "locrian",
];

const HINTS: Record<Difficulty, string> = {
  easy: "Guided: play the chords in order. The spot is revealed after two misses.",
  medium: "Recall: find a random chord by its Roman numeral — no order to lean on.",
  hard: "Ear: identify the chord you hear and click it. Uses your absolute pitch.",
};

/** Map a chord to a circle wedge by pitch class, so enharmonic roots resolve. */
function wedgeForChord(chord: Chord): { ring: Ring; position: number } {
  const ring: Ring = chord.quality === "minor" ? "minor" : "major";
  const pc = pitchClass(chord.root);
  const position = CIRCLE.findIndex((k) => {
    const rootPc = ring === "major" ? pitchClass(k.major) : pitchClass(k.minor.replace(/m$/, ""));
    return rootPc === pc;
  });
  return { ring, position };
}

export default function DiatonicPage() {
  const [musicKey, setMusicKey] = useState("C");
  const [mode, setMode] = useState<Mode>("ionian");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  const [step, setStep] = useState(0); // easy: ordered position 0..7
  const [target, setTarget] = useState(0); // medium/hard: degree under test
  const [wrongCount, setWrongCount] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [progress, setProgress] = useState<Progress>({ correct: 0, attempts: 0, streak: 0, bestStreak: 0 });

  useEffect(() => setProgress(loadProgress(MODE)), []);

  const chords = useMemo(() => diatonicTriads(musicKey, mode), [musicKey, mode]);
  const wedges = useMemo(() => chords.map(wedgeForChord), [chords]);
  const itemId = useCallback((degree: number) => `${musicKey}:${mode}:${degree}`, [musicKey, mode]);

  const completed = difficulty === "easy" && step >= chords.length;
  const currentDegree = difficulty === "easy" ? step : target;
  const currentChord = chords[currentDegree];

  // Choose a fresh random degree (medium/hard), biased toward missed ones.
  const pickTarget = useCallback(() => {
    const ids = chords.map((_, i) => itemId(i));
    const chosen = pickWeighted(ids, loadMisses(MODE));
    return ids.indexOf(chosen);
  }, [chords, itemId]);

  // Reset the round whenever the puzzle parameters change.
  const reset = useCallback(
    (autoplay: boolean) => {
      setStep(0);
      setWrong(null);
      setWrongCount(0);
      setFeedback(null);
      if (difficulty !== "easy") {
        const t = pickTarget();
        setTarget(t);
        if (autoplay && difficulty === "hard") void playChord(chords[t].notes, 4, "2n", 0.085);
      }
    },
    [difficulty, pickTarget, chords],
  );

  // Re-roll on any parameter change. Don't autoplay on the very first mount
  // (browsers block audio until a user gesture); ref tracks first run.
  const mounted = useRef(false);
  useEffect(() => {
    reset(mounted.current);
    mounted.current = true;
  }, [reset]);

  function advance(correct: boolean) {
    setWrong(null);
    setWrongCount(0);
    if (difficulty === "easy") {
      const ni = step + 1;
      setStep(ni);
      setFeedback(ni >= chords.length ? "correct" : null);
    } else {
      const t = pickTarget();
      setTarget(t);
      setFeedback(null);
      if (difficulty === "hard" && correct) void playChord(chords[t].notes, 4, "2n", 0.085);
    }
  }

  function select(ring: Ring, position: number) {
    if (completed) return;
    const t = wedges[currentDegree];
    const correct = ring === t.ring && position === t.position;
    void playFeedback(correct);
    setProgress(recordResult(MODE, correct));
    recordItem(MODE, itemId(currentDegree), correct);
    if (correct) {
      void playChord(currentChord.notes, 4, "2n", 0.085);
      advance(true);
    } else {
      setWrong(`${ring}:${position}`);
      setWrongCount((c) => c + 1);
      setFeedback("wrong");
    }
  }

  // Reveal the correct spot only after two misses on the same chord.
  const reveal = wrongCount >= 2 && !completed;

  const marks: Record<string, WedgeMark> = {};
  if (difficulty === "easy") {
    wedges.forEach((w, i) => {
      if (i < step) marks[`${w.ring}:${w.position}`] = { className: "fill-emerald-500", badge: String(i + 1) };
    });
  }
  if (reveal) {
    const w = wedges[currentDegree];
    marks[`${w.ring}:${w.position}`] = { className: "fill-sky-600" };
  }
  if (wrong && !completed) marks[wrong] = { className: "fill-rose-600" };

  const feedbackMessage = reveal
    ? `✗ It's ${currentChord.roman} — ${pretty(currentChord.notes.join(" "))} (highlighted)`
    : "✗ Try again";

  const prompt = (() => {
    if (completed)
      return (
        <span>
          {pretty(musicKey)} {modeLabel(mode)}
          <span className="block text-emerald-400">🎉 Sequence complete!</span>
        </span>
      );
    if (difficulty === "hard")
      return (
        <span>
          Identify the chord you hear
          <span className="block text-base font-normal text-slate-400">
            {pretty(musicKey)} {modeLabel(mode)} — click its spot on the circle
          </span>
        </span>
      );
    const verb = difficulty === "easy" ? "Play" : "Find";
    return (
      <span>
        {verb} the <span className="text-sky-300">{currentChord.roman}</span> chord
        <span className="block text-base font-normal text-slate-400">
          {pretty(musicKey)} {modeLabel(mode)}
          {difficulty === "easy" ? ` — ${step + 1} / ${chords.length}` : ""}
        </span>
      </span>
    );
  })();

  return (
    <QuizShell
      title="Diatonic Chords"
      progress={progress}
      feedback={feedback}
      feedbackMessage={feedbackMessage}
      prompt={prompt}
      controls={
        <>
          {difficulty === "hard" && !completed && (
            <Button
              variant="secondary"
              onClick={() => void playChord(currentChord.notes, 4, "2n", 0.085)}
            >
              🔊 Replay
            </Button>
          )}
          <Button onClick={() => reset(true)}>{completed ? "Again →" : "New chord"}</Button>
        </>
      }
    >
      <DifficultySelect value={difficulty} onChange={setDifficulty} hint={HINTS[difficulty]} />

      <CircleOfFifths marks={marks} onSelect={select} />

      <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm">
        <span className="mr-1 text-slate-400">Mode:</span>
        {MODES.map((m) => (
          <Button
            key={m}
            variant={mode === m ? "primary" : "ghost"}
            className="px-2.5 py-1 text-sm"
            onClick={() => setMode(m)}
          >
            {modeLabel(m)}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm">
        <span className="mr-1 text-slate-400">Key:</span>
        {keysAroundCircle("clockwise").map((k) => (
          <Button
            key={k}
            variant={musicKey === k ? "primary" : "ghost"}
            className="px-2.5 py-1 text-sm"
            onClick={() => setMusicKey(k)}
          >
            {pretty(k)}
          </Button>
        ))}
      </div>
    </QuizShell>
  );
}
