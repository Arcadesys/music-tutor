"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MusicTutorNav } from "@/components/MusicTutorNav";
import { diatonicTriads, modeScale, pretty } from "@/lib/theory";
import { cycleFor, rotateCycle, splitSessionMinutes, tonicFor, type PracticeMode } from "@/lib/practice";

const SETTINGS_KEY = "music-tutor-practice-settings-v1";
const DURATIONS = [10, 15, 20, 25, 30];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return minutes + ":" + remainder;
}

const STEPS = [
  { title: "Hanon warmup", detail: "Wake up the hands with relaxed, even repetitions." },
  { title: "Scales · cycle of fourths", detail: "Move through all twelve keys, one fourth at a time." },
  { title: "Arpeggios · cycle of fourths", detail: "Use the same key order to connect the scale to its tonic triad." },
];

export default function PracticePage() {
  const [mode, setMode] = useState<PracticeMode>("major");
  const [startingKey, setStartingKey] = useState("C");
  const [hands, setHands] = useState("Both hands");
  const [tempo, setTempo] = useState(72);
  const [hanonNumber, setHanonNumber] = useState(1);
  const [duration, setDuration] = useState(30);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [step, setStep] = useState(-1);
  const [keyIndex, setKeyIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          mode?: PracticeMode;
          startingKey?: string;
          hands?: string;
          tempo?: number;
          hanonNumber?: number;
          duration?: number;
        };
        const nextMode: PracticeMode = saved.mode === "minor" ? "minor" : "major";
        const choices = cycleFor(nextMode);
        setMode(nextMode);
        setStartingKey(saved.startingKey && choices.includes(saved.startingKey) ? saved.startingKey : choices[0]);
        if (saved.hands && ["Both hands", "Right hand", "Left hand"].includes(saved.hands)) setHands(saved.hands);
        if (typeof saved.tempo === "number" && saved.tempo >= 40 && saved.tempo <= 160) setTempo(saved.tempo);
        if (typeof saved.hanonNumber === "number" && saved.hanonNumber >= 1 && saved.hanonNumber <= 5) setHanonNumber(saved.hanonNumber);
        if (typeof saved.duration === "number" && DURATIONS.includes(saved.duration)) {
          setDuration(saved.duration);
          setSecondsLeft(saved.duration * 60);
        }
      }
    } catch {
      // Keep the defaults if local settings are unavailable or malformed.
    }
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ mode, startingKey, hands, tempo, hanonNumber, duration }),
    );
  }, [settingsLoaded, mode, startingKey, hands, tempo, hanonNumber, duration]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0) setRunning(false);
  }, [secondsLeft]);

  const cycle = useMemo(() => rotateCycle(mode, startingKey), [mode, startingKey]);
  const currentKey = cycle[Math.min(keyIndex, cycle.length - 1)];
  const tonic = tonicFor(mode, currentKey);
  const scale = useMemo(
    () => modeScale(tonic, mode === "major" ? "ionian" : "aeolian"),
    [tonic, mode],
  );
  const triad = useMemo(
    () => diatonicTriads(tonic, mode === "major" ? "ionian" : "aeolian")[0].notes,
    [tonic, mode],
  );
  const scaleRun = [...scale, scale[0], ...scale.slice(0, -1).reverse()];
  const arpeggioRun = [triad[0], triad[1], triad[2], triad[0], triad[2], triad[1], triad[0]];
  const allocation = splitSessionMinutes(duration);
  const isComplete = step === 3;
  const activeStep = step < 0 ? 0 : Math.min(step, 2);

  function changeMode(nextMode: PracticeMode) {
    setMode(nextMode);
    setStartingKey(cycleFor(nextMode)[0]);
  }

  function startSession() {
    if (step < 0 || isComplete) {
      setStep(0);
      setKeyIndex(0);
      setSecondsLeft(duration * 60);
    }
    setRunning(true);
  }

  function resetSession() {
    setRunning(false);
    setStep(-1);
    setKeyIndex(0);
    setSecondsLeft(duration * 60);
  }

  function advancePractice() {
    if (step === 0) {
      setStep(1);
      setKeyIndex(0);
    } else if (step === 1 && keyIndex < cycle.length - 1) {
      setKeyIndex((index) => index + 1);
    } else if (step === 1) {
      setStep(2);
      setKeyIndex(0);
    } else if (step === 2 && keyIndex < cycle.length - 1) {
      setKeyIndex((index) => index + 1);
    } else if (step === 2) {
      setRunning(false);
      setStep(3);
    }
  }

  const nextLabel =
    step === 0 ? "Begin scales" :
    step === 1 && keyIndex < cycle.length - 1 ? "Next scale key" :
    step === 1 ? "Begin arpeggios" :
    step === 2 && keyIndex < cycle.length - 1 ? "Next arpeggio key" :
    "Finish session";

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#10243a]">
      <MusicTutorNav active="/practice" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Your practice session</h1>
            <p className="mt-3 max-w-2xl text-lg leading-7 text-[#42586b]">
              A steady path through Hanon, scales, and arpeggios—following the cycle of fourths.
            </p>
          </div>
          <div className="flex items-center gap-4 self-start rounded-2xl border border-[#cbd6dc] bg-white px-5 py-4 md:self-auto">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#42586b]">
                {running ? "Session in progress" : isComplete ? "Session complete" : "Time remaining"}
              </p>
              <time className="mt-1 block font-mono text-4xl font-bold tabular-nums" aria-live="off">
                {formatTime(secondsLeft)}
              </time>
            </div>
            <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full border-[6px] border-[#ef665a] text-lg font-bold">
              {Math.round((secondsLeft / (duration * 60)) * 100)}%
            </span>
          </div>
        </div>

        <section aria-label="Session sequence" className="mt-10 border-y border-[#d7dee2] py-6">
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((item, index) => (
              <li key={item.title} className="flex gap-4">
                <span
                  aria-hidden
                  className={
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-bold " +
                    (index === activeStep
                      ? "bg-[#ef665a] text-white"
                      : index < activeStep
                        ? "bg-[#177d87] text-white"
                        : "bg-[#dfe5e7] text-[#263e52]")
                  }
                >
                  {index < activeStep ? "✓" : index + 1}
                </span>
                <div>
                  <h2 className="text-xl font-bold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#42586b]">{item.detail}</p>
                  <p className="mt-1 text-sm font-semibold text-[#177d87]">
                    {index === 0 ? allocation.hanon + " minutes" : index === 1 ? allocation.scales + " minutes" : allocation.arpeggios + " minutes"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-h-[320px] rounded-3xl bg-[#10243a] p-6 text-[#fffaf0] sm:p-8">
            {step < 0 ? (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#a9c6cf]">Ready when you are</p>
                <h2 className="mt-3 text-3xl font-bold">Start with relaxed hands.</h2>
                <p className="mt-3 max-w-xl text-lg leading-7 text-[#e1e8e9]">
                  Warm up with Hanon No. {hanonNumber}, then travel through twelve keys in both the scale and arpeggio blocks.
                </p>
                <p className="mt-6 text-base text-[#e1e8e9]">
                  {duration} minutes · {mode === "major" ? "Major" : "Minor"} · starting on {startingKey}
                </p>
              </>
            ) : isComplete ? (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#a9c6cf]">All three blocks complete</p>
                <h2 className="mt-3 text-3xl font-bold">Good work. Let it settle.</h2>
                <p className="mt-3 max-w-xl text-lg leading-7 text-[#e1e8e9]">
                  You covered the full cycle in {mode === "major" ? "major" : "minor"}: Hanon, scales, and tonic arpeggios.
                </p>
                <Link href="/cycle" className="mt-6 inline-flex rounded-xl border border-[#8ab9c2] px-4 py-3 font-bold text-white hover:bg-[#1a3a50]">
                  Review the cycle away from the keyboard
                </Link>
              </>
            ) : step === 0 ? (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#a9c6cf]">Block 1 · {allocation.hanon} minutes</p>
                <h2 className="mt-3 text-3xl font-bold">Hanon No. {hanonNumber}</h2>
                <p className="mt-3 max-w-xl text-lg leading-7 text-[#e1e8e9]">
                  Play three even repetitions. Keep the wrist easy, listen for a steady tone, and let the hands wake up before you chase speed.
                </p>
                <p className="mt-6 text-base text-[#e1e8e9]">{hands} · {tempo} BPM</p>
              </>
            ) : step === 1 ? (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#a9c6cf]">
                  Block 2 · Scale {keyIndex + 1} of {cycle.length}
                </p>
                <h2 className="mt-3 text-4xl font-extrabold">{currentKey} {mode}</h2>
                <p className="mt-4 text-lg leading-8 text-[#fffaf0]">{scaleRun.map(pretty).join(" · ")}</p>
                <p className="mt-5 text-base text-[#e1e8e9]">
                  Play up and down one octave · {hands} · {tempo} BPM
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#a9c6cf]">
                  Block 3 · Arpeggio {keyIndex + 1} of {cycle.length}
                </p>
                <h2 className="mt-3 text-4xl font-extrabold">{currentKey} {mode}</h2>
                <p className="mt-4 text-lg leading-8 text-[#fffaf0]">{arpeggioRun.map(pretty).join(" · ")}</p>
                <p className="mt-5 text-base text-[#e1e8e9]">
                  Root, third, fifth, octave, then back down · {hands} · {tempo} BPM
                </p>
              </>
            )}
          </div>

          <fieldset disabled={step >= 0 && !isComplete} className="rounded-3xl border border-[#cbd6dc] bg-white p-6 sm:p-8 disabled:opacity-70">
            <legend className="px-2 text-xl font-bold">Session settings</legend>
            <div className="mt-2 grid gap-5">
              <label className="grid gap-2 text-sm font-bold">
                Mode
                <select
                  value={mode}
                  onChange={(event) => changeMode(event.target.value as PracticeMode)}
                  className="min-h-12 rounded-xl border border-[#9daeb7] bg-white px-3 text-base font-medium text-[#10243a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#177d87]"
                >
                  <option value="major">Major keys</option>
                  <option value="minor">Minor keys</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Starting key
                <select
                  value={startingKey}
                  onChange={(event) => setStartingKey(event.target.value)}
                  className="min-h-12 rounded-xl border border-[#9daeb7] bg-white px-3 text-base font-medium text-[#10243a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#177d87]"
                >
                  {cycleFor(mode).map((key) => <option key={key} value={key}>{key}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Hands
                <select value={hands} onChange={(event) => setHands(event.target.value)} className="min-h-12 rounded-xl border border-[#9daeb7] bg-white px-3 text-base font-medium text-[#10243a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#177d87]">
                  <option>Both hands</option>
                  <option>Right hand</option>
                  <option>Left hand</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Session length
                <select
                  value={duration}
                  onChange={(event) => {
                    const nextDuration = Number(event.target.value);
                    setDuration(nextDuration);
                    setSecondsLeft(nextDuration * 60);
                  }}
                  className="min-h-12 rounded-xl border border-[#9daeb7] bg-white px-3 text-base font-medium text-[#10243a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#177d87]"
                >
                  {DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Hanon exercise
                <select value={hanonNumber} onChange={(event) => setHanonNumber(Number(event.target.value))} className="min-h-12 rounded-xl border border-[#9daeb7] bg-white px-3 text-base font-medium text-[#10243a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#177d87]">
                  {[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>No. {number}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Tempo <span className="font-mono text-[#177d87]">{tempo} BPM</span>
                <input
                  type="range"
                  min="40"
                  max="160"
                  step="2"
                  value={tempo}
                  onChange={(event) => setTempo(Number(event.target.value))}
                  className="min-h-10 accent-[#177d87]"
                />
                <span className="flex justify-between text-xs font-medium text-[#42586b]"><span>40 BPM</span><span>160 BPM</span></span>
              </label>
            </div>
          </fieldset>
        </section>

        <div className="flex flex-wrap gap-3">
          {!isComplete && (
            <button
              type="button"
              onClick={running ? () => setRunning(false) : startSession}
              className="min-h-14 rounded-xl bg-[#ef665a] px-7 py-4 text-lg font-extrabold text-white shadow-sm hover:bg-[#d95349] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10243a]"
            >
              {running ? "Pause session" : step >= 0 ? "Resume session" : "Start practice session"}
            </button>
          )}
          {step >= 0 && !isComplete && (
            <button
              type="button"
              onClick={advancePractice}
              className="min-h-14 rounded-xl bg-[#177d87] px-7 py-4 text-lg font-extrabold text-white hover:bg-[#12636c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10243a]"
            >
              {nextLabel}
            </button>
          )}
          {(step >= 0 || isComplete) && (
            <button
              type="button"
              onClick={resetSession}
              className="min-h-14 rounded-xl border border-[#81939f] bg-white px-6 py-4 text-base font-bold text-[#10243a] hover:bg-[#e8eef0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#177d87]"
            >
              Reset
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
