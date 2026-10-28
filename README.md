# Music Tutor

Music Tutor is a piano-practice app for building fluency through repetition, listening, and the cycle of fourths.

## Practice paths

- **Practice session** (\`/practice\`) — a configurable session with a Hanon warmup, major or minor scales through all twelve keys, and tonic-triad arpeggios in the same cycle. Choose the starting key, hands, tempo, Hanon exercise, and session length. Settings stay in this browser.
- **Walk the cycle** (\`/cycle\`) — an interactive measuring-tape sequence that repeats after twelve keys. Pick any measure, recall the next key, and reveal it. Use it away from the keyboard.
- **Focused drills** — scale fingering, circle of fifths, diatonic chords, and ear training remain available from the home page.

The cycle uses common enharmonic spellings so the sequence stays practical to read: C–F–Bb–Eb–Ab–Db–Gb–B–E–A–D–G for major, with the corresponding relative-minor labels A–D–G–C–F–Bb–Eb–G#–C#–F#–B–E.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Tone.js for the existing audio drills
- localStorage for local practice settings and quiz progress
- Vitest for the music-theory core

## Develop

\`\`\`bash
npm install
npm run dev
npm test
npm run build
\`\`\`
