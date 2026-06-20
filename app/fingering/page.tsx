"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { DifficultySelect, type Difficulty } from "@/components/DifficultySelect";
import { Piano } from "@/components/Piano";
import { QuizShell, type Feedback } from "@/components/QuizShell";
import { playNote, playScale, playFeedback } from "@/lib/audio";
import { fingeringFor } from "@/lib/fingerings";
import { ascendingScaleMidis, keysAroundCircle, majorScale, pretty } from "@/lib/theory";
import { loadMisses, nextProgress, pickWeighted, recordItem, type Progress } from "@/lib/storage";

type Hand = "rh" | "lh";
type Direction = "clockwise" | "counterclockwise" | "random";

const MODE = "fingering";
const DEGREE = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th (octave)"];
const ALL_KEYS = keysAroundCircle("clockwise");

export default function FingeringPage() {
  const [hand, setHand] = useState<Hand>("rh");
  const [direction, setDirection] = useState<Direction>("clockwise");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [keyIndex, setKeyIndex] = useState(0);
  const [randomKey, setRandomKey] = useState(ALL_KEYS[0]);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [progress, setProgress] = useState<Progress>({ correct: 0, attempts: 0, streak: 0, bestStreak: 0 });
  const [study, setStudy] = useState(false);

  const reveal = difficulty !== "hard";

  const keys = useMemo(
    () => (direction === "random" ? null : keysAroundCircle(direction)),
    [direction],
  );
  const currentKey = keys ? keys[keyIndex % keys.length] : randomKey;

  const scale = useMemo(() => majorScale(currentKey), [currentKey]);
  const midis = useMemo(() => ascendingScaleMidis(scale, 4), [scale]);
  const fingers = fingeringFor(currentKey)[hand];

  const complete = step >= 8;

  function nextKey() {
    setStep(0);
    setFeedback(null);
    // Random direction biases toward keys the user has been missing.
    if (direction === "random") setRandomKey(pickWeighted(ALL_KEYS, loadMisses(MODE)));
    else setKeyIndex((i) => i + 1);
  }

  function answer(finger: number) {
    if (complete) return;
    const correct = finger === fingers[step];
    void playFeedback(correct);
    setProgress((p) => nextProgress(p, correct));
    recordItem(MODE, currentKey, correct);
    if (correct) {
      void playNote(scale[step % 7], 4 + Math.floor(step / 7));
      setFeedback(null);
      setStep((s) => s + 1);
    } else {
      setFeedback("wrong");
    }
  }

  // Highlight the scale; show finger numbers for answered notes (or all, in study mode).
  const marks: Record<number, { className?: string; finger?: number }> = {};
  midis.forEach((m, i) => {
    const answered = study || i < step;
    const isTarget = !study && i === step;
    marks[m] = {
      className: isTarget ? "fill-amber-400" : "fill-sky-400",
      finger: answered ? fingers[i] : undefined,
    };
  });

  const handLabel = hand === "rh" ? "Right hand" : "Left hand";

  return (
    <QuizShell
      title="Scale Fingering"
      progress={progress}
      feedback={feedback}
      feedbackMessage={reveal ? `✗ That note uses finger ${fingers[step] ?? ""}` : "✗ Try again"}
      prompt={
        <span>
          {pretty(currentKey)} major — {handLabel}
          <span className="mt-1 block text-base font-normal text-slate-300">
            {scale.map(pretty).join("  ")}
          </span>
        </span>
      }
      controls={
        <>
          <Button variant="secondary" onClick={() => void playScale(scale)}>
            🔊 Play scale
          </Button>
          <Button variant="ghost" onClick={() => setStudy((s) => !s)}>
            {study ? "Quiz me" : "Study mode"}
          </Button>
          <Button onClick={nextKey}>Next key →</Button>
        </>
      }
    >
      <DifficultySelect
        value={difficulty}
        onChange={setDifficulty}
        hint={reveal ? "The finger is shown after a miss." : "No reveals — recall the fingering yourself."}
      />

      <Piano startMidi={60} whiteCount={15} marks={marks} width={620} />

      {study || complete ? (
        <p className="text-center text-lg text-slate-200">
          {complete ? "🎉 Whole scale fingered! " : ""}
          Fingers: {fingers.join(" · ")}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg text-slate-200">
            Which finger plays the {DEGREE[step]} note,{" "}
            <strong className="text-amber-300">{pretty(scale[step % 7])}</strong>?
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((f) => (
              <Button key={f} variant="secondary" className="w-14" onClick={() => answer(f)}>
                {f}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-slate-400">Hand:</span>
        {(["rh", "lh"] as Hand[]).map((h) => (
          <Button
            key={h}
            variant={hand === h ? "primary" : "ghost"}
            className="px-3 py-1.5 text-sm"
            onClick={() => {
              setHand(h);
              setStep(0);
              setFeedback(null);
            }}
          >
            {h === "rh" ? "Right" : "Left"}
          </Button>
        ))}
        <span className="ml-3 text-slate-400">Move:</span>
        {(["clockwise", "counterclockwise", "random"] as Direction[]).map((d) => (
          <Button
            key={d}
            variant={direction === d ? "primary" : "ghost"}
            className="px-3 py-1.5 text-sm"
            onClick={() => {
              setDirection(d);
              setKeyIndex(0);
              if (d === "random") setRandomKey(pickWeighted(ALL_KEYS, loadMisses(MODE)));
              setStep(0);
              setFeedback(null);
            }}
          >
            {d === "clockwise" ? "♯ CW" : d === "counterclockwise" ? "♭ CCW" : "Random"}
          </Button>
        ))}
      </div>
    </QuizShell>
  );
}
