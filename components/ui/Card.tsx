import React, { type HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "elevated";
  interactive?: boolean;
}

export function Card({
  variant = "surface",
  interactive = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const bgStyles =
    variant === "elevated"
      ? "bg-[#171a21] shadow-elevated border-[rgba(255,255,255,0.1)]"
      : "bg-[#111318] border-[rgba(255,255,255,0.08)]";

  const interactiveStyles = interactive
    ? "cursor-pointer hover:border-[rgba(255,255,255,0.18)] hover:bg-[#151820] transition-colors duration-150 ease-out"
    : "";

  return (
    <div
      className={`rounded-xl border ${bgStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
