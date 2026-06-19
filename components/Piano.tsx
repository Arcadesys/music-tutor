"use client";

// Large SVG piano keyboard. Keys are addressed by MIDI number so callers can
// highlight scale tones and attach finger numbers. Used by the fingering drill.

export interface KeyMark {
  /** Tailwind fill class for the key, e.g. "fill-sky-400". */
  className?: string;
  /** Finger number (1–5) shown on the key. */
  finger?: number;
}

interface Props {
  /** Lowest rendered key (MIDI). Default C4 = 60. */
  startMidi?: number;
  /** Number of white keys to render. Default 15 (just over two octaves). */
  whiteCount?: number;
  marks?: Record<number, KeyMark>;
  onKeyClick?: (midi: number) => void;
  width?: number;
}

const WHITE_PC = new Set([0, 2, 4, 5, 7, 9, 11]);
const WHITE_W = 36;
const WHITE_H = 168;
const BLACK_W = 22;
const BLACK_H = 104;

export function Piano({
  startMidi = 60,
  whiteCount = 15,
  marks = {},
  onKeyClick,
  width,
}: Props) {
  const whites: { midi: number; x: number }[] = [];
  const blacks: { midi: number; x: number }[] = [];
  let whiteIndex = 0;
  let midi = startMidi;
  // Walk semitones, advancing the white cursor only on white keys.
  while (whites.length < whiteCount) {
    const pc = ((midi % 12) + 12) % 12;
    if (WHITE_PC.has(pc)) {
      whites.push({ midi, x: whiteIndex * WHITE_W });
      whiteIndex++;
    } else {
      blacks.push({ midi, x: whiteIndex * WHITE_W - BLACK_W / 2 });
    }
    midi++;
  }

  const totalW = whiteCount * WHITE_W;
  const interactive = Boolean(onKeyClick);

  return (
    <svg
      viewBox={`0 0 ${totalW} ${WHITE_H}`}
      width={width ?? totalW}
      height={width ? (width * WHITE_H) / totalW : WHITE_H}
      className="max-w-full select-none"
      role="group"
      aria-label="Piano keyboard"
    >
      {whites.map((k) => {
        const mark = marks[k.midi];
        return (
          <g key={k.midi}>
            <rect
              x={k.x}
              y={0}
              width={WHITE_W}
              height={WHITE_H}
              rx={4}
              className={[
                "stroke-slate-400",
                mark?.className ?? "fill-white",
                interactive ? "cursor-pointer hover:fill-slate-100" : "",
              ].join(" ")}
              onClick={interactive ? () => onKeyClick!(k.midi) : undefined}
            />
            {mark?.finger != null && (
              <text
                x={k.x + WHITE_W / 2}
                y={WHITE_H - 18}
                textAnchor="middle"
                className="pointer-events-none fill-slate-900 font-bold"
                fontSize={18}
              >
                {mark.finger}
              </text>
            )}
          </g>
        );
      })}
      {blacks.map((k) => {
        const mark = marks[k.midi];
        return (
          <g key={k.midi}>
            <rect
              x={k.x}
              y={0}
              width={BLACK_W}
              height={BLACK_H}
              rx={3}
              className={[
                "stroke-slate-900",
                mark?.className ?? "fill-slate-900",
                interactive ? "cursor-pointer hover:fill-slate-700" : "",
              ].join(" ")}
              onClick={interactive ? () => onKeyClick!(k.midi) : undefined}
            />
            {mark?.finger != null && (
              <text
                x={k.x + BLACK_W / 2}
                y={BLACK_H - 14}
                textAnchor="middle"
                className="pointer-events-none fill-white font-bold"
                fontSize={14}
              >
                {mark.finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
