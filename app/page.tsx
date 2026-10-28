import Link from "next/link";
import { MoxieIllustration } from "@/components/MoxieIllustration";
import { MusicTutorNav } from "@/components/MusicTutorNav";

const DRILLS = [
  { href: "/progressions", title: "Progression recall", detail: "Name the chords in a progression for any major or minor key." },
  { href: "/fingering", title: "Scale fingering", detail: "Practice right- and left-hand patterns in every major key." },
  { href: "/circle", title: "Circle of fifths", detail: "Recall key signatures, relative minors, and fifths." },
  { href: "/diatonic", title: "Diatonic chords", detail: "Find the chords that belong to a key, including ♭VII." },
  { href: "/ear", title: "Ear training", detail: "Hear a note and find it on the keyboard." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)]">
      <MusicTutorNav active="/" />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
        <section className="grid gap-10 border-b border-[var(--border)] pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl">
              Make fluency feel like practice.
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-[var(--muted)]">
              A clear, repeatable path through Hanon, scales, and arpeggios—then a cycle you can carry with you away from the keyboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/practice" className="inline-flex min-h-14 items-center rounded-xl bg-[var(--action)] px-6 py-4 text-lg font-extrabold text-white hover:bg-[var(--action-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]">
                Start a practice session
              </Link>
              <Link href="/cycle" className="inline-flex min-h-14 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-lg font-bold text-[var(--ink)] hover:bg-[var(--hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]">
                Walk the cycle
              </Link>
            </div>
          </div>
          <div>
          <div className="mb-5"><MoxieIllustration featured /></div>
          <div className="rounded-3xl bg-[var(--panel)] p-7 text-[#fffaf0] sm:p-8">
            <h2 className="text-2xl font-extrabold">Every session has a shape</h2>
            <ol className="mt-5 space-y-4">
              {["Hanon warmup", "Scales through twelve keys", "Tonic arpeggios through twelve keys"].map((item, index) => (
                <li key={item} className="flex items-center gap-4 text-lg font-semibold">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--action)] text-base font-extrabold text-white">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-[var(--panel-border)] pt-5 text-base leading-7 text-[#dce5e8]">
              Major and minor modes. A configurable starting key. A tempo you can grow into.
            </p>
          </div>
          </div>
        </section>

        <section className="py-10">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-extrabold">Quick drills</h2>
              <p className="mt-2 text-lg text-[var(--muted)]">Keep the focused practice tools close at hand.</p>
            </div>
            <span className="text-sm font-semibold text-[var(--muted)]">Existing exercises remain part of the tutor</span>
          </div>
          <ul className="mt-6 grid gap-x-8 gap-y-0 border-y border-[var(--border)] sm:grid-cols-2">
            {DRILLS.map((drill) => (
              <li key={drill.href} className="border-b border-[var(--border)] last:border-b-0 sm:nth-last-2:border-b-0">
                <Link href={drill.href} className="group block py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]">
                  <h3 className="text-xl font-extrabold group-hover:text-[var(--accent)]">{drill.title} <span aria-hidden>↗</span></h3>
                  <p className="mt-1 max-w-lg leading-6 text-[var(--muted)]">{drill.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
