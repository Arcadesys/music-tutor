"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-sky-500 text-white hover:bg-sky-400",
  secondary: "bg-slate-700 text-slate-100 hover:bg-slate-600",
  ghost: "bg-transparent text-slate-300 ring-1 ring-slate-600 hover:bg-slate-800",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`rounded-xl px-5 py-3 text-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
