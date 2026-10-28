import { practiceFingeringFor } from "@/lib/fingerings";
import { techniqueLabels, tonicFor, type PracticeMode } from "@/lib/practice";
import { pretty } from "@/lib/theory";

export function TechniqueFingeringGuide({
  musicalKey,
  mode,
  arpeggio,
  hands,
}: {
  musicalKey: string;
  mode: PracticeMode;
  arpeggio: boolean;
  hands: string;
}) {
  const fingers = practiceFingeringFor(
    tonicFor(mode, musicalKey),
    mode,
    arpeggio,
  );
  if (!fingers) return <p>Fingering guide unavailable for this key.</p>;
  const labels = techniqueLabels(musicalKey, mode, arpeggio);
  const up = labels.slice(0, arpeggio ? 4 : 8);
  const selected =
    hands === "Left hand"
      ? (["lh"] as const)
      : hands === "Right hand"
        ? (["rh"] as const)
        : (["rh", "lh"] as const);
  return (
    <section aria-label="Fingering guide" className="fingering-guide mt-6">
      <h3 className="text-2xl font-extrabold">
        {arpeggio ? "Arpeggio" : "Scale"} fingering guide
      </h3>
      <p>
        One octave · {pretty(musicalKey)}{" "}
        {mode === "minor" && !arpeggio ? "natural minor" : mode}. Finger numbers
        are separate from chord numbers.
      </p>
      <p>1 = thumb · 2 = index · 3 = middle · 4 = ring · 5 = little finger</p>
      <p>
        Start slowly. For scales, let the thumb pass under or the fingers cross
        over where the numbers turn. For arpeggios, move the hand with the
        notes; avoid holding a stretched position.
      </p>
      {selected.map((hand) => {
        const name = hand === "rh" ? "Right hand" : "Left hand";
        // A lower LH register keeps both hands from occupying the same keys.
        const handNotes = up.map((note) =>
          hand === "lh"
            ? note.replace(/\d+$/, (n) => String(Number(n) - 1))
            : note,
        );
        return (
          <section key={hand} aria-label={`${name} fingering`} className="mt-6">
            <h4 className="text-2xl font-bold">{name}</h4>
            {(["Ascending", "Descending"] as const).map((direction) => {
              const notes =
                direction === "Ascending"
                  ? handNotes
                  : [...handNotes].reverse();
              const numbers =
                direction === "Ascending"
                  ? fingers[hand]
                  : [...fingers[hand]].reverse();
              return (
                <div key={direction} className="my-4">
                  <h5 className="text-xl font-bold">
                    {direction} ·{" "}
                    {direction === "Ascending" ? "low to high" : "high to low"}
                  </h5>
                  <ol
                    aria-label={`${name} ${direction.toLowerCase()} notes and fingers`}
                    className="finger-note-grid mt-3 grid gap-3"
                  >
                    {notes.map((note, i) => (
                      <li key={i} className="rounded-xl border-2 p-3">
                        <span className="block">Note {i + 1}</span>
                        <strong className="block text-3xl">
                          {pretty(note)}
                        </strong>
                        <span className="block text-xl">
                          Finger <strong>{numbers[i]}</strong>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </section>
        );
      })}
      <p>
        Play the top tonic once, then follow the descending row from its second
        note. Left-hand notes are shown one octave below the right-hand
        reference audio.
      </p>
      <details>
        <summary>About these fingerings</summary>
        <p>
          These are suggested one-octave patterns. Starting and ending fingers
          can differ from patterns used to continue through several octaves. A
          teacher may suggest a variant for your hand.
        </p>
        <p>
          References:{" "}
          <a href="https://vip.wartburg.edu/musicdept/fandp.pdf">
            Wartburg scale and arpeggio groups (PDF)
          </a>{" "}
          and{" "}
          <a href="https://colorinmypiano.com/download/scale__arpeggio_fingerings_for_piano_2_octave.pdf">
            Joy Morin’s fingering reference (PDF)
          </a>
          .
        </p>
      </details>
    </section>
  );
}
