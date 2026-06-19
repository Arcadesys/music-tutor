// Question generators for the Circle of Fifths quizzer. An answer is identified by
// a ring (major outer / minor inner) and a circle position, so the CircleOfFifths
// component can validate a click directly.

import { CIRCLE } from "./theory";

export interface CircleQuestion {
  prompt: string;
  answerRing: "major" | "minor";
  answerPosition: number;
  answerLabel: string;
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Generator = () => CircleQuestion;

const byAccidentals: Generator = () => {
  const k = rand(CIRCLE.filter((c) => c.accidentals > 0));
  const kind = k.sharps ? "sharp" : "flat";
  return {
    prompt: `Which major key has ${k.accidentals} ${kind}${k.accidentals > 1 ? "s" : ""}?`,
    answerRing: "major",
    answerPosition: k.position,
    answerLabel: k.major,
  };
};

const relativeMinor: Generator = () => {
  const k = rand(CIRCLE);
  return {
    prompt: `What is the relative minor of ${k.major} major?`,
    answerRing: "minor",
    answerPosition: k.position,
    answerLabel: k.minor,
  };
};

const relativeMajor: Generator = () => {
  const k = rand(CIRCLE);
  return {
    prompt: `What is the relative major of ${k.minor}?`,
    answerRing: "major",
    answerPosition: k.position,
    answerLabel: k.major,
  };
};

const fifthAbove: Generator = () => {
  const k = rand(CIRCLE);
  const target = CIRCLE[(k.position + 1) % 12];
  return {
    prompt: `Which key is a perfect fifth above ${k.major}?`,
    answerRing: "major",
    answerPosition: target.position,
    answerLabel: target.major,
  };
};

const fifthBelow: Generator = () => {
  const k = rand(CIRCLE);
  const target = CIRCLE[(k.position + 11) % 12];
  return {
    prompt: `Which key is a perfect fifth below ${k.major}?`,
    answerRing: "major",
    answerPosition: target.position,
    answerLabel: target.major,
  };
};

const GENERATORS: Generator[] = [
  byAccidentals,
  relativeMinor,
  relativeMajor,
  fifthAbove,
  fifthBelow,
];

export function randomCircleQuestion(): CircleQuestion {
  return rand(GENERATORS)();
}
