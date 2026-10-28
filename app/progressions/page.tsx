"use client";

import { useState } from "react";
import { MusicTutorNav } from "@/components/MusicTutorNav";
import { MoxieIllustration } from "@/components/MoxieIllustration";
import { ProgressionCircle } from "@/components/ProgressionCircle";
import { chartFor, cycleFor, rotateCycle, PROGRESSIONS, type PracticeMode } from "@/lib/practice";

const control = "min-h-12 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-lg text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";
const button = "min-h-12 rounded-xl bg-[var(--action)] px-5 py-3 text-lg font-bold text-white hover:bg-[var(--action-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";

export default function ProgressionsPage() {
  const [mode, setMode] = useState<PracticeMode>("major");
  const [key, setKey] = useState<string>("C");
  const [startingKey, setStartingKey] = useState<string>("C");
  const [progressionId, setProgressionId] = useState(PROGRESSIONS[0].id);
  const [revealed, setRevealed] = useState(false);
  const choices = PROGRESSIONS.filter((item) => item.mode === mode);
  const progression = choices.find((item) => item.id === progressionId) ?? choices[0];
  const chart = chartFor(key, progression);

  function changeMode(next: PracticeMode) {
    setMode(next);
    setKey(cycleFor(next)[0]);
    setStartingKey(cycleFor(next)[0]);
    setProgressionId(PROGRESSIONS.find((item) => item.mode === next)!.id);
    setRevealed(false);
  }

  function nextQuestion() {
    const keys = rotateCycle(mode, startingKey).slice(0, 3);
    const index = keys.indexOf(key);
    const nextProgression = choices[Math.floor(Math.random() * choices.length)];
    setKey(keys[(index + 1) % keys.length]);
    setProgressionId(nextProgression.id);
    setRevealed(false);
  }

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)]">
      <MusicTutorNav active="/" />
      <main className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
        <h1 className="text-4xl font-extrabold">Progression recall</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-[var(--muted)]">Name the chords in order, then reveal the chart and check yourself. No piano needed.</p>
        <div className="mt-7 flex flex-wrap gap-4">
          <label className="flex flex-col gap-2 font-bold">Mode
            <select className={control} value={mode} onChange={(event) => changeMode(event.target.value as PracticeMode)}>
              <option value="major">Major</option><option value="minor">Minor</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 font-bold">Starting key
            <select className={control} value={startingKey} onChange={(event) => { setStartingKey(event.target.value); setKey(event.target.value); setRevealed(false); }}>
              {cycleFor(mode).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 font-bold">Progression
            <select className={control} value={progression.id} onChange={(event) => { setProgressionId(event.target.value); setRevealed(false); }}>
              {choices.map((item) => <option key={item.id} value={item.id}>{item.romans.join(" – ")}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-5 text-lg text-[var(--muted)]">New questions cycle through {rotateCycle(mode, startingKey).slice(0, 3).join(" → ")}, starting from your chosen key.</p>
        <section className="mt-8 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] p-6" aria-labelledby="question">
          <h2 id="question" className="text-2xl font-extrabold">What chords do you play in {key} {mode === "major" ? "major" : "minor"}?</h2>
          <p className="mt-3 text-2xl font-bold">{progression.romans.join(" – ")}</p>
          <p className="mt-3 text-lg text-[var(--muted)]">Say or think through each chord and its notes before revealing the answer.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className={button} onClick={() => setRevealed(!revealed)} aria-expanded={revealed} aria-controls="answer">{revealed ? "Hide answer" : "Reveal answer"}</button>
            <button type="button" className={control + " font-bold"} onClick={nextQuestion}>New question</button>
          </div>
          <div id="answer" aria-live="polite">
            {revealed && <div className="mt-6 border-t border-[var(--border)] pt-5"><h3 className="text-xl font-bold">Chord chart</h3><ol className="mt-3 space-y-2 text-lg">{chart.map((bar, index) => <li key={index}><strong>{bar.roman}: {bar.name}</strong> — {bar.chord.notes.join(" – ")}</li>)}</ol><ProgressionCircle chart={chart} /></div>}
          </div>
        </section>
        <div className="mt-8"><MoxieIllustration listening /></div>
      </main>
    </div>
  );
}
