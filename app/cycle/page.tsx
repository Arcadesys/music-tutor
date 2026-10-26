"use client";

import { useState } from "react";
import { MusicTutorNav } from "@/components/MusicTutorNav";
import { cycleFor, type PracticeMode } from "@/lib/practice";

function CycleTape({
  mode,
  selectedMode,
  questionIndex,
  revealed,
  onAsk,
}: {
  mode: PracticeMode;
  selectedMode: PracticeMode;
  questionIndex: number;
  revealed: boolean;
  onAsk: (mode: PracticeMode, index: number) => void;
}) {
  const keys = cycleFor(mode);
  const isSelected = mode === selectedMode;
  const hiddenIndex = (questionIndex + 1) % keys.length;

  return (
    <section aria-label={mode === "major" ? "Major cycle of fourths" : "Minor cycle of fourths"} className="py-5">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-lg font-extrabold">{mode === "major" ? "Major" : "Minor"}</h2>
        <span className="rounded-full bg-[#dceff0] px-3 py-1 text-sm font-bold text-[#125c65]">up a perfect fourth</span>
        {isSelected && <span className="text-sm font-semibold text-[#42586b]">prompt track</span>}
      </div>
      <div
        className="relative overflow-x-auto rounded-2xl border border-[#cbd6dc] bg-white px-3 pb-3 pt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#177d87]"
        tabIndex={0}
        aria-label="Scrollable measuring-tape cycle"
      >
        <ol className="relative z-10 flex min-w-[1060px] list-none p-0">
          {[...keys, keys[0]].map((key, index) => {
            const position = index % keys.length;
            const hidden = isSelected && !revealed && position === hiddenIndex;
            const activeQuestion = isSelected && position === questionIndex;
            return (
              <li key={index} className="min-w-0 flex-1">
                <button
                  type="button"
                  aria-label={
                    hidden
                      ? "Measure " + (index + 1) + ", hidden key"
                      : "Measure " + (index + 1) + ", " + key + ". Ask what follows."
                  }
                  aria-pressed={activeQuestion}
                  onClick={() => onAsk(mode, position)}
                  className={
                    "flex min-h-24 w-full flex-col items-center rounded-xl px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef665a] " +
                    (activeQuestion ? "bg-[#e7f3f3]" : "hover:bg-[#f2f5f3]")
                  }
                >
                  <span className="text-xs font-semibold text-[#526779]">{index + 1}</span>
                  <span aria-hidden className="mt-1 h-5 w-px bg-[#177d87]" />
                  <span className={"mt-1 text-xl font-extrabold sm:text-2xl " + (hidden ? "text-[#177d87]" : "text-[#10243a]")}>
                    {hidden ? "?" : key}
                  </span>
                  {index === keys.length && <span className="text-xs font-bold text-[#177d87]">repeat</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <div aria-hidden className="pointer-events-none absolute left-8 right-8 top-[3.55rem] h-px bg-[#177d87]" />
        <div aria-hidden className="pointer-events-none absolute left-3 top-[3.1rem] text-xl font-bold text-[#177d87]">↶</div>
        <div aria-hidden className="pointer-events-none absolute right-3 top-[3.1rem] text-xl font-bold text-[#177d87]">↷</div>
      </div>
    </section>
  );
}

export default function CyclePage() {
  const [mode, setMode] = useState<PracticeMode>("major");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const cycle = cycleFor(mode);
  const nextIndex = (questionIndex + 1) % cycle.length;

  function askAt(nextMode: PracticeMode, index: number) {
    setMode(nextMode);
    setQuestionIndex(index);
    setRevealed(false);
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#10243a]">
      <MusicTutorNav active="/cycle" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Walk the cycle</h1>
        <p className="mt-3 max-w-3xl text-lg leading-7 text-[#42586b]">
          A repeating tape for learning the keys away from the piano. Pick a measure, say the next key, then reveal it.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3" role="group" aria-label="Choose the prompt mode">
          {(["major", "minor"] as PracticeMode[]).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              aria-pressed={mode === nextMode}
              onClick={() => askAt(nextMode, questionIndex)}
              className={
                "min-h-12 rounded-xl px-5 py-3 text-base font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef665a] " +
                (mode === nextMode ? "bg-[#10243a] text-white" : "border border-[#9daeb7] bg-white text-[#10243a] hover:bg-[#e8eef0]")
              }
            >
              {nextMode === "major" ? "Major keys" : "Minor keys"}
            </button>
          ))}
          <span className="ml-1 text-sm font-semibold text-[#42586b]">Tap any measure to quiz yourself from there.</span>
        </div>

        <div className="mt-5 rounded-2xl border border-[#d7dee2] bg-[#fffdf8] px-4 sm:px-6">
          <CycleTape mode="major" selectedMode={mode} questionIndex={questionIndex} revealed={revealed} onAsk={askAt} />
          <div className="border-t border-[#d7dee2]" />
          <CycleTape mode="minor" selectedMode={mode} questionIndex={questionIndex} revealed={revealed} onAsk={askAt} />
        </div>

        <section aria-live="polite" className="mt-7 flex flex-col gap-5 rounded-3xl bg-[#e7edef] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-[#177d87]">
              {mode === "major" ? "Major cycle" : "Minor cycle"} · measure {questionIndex + 1}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">What comes after {cycle[questionIndex]}?</h2>
            <p className="mt-2 text-base text-[#42586b]">
              {revealed ? "Next key: " + cycle[nextIndex] : "Say the next key out loud before you reveal it."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              className="min-h-12 rounded-xl bg-[#177d87] px-5 py-3 text-base font-extrabold text-white hover:bg-[#12636c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10243a]"
            >
              {revealed ? "Hide answer" : "Reveal answer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuestionIndex((index) => (index + 1) % cycle.length);
                setRevealed(false);
              }}
              className="min-h-12 rounded-xl border border-[#81939f] bg-white px-5 py-3 text-base font-bold text-[#10243a] hover:bg-[#f7f4ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#177d87]"
            >
              Next prompt
            </button>
          </div>
        </section>

        <p className="mt-5 text-sm leading-6 text-[#526779]">
          The tape repeats at measure 13. The familiar spellings keep the cycle readable; some keys are enharmonic equivalents.
        </p>
      </main>
    </div>
  );
}
