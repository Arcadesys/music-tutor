import { CIRCLE, pitchClass, pretty } from "@/lib/theory";
import type { ChartBar } from "@/lib/practice";

const CENTER = 300;
const point = (position: number, radius: number) => {
  const angle = (position * 30 - 90) * Math.PI / 180;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
};
const round = (value: number) => Math.round(value * 100) / 100;

export function ProgressionCircle({ chart }: { chart: ChartBar[] }) {
  const nodes = chart.map((bar) => {
    const minor = bar.chord.quality === "minor";
    const position = CIRCLE.findIndex((entry) => pitchClass(minor ? entry.minor.slice(0, -1) : entry.major) === pitchClass(bar.chord.root));
    return { position, minor, center: point(position, minor ? 150 : 230) };
  });
  const segments = chart.slice(1).map((bar, i) => {
    const from = nodes[i].center;
    const to = nodes[i + 1].center;
    if (nodes[i].position === nodes[i + 1].position && nodes[i].minor === nodes[i + 1].minor) {
      const radius = Math.hypot(CENTER - from.x, CENTER - from.y);
      const ux = (CENTER - from.x) / radius;
      const uy = (CENTER - from.y) / radius;
      const tx = -uy;
      const ty = ux;
      const loopPoint = (inward: number, sideways: number) => ({ x: round(from.x + ux * inward + tx * sideways), y: round(from.y + uy * inward + ty * sideways) });
      const a = loopPoint(20, -22), b = loopPoint(85, -60), c = loopPoint(85, 60), d = loopPoint(20, 22);
      return { path: `M ${a.x} ${a.y} C ${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`, label: loopPoint(70, 0), from: chart[i].name, to: bar.name };
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const bend = 25 + i * 16;
    const cx = (from.x + to.x) / 2 - dy / length * bend;
    const cy = (from.y + to.y) / 2 + dx / length * bend;
    const startLength = Math.hypot(cx - from.x, cy - from.y);
    const endLength = Math.hypot(cx - to.x, cy - to.y);
    const start = { x: from.x + (cx - from.x) * 30 / startLength, y: from.y + (cy - from.y) * 30 / startLength };
    const end = { x: to.x + (cx - to.x) * 34 / endLength, y: to.y + (cy - to.y) * 34 / endLength };
    return { path: `M ${round(start.x)} ${round(start.y)} Q ${round(cx)} ${round(cy)} ${round(end.x)} ${round(end.y)}`, label: { x: (start.x + 2 * cx + end.x) / 4, y: (start.y + 2 * cy + end.y) / 4 }, from: chart[i].name, to: bar.name };
  });
  // Keep move markers clear of every chord circle, even unselected ones.
  const chordCenters = CIRCLE.flatMap((entry) => [point(entry.position, 150), point(entry.position, 230)]);
  const markerPositions: { x: number; y: number }[] = [];
  for (const segment of segments) {
    const candidates: { x: number; y: number }[] = [];
    for (let y = 20; y <= 580; y += 10) {
      for (let x = 20; x <= 580; x += 10) {
        if (chordCenters.every((p) => Math.hypot(p.x - x, p.y - y) >= 49) &&
            markerPositions.every((p) => Math.hypot(p.x - x, p.y - y) >= 36)) {
          candidates.push({ x, y });
        }
      }
    }
    candidates.sort((a, b) => Math.hypot(a.x - segment.label.x, a.y - segment.label.y) - Math.hypot(b.x - segment.label.x, b.y - segment.label.y));
    markerPositions.push(candidates[0]);
  }

  return (
    <section className="mt-8" aria-labelledby="circle-heading">
      <h3 id="circle-heading" className="text-2xl font-extrabold">Your path around the circle</h3>
      <p className="mt-2 text-lg leading-7">Major chords are on the outside; minor chords are inside, beneath their relative major keys. Follow the numbered arrows in order.</p>
      <svg viewBox="0 0 600 600" className="mt-4 h-auto w-full max-w-xl rounded-2xl" role="img" aria-label={`Circle of fifths, with minor chords inside their relative major keys. Progression: ${chart.map((bar) => bar.name).join(" to ")}. The numbered moves are listed below.`}>
        <rect width="600" height="600" rx="18" fill="#fffaf0" />
        <circle cx={CENTER} cy={CENTER} r="230" fill="none" stroke="#536273" strokeWidth="3" />
        <circle cx={CENTER} cy={CENTER} r="150" fill="none" stroke="#536273" strokeWidth="2" />
        <defs><marker id="progression-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#18283b" /></marker></defs>
        {segments.map((segment, i) => <path key={i} d={segment.path} fill="none" stroke="#18283b" strokeWidth="4" markerEnd="url(#progression-arrow)" />)}
        {segments.map((segment, i) => <line key={`leader-${i}`} x1={round(segment.label.x)} y1={round(segment.label.y)} x2={markerPositions[i].x} y2={markerPositions[i].y} stroke="#18283b" strokeWidth="2" />)}
        {CIRCLE.flatMap((entry) => [false, true].map((minor) => {
          const p = point(entry.position, minor ? 150 : 230);
          const steps = nodes.flatMap((node, i) => node.position === entry.position && node.minor === minor ? [i + 1] : []);
          return <g key={`${entry.position}-${minor}`}><circle cx={round(p.x)} cy={round(p.y)} r="29" fill={steps.length ? "#f7bc49" : "#fffaf0"} stroke="#18283b" strokeWidth="3" /><text x={round(p.x)} y={round(p.y + (steps.length ? -6 : 1))} textAnchor="middle" dominantBaseline="middle" fill="#10243a" fontSize={minor ? 18 : 21} fontWeight="800">{pretty(minor ? entry.minor : entry.major)}</text>{steps.length > 0 && <text x={round(p.x)} y={round(p.y + 15)} textAnchor="middle" dominantBaseline="middle" fill="#10243a" fontSize="14" fontWeight="800">{steps.join(", ")}</text>}</g>;
        }))}
        {segments.map((segment, i) => <g key={`step-${i}`}><circle cx={markerPositions[i].x} cy={markerPositions[i].y} r="16" fill="#10243a" stroke="#fffaf0" strokeWidth="2" /><text x={markerPositions[i].x} y={markerPositions[i].y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="18" fontWeight="800">{i + 1}</text></g>)}
      </svg>
      <p className="mt-3 text-base">Numbers inside the chord circles show their positions in the progression. Numbered arrows show each move. Diminished chords use their root on the outer ring; their quality is in the chord chart.</p>
      <ol className="mt-3 space-y-2 text-lg">{segments.map((segment, i) => <li key={i}><strong>Move {i + 1}:</strong> {segment.from === segment.to ? `Stay on ${segment.from}` : `${segment.from} to ${segment.to}`}</li>)}</ol>
    </section>
  );
}
