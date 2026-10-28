import { ThemeControl } from "./ThemeControl";
import Link from "next/link";

type Route = "/" | "/practice" | "/cycle";

const LINKS: { href: Route; label: string }[] = [
  { href: "/practice", label: "Practice" },
  { href: "/cycle", label: "Cycle" },
  { href: "/", label: "Drills" },
];

export function MusicTutorNav({ active }: { active: Route }) {
  return (
    <header className="border-b border-[#d7dee2] bg-[#10243a] text-[#fffaf0]">
      <div className="mx-auto flex max-w-6xl items-center flex-wrap justify-between gap-4 px-5 py-4">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff786b]"
        >
          Music Tutor
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1 sm:gap-3"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "page" : undefined}
              className={
                "rounded-t-lg border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff786b] " +
                (active === link.href
                  ? "border-[#ff786b] text-white"
                  : "border-transparent text-[#d8e1e7] hover:text-white")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <ThemeControl />
      </div>
    </header>
  );
}
