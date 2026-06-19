"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { CircleOfFifths, type Ring, type WedgeMark } from "@/components/CircleOfFifths";
import { QuizShell, type Feedback } from "@/components/QuizShell";
import { playChord, playFeedback } from "@/lib/audio";
import { CIRCLE, chordSequence, keysAroundCircle, pitchClass, pretty, type Chord } from "@/lib/theory";
import { loadProgress, recordResult, type Progress } from "@/lib/storage";

const MODE = "diatonic";

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
  const [flatSeven, setFlatSeven] = useState(false);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({ correct: 0, attempts: 0, streak: 0, bestStreak: 0 });

  useEffect(() => setProgress(loadProgress(MODE)), []);

  const chords = useMemo(() => chordSequence(musicKey, flatSeven), [musicKey, flatSeven]);
  const targets = useMemo(() => chords.map(wedgeForChord), [chords]);
  const completed = index >= chords.length;

  function reset() {
    setIndex(0);
    setFeedback(null);
    setWrong(null);
  }

  function select(ring: Ring, position: number) {
    if (completed) return;
    const t = targets[index];
    const correct = ring === t.ring && position === t.position;
    void playFeedback(correct);
    setProgress(recordResult(MODE, correct));
    if (correct) {
      void playChord(chords[index].notes);
      setWrong(null);
      const ni = index + 1;
      setIndex(ni);
      setFeedback(ni >= chords.length ? "correct" : null);
    } else {
      setFeedback("wrong");
      setWrong(`${ring}:${position}`);
    }
  }

  const marks: Record<string, WedgeMark> = {};
  targets.forEach((t, i) => {
    const k = `${t.ring}:${t.position}`;
    if (i < index) marks[k] = { className: "fill-emerald-500", badge: String(i + 1) };
    else if (i === index && !completed) marks[k] = { className: "fill-sky-600" };
  });
  if (wrong && !completed) marks[wrong] = { className: "fill-rose-600" };

  return (
    <QuizShell
      title="Diatonic Chords"
      progress={progress}
      feedback={feedback}
      feedbackMessage={
        !completed
          ? `✗ Next is ${chords[index].roman} — ${pretty(chords[index].notes.join(" "))}`
          : ""
      }
      prompt={
        <span>
          {pretty(musicKey)} major — click each chord in order
          {completed && <span className="block text-emerald-400">🎉 Sequence complete!</span>}
        </span>
      }
      controls={
        <>
          <Button variant="ghost" onClick={() => setFlatSeven((f) => !f)}>
            {flatSeven ? "♭VII: on" : "♭VII: off"}
          </Button>
          <Button onClick={reset}>{completed ? "Again →" : "Restart"}</Button>
        </>
      }
    >
      <CircleOfFifths marks={marks} onSelect={select} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        {chords.map((c, i) => (
          <span
            key={c.roman}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-semibold",
              i < index
                ? "bg-emerald-600 text-white"
                : i === index && !completed
                  ? "bg-sky-600 text-white ring-2 ring-sky-300"
                  : "bg-slate-700 text-slate-300",
            ].join(" ")}
          >
            {c.roman} <span className="opacity-80">{pretty(c.root)}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm">
        <span className="mr-1 text-slate-400">Key:</span>
        {keysAroundCircle("clockwise").map((k) => (
          <Button
            key={k}
            variant={musicKey === k ? "primary" : "ghost"}
            className="px-2.5 py-1 text-sm"
            onClick={() => {
              setMusicKey(k);
              reset();
            }}
          >
            {pretty(k)}
          </Button>
        ))}
      </div>
    </QuizShell>
  );
}
