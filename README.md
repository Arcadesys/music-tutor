# Music Tutor

A music-theory drilling app — built to learn by **ear and interaction** rather than by
squinting at tiny notation. Three quiz modes:

1. **Scale Fingering** (`/fingering`) — RH/LH piano fingering for every major scale. Walk
   the keys clockwise (sharps) or counterclockwise (flats), or randomize. Hear each scale.
2. **Circle of Fifths** (`/circle`) — quiz key signatures, relative minors, and fifths by
   clicking the circle; the answer key plays back.
3. **Diatonic Chords** (`/diatonic`) — click a key's diatonic chords in order around the
   circle, with an optional **♭VII** (the Mixolydian/borrowed chord) appended.

## Stack

- **Next.js (App Router) + TypeScript**, deployable on Vercel (fully static).
- **Tailwind CSS v4** for large, high-contrast, keyboard-navigable UI.
- **Tone.js** piano sampler for audio. Audio starts on first user gesture.
- **localStorage** for streaks/progress (no backend).
- **Vitest** for the music-theory core.

## Project layout

- `lib/theory.ts` — pure, tested core: scale spelling, diatonic triads, ♭VII, circle of
  fifths, note→MIDI helpers.
- `lib/fingerings.ts` — standard one-octave major-scale fingerings (RH/LH).
- `lib/audio.ts` — Tone.js wrapper (`playNote` / `playScale` / `playChord` / `playFeedback`).
- `lib/quiz.ts` — circle-of-fifths question generators.
- `lib/storage.ts` — progress persistence.
- `components/` — `Piano`, `CircleOfFifths`, `QuizShell`, `ScoreBoard`, `Button`.
- `app/` — home + the three drill routes.

## Develop

```bash
npm run dev        # dev server
npm test           # run the theory unit tests
npm run build      # production build
```

## Extending

The shared `QuizShell` + tested `theory.ts` make new drills cheap: add a question generator
and a route. Natural next steps (from the practice notes that inspired this): diatonic chords
in each **mode**, dedicated **ear-training** intervals/melodies, and chord-chart reading.
