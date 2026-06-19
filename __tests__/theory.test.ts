import { describe, it, expect } from "vitest";
import {
  majorScale,
  diatonicTriads,
  flatSevenChord,
  keysAroundCircle,
  CIRCLE,
  findCircleKey,
} from "@/lib/theory";

describe("majorScale", () => {
  it("spells C major with no accidentals", () => {
    expect(majorScale("C")).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
  });

  it("spells F# major with E# (one note per letter)", () => {
    expect(majorScale("F#")).toEqual(["F#", "G#", "A#", "B", "C#", "D#", "E#"]);
  });

  it("spells Gb major with Cb", () => {
    expect(majorScale("Gb")).toEqual(["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"]);
  });

  it("spells Eb major", () => {
    expect(majorScale("Eb")).toEqual(["Eb", "F", "G", "Ab", "Bb", "C", "D"]);
  });

  it("uses each letter exactly once for every circle key", () => {
    for (const { major } of CIRCLE) {
      const letters = majorScale(major).map((n) => n[0]);
      expect(new Set(letters).size).toBe(7);
    }
  });
});

describe("diatonicTriads", () => {
  it("produces C major triads with correct qualities", () => {
    const chords = diatonicTriads("C");
    expect(chords.map((c) => c.root)).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    expect(chords.map((c) => c.roman)).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
  });

  it("builds the correct notes for the C major V chord (G–B–D)", () => {
    expect(diatonicTriads("C")[4].notes).toEqual(["G", "B", "D"]);
  });

  it("builds a diminished vii° in G major (F#–A–C)", () => {
    const vii = diatonicTriads("G")[6];
    expect(vii.quality).toBe("diminished");
    expect(vii.notes).toEqual(["F#", "A", "C"]);
  });
});

describe("flatSevenChord", () => {
  it("is Bb major in C", () => {
    const chord = flatSevenChord("C");
    expect(chord.roman).toBe("♭VII");
    expect(chord.root).toBe("Bb");
    expect(chord.quality).toBe("major");
    expect(chord.notes).toEqual(["Bb", "D", "F"]);
  });

  it("is F major in G", () => {
    expect(flatSevenChord("G").notes).toEqual(["F", "A", "C"]);
  });
});

describe("circle of fifths", () => {
  it("orders clockwise by sharps and counterclockwise by flats", () => {
    expect(keysAroundCircle("clockwise").slice(0, 4)).toEqual(["C", "G", "D", "A"]);
    expect(keysAroundCircle("counterclockwise").slice(0, 4)).toEqual(["C", "F", "Bb", "Eb"]);
  });

  it("knows A major has 3 sharps", () => {
    const a = findCircleKey("A");
    expect(a?.accidentals).toBe(3);
    expect(a?.sharps).toBe(true);
  });

  it("resolves enharmonic spellings", () => {
    expect(findCircleKey("F#")?.major).toBe("Gb");
  });
});
