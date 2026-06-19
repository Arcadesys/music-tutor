"use client";

// Large SVG fretboard for guitar/bass. Positions are addressed by MIDI number so
// callers can highlight pitches and wire click handlers, mirroring the Piano API.
// The same pitch can live on several strings; a mark highlights every position
// that sounds it. Used by the ear-training drill.

export interface FretMark {
  /** Tailwind fill class for matching positions, e.g. "fill-emerald-400". */
  className?: string;
}

interface Props {
  /** Open-string MIDI numbers, lowest string first. */
  tuning: number[];
  /** Frets to render past the nut. Default 12. */
  frets?: number;
  /** Marks keyed by MIDI; every position sounding that pitch is highlighted. */
  marks?: Record<number, FretMark>;
  onFretClick?: (midi: number) => void;
  width?: number;
}

/** Standard 6-string guitar tuning, low E to high E (MIDI). */
export const GUITAR_TUNING = [40, 45, 50, 55, 59, 64];
/** Standard 4-string bass tuning, low E to high G (MIDI). */
export const BASS_TUNING = [28, 33, 38, 43];

const OPEN_W = 48; // open-string column, left of the nut
const FRET_W = 50;
const STRING_GAP = 42;
const PAD_TOP = 24;
const PAD_BOTTOM = 32; // room for fret-number labels
const DOT = 14; // clickable note radius
const INLAYS = new Set([3, 5, 7, 9, 12]);

export function Fretboard({ tuning, frets = 12, marks = {}, onFretClick, width }: Props) {
  const strings = tuning.length;
  const boardW = OPEN_W + frets * FRET_W;
  const boardH = (strings - 1) * STRING_GAP;
  const totalW = boardW;
  const totalH = PAD_TOP + boardH + PAD_BOTTOM;
  const interactive = Boolean(onFretClick);
  const midY = PAD_TOP + boardH / 2;

  // Highest-pitched string on top (row 0).
  const rows = [...tuning].reverse();
  const yFor = (rowIdx: number) => PAD_TOP + rowIdx * STRING_GAP;
  const xFor = (fret: number) => (fret === 0 ? OPEN_W / 2 : OPEN_W + (fret - 0.5) * FRET_W);

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      width={width ?? totalW}
      height={width ? (width * totalH) / totalW : totalH}
      className="max-w-full select-none"
      role="group"
      aria-label="Fretboard"
    >
      {/* Fretboard wood */}
      <rect
        x={OPEN_W}
        y={PAD_TOP - STRING_GAP / 2}
        width={frets * FRET_W}
        height={boardH + STRING_GAP}
        className="fill-slate-800"
      />

      {/* Inlay markers */}
      {Array.from({ length: frets }, (_, i) => i + 1)
        .filter((f) => INLAYS.has(f))
        .map((f) => (
          <circle
            key={`inlay-${f}`}
            cx={xFor(f)}
            cy={midY}
            r={5}
            className="fill-slate-600"
          />
        ))}

      {/* Fret wires (fret 0 = nut, drawn thicker) */}
      {Array.from({ length: frets + 1 }, (_, f) => (
        <line
          key={`fret-${f}`}
          x1={OPEN_W + f * FRET_W}
          y1={PAD_TOP - STRING_GAP / 2}
          x2={OPEN_W + f * FRET_W}
          y2={PAD_TOP + boardH + STRING_GAP / 2}
          className={f === 0 ? "stroke-slate-200" : "stroke-slate-500"}
          strokeWidth={f === 0 ? 4 : 2}
        />
      ))}

      {/* Strings */}
      {rows.map((_, rowIdx) => (
        <line
          key={`string-${rowIdx}`}
          x1={OPEN_W}
          y1={yFor(rowIdx)}
          x2={boardW}
          y2={yFor(rowIdx)}
          className="stroke-slate-400"
          strokeWidth={1 + (strings - 1 - rowIdx) * 0.5}
        />
      ))}

      {/* Fret numbers */}
      {Array.from({ length: frets }, (_, i) => i + 1).map((f) => (
        <text
          key={`num-${f}`}
          x={xFor(f)}
          y={totalH - 10}
          textAnchor="middle"
          className="pointer-events-none fill-slate-400"
          fontSize={14}
        >
          {f}
        </text>
      ))}

      {/* Clickable note positions */}
      {rows.map((open, rowIdx) =>
        Array.from({ length: frets + 1 }, (_, f) => {
          const midi = open + f;
          const mark = marks[midi];
          return (
            <circle
              key={`note-${rowIdx}-${f}`}
              cx={xFor(f)}
              cy={yFor(rowIdx)}
              r={DOT}
              className={[
                "stroke-slate-500",
                mark?.className ?? "fill-slate-700/60",
                interactive ? "cursor-pointer hover:fill-slate-500" : "",
              ].join(" ")}
              onClick={interactive ? () => onFretClick!(midi) : undefined}
            />
          );
        }),
      )}
    </svg>
  );
}
