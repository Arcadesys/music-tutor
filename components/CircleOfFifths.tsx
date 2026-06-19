"use client";

import { CIRCLE, pretty } from "@/lib/theory";

export type Ring = "major" | "minor";

export interface WedgeMark {
  /** Tailwind fill/stroke classes applied to the wedge, e.g. "fill-emerald-500". */
  className?: string;
  /** Small badge text drawn near the wedge (e.g. the order number in a sequence). */
  badge?: string;
}

interface Props {
  size?: number;
  /** Marks keyed by `${ring}:${position}`. */
  marks?: Record<string, WedgeMark>;
  onSelect?: (ring: Ring, position: number) => void;
}

const CX = 200;
const CY = 200;
const R_OUTER = 192;
const R_MID = 128;
const R_HOLE = 64;

const rad = (deg: number) => (deg * Math.PI) / 180;
// Round to a fixed precision so server- and client-rendered SVG strings match
// exactly (avoids React hydration mismatches from last-digit float differences).
const r2 = (n: number) => Math.round(n * 100) / 100;
const point = (r: number, deg: number): [number, number] => [
  r2(CX + r * Math.cos(rad(deg))),
  r2(CY + r * Math.sin(rad(deg))),
];

/** Annular sector path between radii ri..ro spanning a0..a1 degrees. */
function sector(a0: number, a1: number, ri: number, ro: number): string {
  const [ox0, oy0] = point(ro, a0);
  const [ox1, oy1] = point(ro, a1);
  const [ix1, iy1] = point(ri, a1);
  const [ix0, iy0] = point(ri, a0);
  return [
    `M ${ox0} ${oy0}`,
    `A ${ro} ${ro} 0 0 1 ${ox1} ${oy1}`,
    `L ${ix1} ${iy1}`,
    `A ${ri} ${ri} 0 0 0 ${ix0} ${iy0}`,
    "Z",
  ].join(" ");
}

export function CircleOfFifths({ size = 380, marks = {}, onSelect }: Props) {
  const wedges: { ring: Ring; position: number; ri: number; ro: number; rLabel: number; label: string; fontSize: number }[] =
    [];
  for (const k of CIRCLE) {
    wedges.push({ ring: "major", position: k.position, ri: R_MID, ro: R_OUTER, rLabel: 160, label: k.major, fontSize: 19 });
    wedges.push({ ring: "minor", position: k.position, ri: R_HOLE, ro: R_MID, rLabel: 96, label: k.minor, fontSize: 14 });
  }

  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className="max-w-full select-none"
      role="group"
      aria-label="Circle of fifths"
    >
      {wedges.map((w) => {
        // Center each position; wedge spans ±15° around (position*30 - 90).
        const center = w.position * 30 - 90;
        const a0 = center - 15;
        const a1 = center + 15;
        const mark = marks[`${w.ring}:${w.position}`];
        const [lx, ly] = point(w.rLabel, center);
        const interactive = Boolean(onSelect);
        return (
          <g key={`${w.ring}:${w.position}`}>
            <path
              d={sector(a0, a1, w.ri, w.ro)}
              className={[
                "stroke-2 transition-colors",
                mark?.className ?? (w.ring === "major" ? "fill-slate-700" : "fill-slate-800"),
                "stroke-slate-950",
                interactive ? "cursor-pointer hover:brightness-125 focus:outline-none focus-visible:fill-sky-600" : "",
              ].join(" ")}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={`${w.label} ${w.ring}`}
              onClick={interactive ? () => onSelect!(w.ring, w.position) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect!(w.ring, w.position);
                      }
                    }
                  : undefined
              }
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none fill-slate-50 font-semibold"
              fontSize={w.fontSize}
            >
              {pretty(w.label)}
            </text>
            {mark?.badge && (
              <text
                x={point(w.ring === "major" ? w.ro - 16 : w.ro - 14, center)[0]}
                y={point(w.ring === "major" ? w.ro - 16 : w.ro - 14, center)[1]}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none fill-amber-300 font-bold"
                fontSize={13}
              >
                {mark.badge}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
