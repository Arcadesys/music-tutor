import { describe, it, expect } from "vitest";
import {
  majorScale,
  modeScale,
  diatonicTriads,
  flatSevenChord,
  solfege,
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

describe("modeScale", () => {
  it("spells D Dorian using the white keys", () => {
    expect(modeScale("D", "dorian")).toEqual(["D", "E", "F", "G", "A", "B", "C"]);
  });

  it("spells G Mixolydian with F natural", () => {
    expect(modeScale("G", "mixolydian")).toEqual(["G", "A", "B", "C", "D", "E", "F"]);
  });

  it("spells E Phrygian on the white keys", () => {
    expect(modeScale("E", "phrygian")).toEqual(["E", "F", "G", "A", "B", "C", "D"]);
  });

  it("spells F Lydian with B natural (#4)", () => {
    expect(modeScale("F", "lydian")).toEqual(["F", "G", "A", "B", "C", "D", "E"]);
  });

  it("uses each letter exactly once across every mode", () => {
    const modes = ["dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"] as const;
    for (const mode of modes) {
      const letters = modeScale("C", mode).map((n) => n[0]);
      expect(new Set(letters).size).toBe(7);
    }
  });
});

describe("diatonicTriads (modal)", () => {
  it("recolors C Mixolydian: I ii iii° IV v vi ♭VII (not major + appended ♭VII)", () => {
    const chords = diatonicTriads("C", "mixolydian");
    expect(chords.map((c) => c.roman)).toEqual(["I", "ii", "iii°", "IV", "v", "vi", "♭VII"]);
    expect(chords[6].root).toBe("Bb");
    expect(chords[6].quality).toBe("major");
  });

  it("recolors D Dorian: i ii ♭III IV v vi° ♭VII", () => {
    const chords = diatonicTriads("D", "dorian");
    expect(chords.map((c) => c.roman)).toEqual(["i", "ii", "♭III", "IV", "v", "vi°", "♭VII"]);
  });

  it("marks the raised fourth in Lydian (♯iv°)", () => {
    expect(diatonicTriads("C", "lydian").map((c) => c.roman)).toEqual([
      "I",
      "II",
      "iii",
      "♯iv°",
      "V",
      "vi",
      "vii",
    ]);
  });
});

describe("solfege (movable do)", () => {
  it("maps the C major scale to do re mi fa sol la ti", () => {
    expect(majorScale("C").map((n) => solfege(n, "C"))).toEqual([
      "do",
      "re",
      "mi",
      "fa",
      "sol",
      "la",
      "ti",
    ]);
  });

  it("uses lowered syllables for the Dorian ♭3 and ♭7", () => {
    expect(modeScale("D", "dorian").map((n) => solfege(n, "D"))).toEqual([
      "do",
      "re",
      "me",
      "fa",
      "sol",
      "la",
      "te",
    ]);
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
