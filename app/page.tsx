import Link from "next/link";

const DRILLS = [
  {
    href: "/fingering",
    title: "Scale Fingering",
    blurb: "Learn the right- and left-hand fingering for every major scale. Walk the keys clockwise (sharps) or counterclockwise (flats), and hear each scale played.",
    emoji: "🎹",
  },
  {
    href: "/circle",
    title: "Circle of Fifths",
    blurb: "Quiz key signatures, relative minors, and fifths. Click your answer on the circle and hear the key ring out.",
    emoji: "🎯",
  },
  {
    href: "/diatonic",
    title: "Diatonic Chords",
    blurb: "Click the diatonic chords of a key in order around the circle — with an option to add the ♭VII (the Mixolydian chord).",
    emoji: "🎶",
  },
  {
    href: "/ear",
    title: "Ear Training",
    blurb: "Hear a note and click the matching key. Choose one or two octaves, white keys only or all keys.",
    emoji: "👂",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Music Tutor</h1>
        <p className="mt-2 text-lg text-slate-300">
          Get your theory down cold — by ear, not by squinting at tiny dots.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {DRILLS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700 transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl" aria-hidden>
                {d.emoji}
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-50 group-hover:text-white">{d.title}</h2>
                <p className="mt-1 text-slate-300">{d.blurb}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-auto text-center text-sm text-slate-500">
        Tip: tap any 🔊 button to hear the notes. Audio starts after your first click.
      </p>
    </main>
  );
}
