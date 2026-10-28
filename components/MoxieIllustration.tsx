import Image from "next/image";

export function MoxieIllustration({ listening = false }: { listening?: boolean }) {
  return (
    <Image
      src={listening ? "/moxie-listening.png" : "/moxie-piano.png"}
      alt={listening ? "Moxie listening to music beside a keyboard" : "Moxie playing the piano"}
      width={1672}
      height={listening ? 940 : 941}
      sizes="(max-width: 640px) 100vw, 320px"
      className="h-auto w-full max-w-xs rounded-2xl"
    />
  );
}
