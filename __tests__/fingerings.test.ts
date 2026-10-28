// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { practiceFingeringFor } from "../lib/fingerings";
import { cycleFor, techniqueLabels, tonicFor } from "../lib/practice";
import { modeScale, pitchClass } from "../lib/theory";
import { TechniqueFingeringGuide } from "../components/TechniqueFingeringGuide";

function guide(
  key: string,
  mode: "major" | "minor",
  arpeggio: boolean,
  hands = "Both hands",
) {
  const root = document.createElement("div");
  root.innerHTML = renderToStaticMarkup(
    createElement(TechniqueFingeringGuide, {
      musicalKey: key,
      mode,
      arpeggio,
      hands,
    }),
  );
  return root;
}

describe("suggested one-octave piano fingerings", () => {
  it("covers all 24 practice keys, with a finger for every scale and arpeggio note", () => {
    for (const mode of ["major", "minor"] as const)
      for (const key of cycleFor(mode))
        for (const arpeggio of [false, true]) {
          const pattern = practiceFingeringFor(
            tonicFor(mode, key),
            mode,
            arpeggio,
          )!;
          expect(
            pattern,
            `${key} ${arpeggio ? "arpeggio" : "scale"}`,
          ).toBeDefined();
          for (const hand of ["rh", "lh"] as const) {
            expect(pattern[hand]).toHaveLength(arpeggio ? 4 : 8);
            expect(
              pattern[hand].every(
                (n) => Number.isInteger(n) && n >= 1 && n <= 5,
              ),
            ).toBe(true);
          }
        }
  });
  it("uses key-specific scale patterns for natural minor and black-key major scales", () => {
    expect(practiceFingeringFor("G#", "minor", false)?.lh).toEqual([
      3, 2, 1, 3, 2, 1, 4, 3,
    ]);
    expect(practiceFingeringFor("F", "minor", false)?.rh).toEqual([
      1, 2, 3, 4, 1, 2, 3, 4,
    ]);
    expect(practiceFingeringFor("F#", "minor", false)?.rh).toEqual([
      3, 4, 1, 2, 3, 1, 2, 3,
    ]);
    expect(practiceFingeringFor("Bb", "minor", false)?.lh).toEqual([
      2, 1, 3, 2, 1, 4, 3, 2,
    ]);
    expect(practiceFingeringFor("Eb", "minor", false)?.lh).toEqual([
      2, 1, 4, 3, 2, 1, 3, 2,
    ]);
    expect(practiceFingeringFor("Db", "major", false)?.rh).toEqual([
      2, 3, 1, 2, 3, 4, 1, 2,
    ]);
    expect(practiceFingeringFor("B", "major", false)?.lh).toEqual([
      4, 3, 2, 1, 4, 3, 2, 1,
    ]);
  });
  it("distinguishes white, mixed and all-black arpeggios and uses one-octave endpoints", () => {
    expect(practiceFingeringFor("C", "major", true)).toEqual({
      rh: [1, 2, 3, 5],
      lh: [5, 4, 2, 1],
    });
    expect(practiceFingeringFor("D", "major", true)?.lh).toEqual([5, 3, 2, 1]);
    expect(practiceFingeringFor("Db", "major", true)).toEqual({
      rh: [2, 1, 2, 4],
      lh: [3, 1, 4, 2],
    });
    expect(practiceFingeringFor("Bb", "minor", true)).toEqual({
      rh: [2, 3, 1, 2],
      lh: [3, 2, 1, 3],
    });
    expect(practiceFingeringFor("Eb", "minor", true)).toEqual({
      rh: [1, 2, 3, 5],
      lh: [5, 4, 2, 1],
    });
  });
  it("keeps scale thumbs on white keys in every supported key", () => {
    const black = [1, 3, 6, 8, 10];
    for (const mode of ["major", "minor"] as const)
      for (const key of cycleFor(mode)) {
        const tonic = tonicFor(mode, key);
        const notes = modeScale(tonic, mode === "major" ? "ionian" : "aeolian");
        const f = practiceFingeringFor(tonic, mode, false)!;
        for (const hand of ["rh", "lh"] as const)
          f[hand].forEach((finger, i) => {
            if (finger === 1)
              expect(black).not.toContain(pitchClass(notes[i % 7]));
          });
      }
  });
  it("has no silent fallback for unsupported practice keys", () => {
    expect(practiceFingeringFor("unsupported", "minor", true)).toBeUndefined();
    const f = practiceFingeringFor("C", "major", false)!;
    f.rh[0] = 5;
    expect(practiceFingeringFor("C", "major", false)?.rh[0]).toBe(1);
  });
});

describe("readable fingering guides", () => {
  it("pairs every displayed note with its finger in both directions, in all 24 keys", () => {
    for (const mode of ["major", "minor"] as const)
      for (const key of cycleFor(mode))
        for (const arpeggio of [false, true]) {
          const root = guide(key, mode, arpeggio);
          for (const hand of ["Right hand", "Left hand"]) {
            const up = Array.from(
              root.querySelectorAll(
                `[aria-label="${hand} ascending notes and fingers"] li`,
              ),
            ).map((e) => e.textContent?.replace(/^Note \d+/, ""));
            const down = Array.from(
              root.querySelectorAll(
                `[aria-label="${hand} descending notes and fingers"] li`,
              ),
            ).map((e) => e.textContent?.replace(/^Note \d+/, ""));
            expect(up).toHaveLength(arpeggio ? 4 : 8);
            expect(down).toEqual([...up].reverse());
          }
        }
  });
  it("respects the chosen hand, preserves note spelling and distinguishes fingers from numbers", () => {
    const left = guide("Bbm", "minor", true, "Left hand");
    expect(
      left.querySelector('[aria-label="Right hand fingering"]'),
    ).toBeNull();
    expect(
      left.querySelector('[aria-label="Left hand ascending notes and fingers"]')
        ?.textContent,
    ).toContain("B♭3Finger 3");
    expect(left.textContent).toContain("1 = thumb");
    expect(left.textContent).toContain("separate from chord numbers");
    const right = guide("C", "major", true, "Right hand");
    expect(
      right.querySelector('[aria-label="Left hand fingering"]'),
    ).toBeNull();
    expect(
      right.querySelector(
        '[aria-label="Right hand ascending notes and fingers"] li',
      )?.textContent,
    ).toBe("Note 1C4Finger 1");
    expect(techniqueLabels("C", "major", true)).toEqual([
      "C4",
      "E4",
      "G4",
      "C5",
      "G4",
      "E4",
      "C4",
    ]);
  });
});
