"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Progress } from "@/lib/storage";
import { ScoreBoard } from "./ScoreBoard";

export type Feedback = "correct" | "wrong" | null;

interface Props {
  title: string;
  prompt: ReactNode;
  progress: Progress;
  feedback: Feedback;
  /** Message shown in the feedback banner (e.g. the right answer after a miss). */
  feedbackMessage?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
}

export function QuizShell({
  title,
  prompt,
  progress,
  feedback,
  feedbackMessage,
  controls,
  children,
}: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-sm text-sky-400 hover:underline">
          ← All drills
        </Link>
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        <ScoreBoard progress={progress} />
      </header>

      <div
        className="rounded-2xl bg-slate-800 p-5 text-center text-2xl font-semibold text-slate-50"
        aria-live="polite"
      >
        {prompt}
      </div>

      <div
        role="status"
        aria-live="assertive"
        className={[
          "rounded-xl px-4 py-3 text-center text-lg font-bold transition-colors",
          feedback === "correct" ? "bg-emerald-600 text-white" : "",
          feedback === "wrong" ? "bg-rose-600 text-white" : "",
          feedback === null ? "bg-transparent text-transparent" : "",
        ].join(" ")}
      >
        {feedback === "correct" ? "✓ Correct" : feedback === "wrong" ? feedbackMessage ?? "✗ Try again" : "·"}
      </div>

      <div className="flex flex-col items-center gap-4">{children}</div>

      {controls && <div className="flex flex-wrap items-center justify-center gap-3">{controls}</div>}
    </main>
  );
}
