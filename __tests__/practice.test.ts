import { describe, expect, it } from "vitest";
import {
  ACTIVITIES,
  PATTERNS,
  PROGRESSIONS,
  accompanimentEvents,
  chartFor,
  cycleFor,
  nextActivity,
  nextSessionKey,
  sessionPlan,
  techniqueEvents,
  techniqueLabels,
  timedEvents,
  type PracticeAttempt,
} from "../lib/practice";
import { pitchClass } from "../lib/theory";
import { ATTEMPTS_KEY, readAttempts, writeAttempts } from "../lib/storage";

describe("three-key cycle planning", () => {
  it("wraps at the cycle boundary and keeps the same keys across blocks", () => {
    expect(sessionPlan("major", "G", 30).keys).toEqual(["G", "C", "F"]);
    expect(sessionPlan("minor", "Em", 20).keys).toEqual(["Em", "Am", "Dm"]);
    expect(nextSessionKey("major", "G")).toBe("Bb");
    expect(
      sessionPlan("major", "C", 30).minutes.reduce((a, b) => a + b, 0),
    ).toBe(30);
    let state: [number, number] = [0, 0];
    const visited = [];
    while (state[0] < 5) {
      visited.push(state);
      state = nextActivity(...state);
    }
    expect(visited).toHaveLength(13);
    for (let step = 1; step < 5; step++)
      expect(visited.filter(([s]) => s === step).map(([, k]) => k)).toEqual([
        0, 1, 2,
      ]);
    expect(ACTIVITIES).toHaveLength(5);
  });
});
describe("charts and reference events", () => {
  it("transposes all eight charts in all 24 keys with correct intervals and spelling", () => {
    for (const p of PROGRESSIONS)
      for (const key of cycleFor(p.mode)) {
        const chart = chartFor(key, p);
        expect(chart).toHaveLength(4);
        for (const { chord } of chart) {
          const intervals = chord.notes.map(
            (n) => (pitchClass(n) - pitchClass(chord.root) + 12) % 12,
          );
          expect(intervals).toEqual(
            chord.quality === "major"
              ? [0, 4, 7]
              : chord.quality === "minor"
                ? [0, 3, 7]
                : [0, 3, 6],
          );
        }
        expect(chart.map((b) => b.roman)).toEqual(p.romans);
      }
    expect(chartFor("Db", PROGRESSIONS[0]).map((b) => b.name)).toEqual([
      "Db",
      "Gb",
      "Ab",
      "Db",
    ]);
    expect(chartFor("Am", PROGRESSIONS[6])[2].chord.notes).toEqual([
      "E",
      "G#",
      "B",
    ]);
    expect(chartFor("Ebm", PROGRESSIONS[6])[2].chord.notes).toEqual([
      "Bb",
      "D",
      "F",
    ]);
    expect(chartFor("G#m", PROGRESSIONS[7])[1].chord.notes).toEqual([
      "D#",
      "F##",
      "A#",
    ]);
  });
  it("ascends and descends at the selected tempo, preserving flat spellings", () => {
    const run = techniqueEvents("Bb", "major", false);
    expect(run.map((e) => e.midis[0])).toEqual([
      70, 72, 74, 75, 77, 79, 81, 82, 81, 79, 77, 75, 74, 72, 70,
    ]);
    expect(techniqueLabels("Bb", "major", false)[0]).toBe("Bb4");
    expect(techniqueEvents("Am", "minor", true).map((e) => e.midis[0])).toEqual(
      [69, 72, 76, 81, 76, 72, 69],
    );
    expect(timedEvents(run, 60)[1].seconds).toBe(1);
    expect(timedEvents(run, 120)[1].seconds).toBe(0.5);
  });
  it("holds the final tonic for two bars and aligns all bass notes to visible beats", () => {
    const chart = chartFor("C", PROGRESSIONS[1]);
    const events = accompanimentEvents(chart, PATTERNS[2]);
    expect(
      events.filter((e) => e.midis.length === 3).map((e) => [e.beat, e.beats]),
    ).toEqual([
      [0, 4],
      [4, 4],
      [8, 8],
    ]);
    expect(
      events
        .filter((e) => e.midis.length === 1)
        .slice(0, 4)
        .map((e) => [e.midis[0], e.beat]),
    ).toEqual([
      [38, 0],
      [45, 1],
      [50, 2],
      [45, 3],
    ]);
    expect(Math.max(...events.map((e) => e.beat + e.beats))).toBe(16);
  });
});
it("uses the chord's diminished fifth in the minor ii° bass pattern", () => {
  const chart = chartFor("Am", PROGRESSIONS[7]);
  const bass = accompanimentEvents(chart, PATTERNS[2]).filter(
    (e) => e.midis.length === 1,
  );
  expect(bass.slice(0, 4).map((e) => e.midis[0])).toEqual([47, 53, 59, 53]);
});

describe("local self-assessment persistence", () => {
  const attempt: PracticeAttempt = {
    key: "C",
    mode: "major",
    activity: "Scales",
    rating: "Getting there",
    notes: "Even tone",
    tempo: 72,
    progression: "major-1451",
    pattern: "roots",
    date: "2026-10-26T12:00:00Z",
  };
  it("survives reload and leaves old quiz/settings records untouched", () => {
    const data = new Map([
      ["music-tutor:progress:ear", '{"attempts":7}'],
      ["music-tutor-practice-settings-v1", '{"tempo":60}'],
    ]);
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
    expect(writeAttempts(storage, [attempt])).toBe(true);
    expect(readAttempts(storage).attempts).toEqual([attempt]);
    expect(data.get("music-tutor:progress:ear")).toBe('{"attempts":7}');
    expect(data.get("music-tutor-practice-settings-v1")).toBe('{"tempo":60}');
  });
  it("rejects malformed or invalid records without overwriting them", () => {
    for (const raw of [
      "{",
      "null",
      "{}",
      "[null]",
      JSON.stringify([{ ...attempt, tempo: 0 }]),
    ]) {
      const data = new Map([[ATTEMPTS_KEY, raw]]);
      const result = readAttempts({ getItem: (k) => data.get(k) ?? null });
      expect(result.attempts).toEqual([]);
      expect(result.warning).not.toBe("");
      expect(data.get(ATTEMPTS_KEY)).toBe(raw);
    }
  });
  it("reports unavailable storage", () => {
    expect(
      readAttempts({
        getItem: () => {
          throw Error("denied");
        },
      }).warning,
    ).not.toBe("");
    expect(
      writeAttempts(
        {
          setItem: () => {
            throw Error("quota");
          },
        },
        [attempt],
      ),
    ).toBe(false);
  });
});
