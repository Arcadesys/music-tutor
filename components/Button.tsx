"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-[var(--action)] text-white hover:bg-[var(--action-hover)]",
  secondary: "bg-[var(--subtle)] text-[var(--ink)] hover:bg-[var(--hover)]",
  ghost: "bg-transparent text-[var(--muted)] ring-1 ring-[var(--border)] hover:bg-[var(--surface)]",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`min-h-12 rounded-xl px-5 py-3 text-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus)] disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
