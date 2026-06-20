"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { CircleOfFifths, type Ring, type WedgeMark } from "@/components/CircleOfFifths";
import { DifficultySelect, type Difficulty } from "@/components/DifficultySelect";
import { QuizShell, type Feedback } from "@/components/QuizShell";
import { playScale, playFeedback } from "@/lib/audio";
import { CIRCLE, majorScale, pretty } from "@/lib/theory";
import { randomCircleQuestion, type CircleQuestion } from "@/lib/quiz";
import { nextProgress, recordItem, type Progress } from "@/lib/storage";

const MODE = "circle";

const HINTS: Record<Difficulty, string> = {
  easy: "The answer is shown after a miss, and you can replay the key.",
  medium: "The answer is shown after a miss.",
  hard: "No reveals, no replay — recall only.",
};

export default function CirclePage() {
  const [question, setQuestion] = useState<CircleQuestion | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({ correct: 0, attempts: 0, streak: 0, bestStreak: 0 });

  const reveal = difficulty !== "hard";

  useEffect(() => {
    setQuestion(randomCircleQuestion());
  }, []);

  function next() {
    setSolved(false);
    setFeedback(null);
    setWrong(null);
    setQuestion(randomCircleQuestion());
  }

  function select(ring: Ring, position: number) {
    if (!question || solved) return;
    const correct = ring === question.answerRing && position === question.answerPosition;
    void playFeedback(correct);
    setProgress((p) => nextProgress(p, correct));
    recordItem(MODE, `${question.answerRing}:${question.answerPosition}`, correct);
    if (correct) {
      setSolved(true);
      setFeedback("correct");
      setWrong(null);
      void playScale(majorScale(CIRCLE[position].major));
    } else {
      setFeedback("wrong");
      setWrong(`${ring}:${position}`);
    }
  }

  const marks: Record<string, WedgeMark> = {};
  if (solved && question) {
    marks[`${question.answerRing}:${question.answerPosition}`] = { className: "fill-emerald-500" };
  }
  if (wrong && !solved) {
    marks[wrong] = { className: "fill-rose-600" };
  }

  return (
    <QuizShell
      title="Circle of Fifths"
      progress={progress}
      feedback={feedback}
      feedbackMessage={
        reveal && question ? `✗ Not quite — answer: ${pretty(question.answerLabel)}` : "✗ Try again"
      }
      prompt={question?.prompt ?? "…"}
      controls={
        <>
          {solved && reveal && question && (
            <Button variant="secondary" onClick={() => void playScale(majorScale(CIRCLE[question.answerPosition].major))}>
              🔊 Hear it again
            </Button>
          )}
          <Button onClick={next}>{solved ? "Next →" : "Skip"}</Button>
        </>
      }
    >
      <DifficultySelect value={difficulty} onChange={setDifficulty} hint={HINTS[difficulty]} />
      <CircleOfFifths marks={marks} onSelect={select} />
      <p className="max-w-md text-center text-sm text-slate-400">
        Outer ring = major keys, inner ring = relative minors. Click the wedge that answers
        the prompt.
      </p>
    </QuizShell>
  );
}
