"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TechniqueFingeringGuide } from "@/components/TechniqueFingeringGuide";
import { MusicTutorNav } from "@/components/MusicTutorNav";
import { MoxieIllustration } from "@/components/MoxieIllustration";
import { playPracticeEvents, stopPracticeAudio } from "@/lib/audio";
import {
  ACTIVITIES,
  PATTERNS,
  PROGRESSIONS,
  RATINGS,
  accompanimentEvents,
  chartFor,
  cycleFor,
  nextActivity,
  nextSessionKey,
  sessionPlan,
  techniqueEvents,
  techniqueLabels,
  type PracticeAttempt,
  type PracticeMode,
  type Rating,
} from "@/lib/practice";
import { readAttempts, writeAttempts } from "@/lib/storage";
import { pretty } from "@/lib/theory";
const SETTINGS_KEY = "music-tutor-practice-settings-v1";
const POSITIONS_KEY = "music-tutor-practice-positions-v1";
const DURATIONS = [10, 12, 15, 20, 25, 30];
const HANDS = ["Both hands", "Right hand", "Left hand"];
export default function PracticePage() {
  const [mode, setMode] = useState<PracticeMode>("major");
  const [positions, setPositions] = useState({ major: "C", minor: "Am" });
  const [tempo, setTempo] = useState(72);
  const [hands, setHands] = useState("Both hands");
  const [hanonNumber, setHanonNumber] = useState(1);
  const [duration, setDuration] = useState(30);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(-1);
  const [keyIndex, setKeyIndex] = useState(0);
  const [remaining, setRemaining] = useState(1800);
  const [running, setRunning] = useState(false);
  const [progressionId, setProgressionId] = useState("major-1451");
  const [patternId, setPatternId] = useState("roots");
  const [display, setDisplay] = useState("both");
  const [revealed, setRevealed] = useState(false);
  const [notes, setNotes] = useState("");
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [warning, setWarning] = useState("");
  const [canSave, setCanSave] = useState(true);
  const [status, setStatus] = useState("");
  const [audioError, setAudioError] = useState("");
  const start = positions[mode];
  const plan = sessionPlan(mode, start, duration);
  const currentKey = plan.keys[keyIndex];
  const progression =
    PROGRESSIONS.find((p) => p.id === progressionId && p.mode === mode) ??
    PROGRESSIONS.find((p) => p.mode === mode)!;
  const pattern = PATTERNS.find((p) => p.id === patternId)!;
  const chart = chartFor(currentKey, progression);
  const events =
    step === 1 || step === 2
      ? techniqueEvents(currentKey, mode, step === 2)
      : accompanimentEvents(chart, pattern);
  const complete = step === 5;
  useEffect(() => {
    const hydration = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(SETTINGS_KEY);
        const saved = raw ? JSON.parse(raw) : {};
        const m = saved?.mode === "minor" ? "minor" : "major";
        setMode(m);
        const next = { major: "C", minor: "Am" };
        if (cycleFor(m).includes(saved?.startingKey))
          next[m] = saved.startingKey;
        const positionRaw = window.localStorage.getItem(POSITIONS_KEY);
        const stored = positionRaw ? JSON.parse(positionRaw) : {};
        for (const mode of ["major", "minor"] as const)
          if (cycleFor(mode).includes(stored?.[mode]))
            next[mode] = stored[mode];
        setPositions(next);
        if (
          Number.isInteger(saved?.tempo) &&
          saved.tempo >= 40 &&
          saved.tempo <= 160
        )
          setTempo(saved.tempo);
        if (HANDS.includes(saved?.hands)) setHands(saved.hands);
        if (
          Number.isInteger(saved?.hanonNumber) &&
          saved.hanonNumber >= 1 &&
          saved.hanonNumber <= 5
        )
          setHanonNumber(saved.hanonNumber);
        if (DURATIONS.includes(saved?.duration)) {
          setDuration(saved.duration);
          setRemaining(saved.duration * 60);
        }
      } catch {
        setWarning(
          "Saved settings could not be read. Defaults are available; existing data has been kept.",
        );
      }
      try {
        const result = readAttempts(window.localStorage);
        setAttempts(result.attempts);
        if (result.warning) setWarning(result.warning);
        setCanSave(!result.warning);
      } catch {
        setWarning(
          "Browser storage unavailable. Ratings remain in this session only.",
        );
        setCanSave(false);
      }
      setLoaded(true);
    }, 0);
    return () => {
      window.clearTimeout(hydration);
      stopPracticeAudio();
    };
  }, []);
  // Settings are written only after a user edit, preserving malformed saved data on load.
  function saveSettings(change: object, nextPositions = positions) {
    try {
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          mode,
          startingKey: start,
          tempo,
          hands,
          hanonNumber,
          duration,
          ...change,
        }),
      );
      window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(nextPositions));
    } catch {
      setWarning(
        "Browser storage unavailable. Changes remain in this session only.",
      );
    }
  }
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setRemaining((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (remaining === 0) {
      stopPracticeAudio();
      const done = window.setTimeout(() => setRunning(false), 0);
      return () => window.clearTimeout(done);
    }
  }, [remaining]);
  function stop() {
    stopPracticeAudio();
    setAudioError("");
  }
  function move() {
    stop();
    setRevealed(false);
    setNotes("");
    setStatus("");
    const [s, k] = nextActivity(step, keyIndex);
    setStep(s);
    setKeyIndex(k);
    window.requestAnimationFrame(() =>
      document.getElementById("activity-title")?.focus(),
    );
    if (s === 5) setRunning(false);
  }
  function begin() {
    stop();
    setStep(0);
    setKeyIndex(0);
    setRemaining(duration * 60);
    setRunning(true);
    setRevealed(false);
    setStatus("");
  }
  function rate(rating: Rating) {
    const attempt: PracticeAttempt = {
      key: currentKey,
      mode,
      activity: ACTIVITIES[step],
      rating,
      notes,
      tempo,
      progression: progression.id,
      pattern: pattern.id,
      date: new Date().toISOString(),
    };
    const next = [...attempts, attempt];
    setAttempts(next);
    let saved = false;
    try {
      if (canSave) saved = writeAttempts(window.localStorage, next);
    } catch {}
    if (!saved)
      setWarning(
        "Rating recorded for this session only. Browser storage is unavailable or existing data needs recovery.",
      );
    setStatus(
      `${rating} recorded for ${currentKey} · ${ACTIVITIES[step]}.${saved ? " Saved in this browser." : ""}`,
    );
  }
  async function hear() {
    setAudioError("");
    try {
      await playPracticeEvents(events, tempo);
    } catch {
      setAudioError("Audio could not start. Try Hear example again.");
    }
  }
  function latest(key: string, m: PracticeMode, chords: boolean) {
    return (
      attempts
        .filter(
          (a) =>
            a.key === key &&
            a.mode === m &&
            (chords
              ? a.activity === "Chord-chart accompaniment"
              : a.activity === "Scales" || a.activity === "Arpeggios"),
        )
        .at(-1)?.rating ?? "Not assessed"
    );
  }
  return (
    <div className="practice min-h-screen bg-[var(--page)] text-[var(--ink)]">
      <MusicTutorNav active="/practice" />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <h1 className="text-4xl font-extrabold">Your practice session</h1>
          <MoxieIllustration />
        </div>
        <p className="mt-4">
          Three keys in depth · {plan.keys.join(" → ")} · {mode}
        </p>
        <p>
          Time allocations are guidance. Advancing or finishing the timer never
          establishes mastery.
        </p>
        {warning && (
          <p role="alert" className="notice">
            {warning}
          </p>
        )}
        <section aria-label="Session sequence" className="my-6">
          <ol className="session-sequence grid gap-3">
            {ACTIVITIES.map((activity, i) => (
              <li
                key={activity}
                aria-current={step === i ? "step" : undefined}
                className="rounded-xl border-2 p-3"
              >
                <strong>
                  {i + 1}. {activity}
                </strong>
                <p>{plan.minutes[i].toFixed(1)} min guidance</p>
                {step === i && <span>Current block</span>}
              </li>
            ))}
          </ol>
        </section>
        <div className="practice-workspace grid gap-6">
          <section
            className="min-w-0 rounded-2xl bg-[var(--panel)] p-6 text-white"
            aria-label="Current activity"
          >
            <p>
              Time remaining:{" "}
              <time>
                {Math.floor(remaining / 60)}:
                {String(remaining % 60).padStart(2, "0")}
              </time>
              {remaining === 0
                ? " · Guidance time ended. Continue or finish at your pace."
                : ""}
            </p>
            {step < 0 ? (
              <>
                <h2>Ready when you are</h2>
                <p>
                  Warm up with Hanon No. {hanonNumber}, then use{" "}
                  {plan.keys.join(", ")} for scales, arpeggios, accompaniment
                  and listening.
                </p>
                <p>
                  Listen to the built-in examples, play at the keyboard, then
                  assess your own comfort.
                </p>
              </>
            ) : complete ? (
              <>
                <h2 id="activity-title" tabIndex={-1}>
                  Session reviewed
                </h2>
                <p>
                  You reached the end of the five blocks. Your self-assessments
                  describe your confidence; completion is not a mastery score.
                </p>
                <p>
                  Next three:{" "}
                  {sessionPlan(
                    mode,
                    nextSessionKey(mode, start),
                    duration,
                  ).keys.join(" → ")}
                </p>
                <button onClick={begin}>Repeat these three keys</button>
                <button
                  onClick={() => {
                    const next = {
                      ...positions,
                      [mode]: nextSessionKey(mode, start),
                    };
                    setPositions(next);
                    saveSettings({ startingKey: next[mode] }, next);
                    setStep(-1);
                    setKeyIndex(0);
                    stop();
                  }}
                >
                  Prepare next three keys
                </button>
              </>
            ) : (
              <>
                <h2 tabIndex={-1} id="activity-title">
                  {ACTIVITIES[step]}
                  {step > 0 ? ` · ${currentKey} (${keyIndex + 1} of 3)` : ""}
                </h2>
                {step === 0 ? (
                  <>
                    <p>
                      Hanon No. {hanonNumber}: play three relaxed, even
                      repetitions from your exercise reference. Stop if
                      uncomfortable.
                    </p>
                    <p>
                      {hands} · {tempo} BPM. This warmup uses your Hanon
                      reference; no generated Hanon recording.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      {tempo} BPM · {hands}
                      {step >= 3
                        ? " · Reference: left-hand bass and right-hand triads"
                        : " · Reference: one right-hand octave, one note per beat"}
                    </p>
                    {mode === "minor" && (
                      <p>
                        Scales use natural minor. In charts marked “altered
                        dominant”, major V raises the leading note by a
                        semitone; v stays natural minor.
                      </p>
                    )}
                    {step === 1 || step === 2 ? (
                      <>
                        <p className="text-2xl leading-loose">
                          {techniqueLabels(currentKey, mode, step === 2)
                            .map(pretty)
                            .join(" · ")}
                        </p>
                        <p>
                          Ascend to the octave and descend to the starting note.
                          Each note lasts one beat.
                        </p>
                      </>
                    ) : (
                      <>
                        <label>
                          Built-in progression
                          <select
                            value={progression.id}
                            onChange={(e) => {
                              stop();
                              setProgressionId(e.target.value);
                              setRevealed(false);
                            }}
                          >
                            {PROGRESSIONS.filter((p) => p.mode === mode).map(
                              (p) => (
                                <option key={p.id} value={p.id}>
                                  {step === 4 && !revealed
                                    ? `Listening example ${PROGRESSIONS.filter((item) => item.mode === mode).indexOf(p) + 1}`
                                    : p.romans.join(" – ")}
                                  {p.altered && (step !== 4 || revealed)
                                    ? " · altered dominant"
                                    : ""}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                        <label>
                          Left-hand pattern
                          <select
                            value={patternId}
                            onChange={(e) => {
                              stop();
                              setPatternId(e.target.value);
                            }}
                          >
                            {PATTERNS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Chart labels
                          <select
                            value={display}
                            onChange={(e) => setDisplay(e.target.value)}
                          >
                            <option value="both">
                              Chord names and Roman numerals
                            </option>
                            <option value="names">Chord names</option>
                            <option value="numbers">Roman numerals</option>
                          </select>
                        </label>
                        {step === 4 && (
                          <>
                            <p>
                              Hear the hidden chart. Identify the chord numbers
                              by ear, then reveal and replay. Hum a starting
                              note if helpful.
                            </p>
                            <button onClick={() => setRevealed((r) => !r)}>
                              {revealed ? "Hide chart" : "Reveal chart"}
                            </button>
                          </>
                        )}
                        {step === 3 || revealed ? (
                          <>
                            <ol
                              className="chart-grid my-5 grid gap-3"
                              aria-label="Four-bar chord chart"
                            >
                              {chart.map((bar, i) => (
                                <li className="rounded-xl border-2 p-4" key={i}>
                                  <p>Bar {i + 1} · 4 beats</p>
                                  <strong className="block text-3xl">
                                    {display !== "numbers" && pretty(bar.name)}
                                    {display === "both" ? " · " : ""}
                                    {display !== "names" && bar.roman}
                                  </strong>
                                  <p>
                                    Right hand:{" "}
                                    {bar.chord.notes.map(pretty).join(" · ")}
                                  </p>
                                  <p>
                                    Left hand:{" "}
                                    {pattern.offsets
                                      .map((offset, j) => {
                                        const note =
                                          offset === 7
                                            ? bar.chord.notes[2]
                                            : bar.chord.root;
                                        const octave =
                                          offset === 12
                                            ? 3
                                            : 2 +
                                              (offset === 7 &&
                                              [
                                                "C",
                                                "D",
                                                "E",
                                                "F",
                                                "G",
                                                "A",
                                                "B",
                                              ].indexOf(note[0]) <
                                                [
                                                  "C",
                                                  "D",
                                                  "E",
                                                  "F",
                                                  "G",
                                                  "A",
                                                  "B",
                                                ].indexOf(bar.chord.root[0])
                                                ? 1
                                                : 0);
                                        return `${pretty(note)}${octave} on beat ${pattern.beats[j] + 1} (${pattern.lengths[j]} beats)`;
                                      })
                                      .join("; ")}
                                  </p>
                                </li>
                              ))}
                            </ol>
                            <p>
                              One chord per bar. In ii–V–I and ii°–V–i, hold the
                              final tonic across bars 3 and 4.
                            </p>
                          </>
                        ) : (
                          <p className="notice">
                            Chart hidden for listening. No answer is shown until
                            you reveal it.
                          </p>
                        )}
                        {step === 3 && (
                          <p>
                            Optional: sing or hum over each pattern. Which
                            supports your voice and the singer-songwriter sound
                            you want?
                          </p>
                        )}
                      </>
                    )}
                    <button onClick={() => void hear()}>Hear example</button>
                    <button onClick={stop}>Stop audio</button>
                    {audioError && <p role="alert">{audioError}</p>}
                    {(step === 1 || step === 2) && (
                      <TechniqueFingeringGuide
                        musicalKey={currentKey}
                        mode={mode}
                        arpeggio={step === 2}
                        hands={hands}
                      />
                    )}
                  </>
                )}
                <fieldset className="mt-6">
                  <legend>
                    Guided self-assessment ·{" "}
                    {step === 0 ? "Hanon warmup" : currentKey}
                  </legend>
                  <p>
                    {step <= 2
                      ? "Could you play evenly and comfortably at this tempo?"
                      : step === 3
                        ? "Could you follow the numbers and keep the left hand steady?"
                        : "Could you hear the numbers before revealing the chart?"}
                  </p>
                  <label>
                    Optional notes
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RATINGS.map((r) => (
                      <button key={r} onClick={() => rate(r)}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <p role="status">{status}</p>
                </fieldset>
                <button
                  onClick={() => {
                    stop();
                    setStatus("Repeat at your own pace.");
                  }}
                >
                  Repeat this activity
                </button>
                <button onClick={move}>
                  {step === 4 && keyIndex === 2
                    ? "Finish session"
                    : "Continue to next activity / key"}
                </button>
              </>
            )}
          </section>
          <fieldset
            disabled={!loaded || (step >= 0 && !complete)}
            className="min-w-0 rounded-2xl border-2 bg-[var(--surface)] p-5"
          >
            <legend>Session settings</legend>
            <label>
              Mode
              <select
                value={mode}
                onChange={(e) => {
                  const m = e.target.value as PracticeMode;
                  setMode(m);
                  setKeyIndex(0);
                  saveSettings({ mode: m, startingKey: positions[m] });
                  stop();
                }}
              >
                <option value="major">Major keys</option>
                <option value="minor">Minor keys</option>
              </select>
            </label>
            <label>
              Starting key
              <select
                value={start}
                onChange={(e) => {
                  const next = { ...positions, [mode]: e.target.value };
                  setPositions(next);
                  setKeyIndex(0);
                  saveSettings({ startingKey: e.target.value }, next);
                  stop();
                }}
              >
                {cycleFor(mode).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              Hands
              <select
                value={hands}
                onChange={(e) => {
                  setHands(e.target.value);
                  saveSettings({ hands: e.target.value });
                }}
              >
                {HANDS.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </label>
            <label>
              Session length
              <select
                value={duration}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setDuration(value);
                  setRemaining(value * 60);
                  saveSettings({ duration: value });
                }}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </label>
            <label>
              Hanon exercise
              <select
                value={hanonNumber}
                onChange={(e) => {
                  setHanonNumber(Number(e.target.value));
                  saveSettings({ hanonNumber: Number(e.target.value) });
                }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option value={n} key={n}>
                    No. {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tempo (BPM)
              <input
                type="number"
                min={40}
                max={160}
                value={tempo}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isInteger(value) && value >= 40 && value <= 160) {
                    setTempo(value);
                    saveSettings({ tempo: value });
                  }
                }}
              />
            </label>
            <p>
              Default: three consecutive keys. Major and minor keep separate
              starting positions.
            </p>
          </fieldset>
        </div>
        <div className="my-6 flex flex-wrap gap-3">
          {step < 0 ? (
            <button disabled={!loaded} onClick={begin}>
              Start practice session
            </button>
          ) : (
            !complete && (
              <button
                onClick={() => {
                  stop();
                  setRunning(!running);
                }}
              >
                {running ? "Pause timer" : "Resume timer"}
              </button>
            )
          )}
          {step >= 0 && (
            <button
              onClick={() => {
                stop();
                setRunning(false);
                setStep(-1);
                setKeyIndex(0);
                setRemaining(duration * 60);
              }}
            >
              Return to settings
            </button>
          )}
          <Link href="/cycle">Full repeating cycle tape</Link>
        </div>
        <section aria-label="Self-assessed progress">
          <h2>Self-assessed progress</h2>
          <p>
            Technique and chord-chart confidence are separate. Latest rating
            shown; unassessed keys stay unassessed. Ratings and notes stay in
            this browser.
          </p>
          {(["major", "minor"] as const).map((m) => (
            <section key={m}>
              <h3 className="my-4 text-2xl font-bold">All 12 {m} keys</h3>
              <ul className="progress-grid grid gap-3">
                {cycleFor(m).map((key) => (
                  <li className="rounded-xl border-2 bg-[var(--surface)] p-4" key={key}>
                    <strong className="text-2xl">{key}</strong>
                    <p>Technique: {latest(key, m, false)}</p>
                    <p>Chord-chart confidence: {latest(key, m, true)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <details className="my-5">
            <summary>Assessment history ({attempts.length})</summary>
            <ul>
              {attempts
                .slice()
                .reverse()
                .map((a, i) => (
                  <li className="my-4" key={i}>
                    {a.key} {a.mode} · {a.activity} · {a.rating} · {a.tempo} BPM
                    ·{" "}
                    {PROGRESSIONS.find(
                      (p) => p.id === a.progression,
                    )?.romans.join(" – ")}{" "}
                    · {PATTERNS.find((p) => p.id === a.pattern)?.label} ·{" "}
                    {new Date(a.date).toLocaleString()}
                    <p>{a.notes}</p>
                  </li>
                ))}
            </ul>
          </details>
        </section>
      </main>
    </div>
  );
}
