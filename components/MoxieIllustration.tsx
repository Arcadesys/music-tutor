import Image from "next/image";

export function MoxieIllustration({ listening = false, featured = false }: { listening?: boolean; featured?: boolean }) {
  return (
    <figure className={`w-full overflow-hidden rounded-3xl border-2 border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_8px_24px_rgba(16,36,58,0.14)] ${featured ? "max-w-none" : "max-w-xs"}`}>
      <div className="overflow-hidden rounded-2xl bg-[var(--subtle)]">
        <Image
          src={listening ? "/moxie-listening.png" : "/moxie-piano.png"}
          alt={listening ? "Moxie listening to music beside a keyboard" : featured ? "Moxie, a fox with purple glasses, playing a purple piano" : "Moxie playing the piano"}
          width={1672}
          height={listening ? 940 : 941}
          sizes={featured ? "(max-width: 1024px) 100vw, 480px" : "(max-width: 640px) 100vw, 320px"}
          priority={featured}
          className="block h-auto w-full"
        />
      </div>
      <div aria-hidden="true" className="flex gap-1.5 px-2 pb-1 pt-2">
        <span className="h-1.5 w-10 rounded-full bg-[var(--action)]" />
        <span className="h-1.5 w-3 rounded-full bg-[var(--border)]" />
        <span className="h-1.5 w-3 rounded-full bg-[var(--border)]" />
      </div>
    </figure>
  );
}
