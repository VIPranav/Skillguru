import React from "react";

export type StatusPillVariant =
  | "live"
  | "mock"
  | "todo"
  | "in_progress"
  | "done"
  | "remediation";

export interface StatusPillProps {
  variant: StatusPillVariant;
  label?: string;
  provider?: string;
  className?: string;
}

export function StatusPill({
  variant,
  label,
  provider,
  className = "",
}: StatusPillProps) {
  const configs: Record<
    StatusPillVariant,
    { text: string; bg: string; dot: string; textClass: string }
  > = {
    live: {
      text: "Live",
      bg: "bg-[rgba(62,207,142,0.1)] border-[rgba(62,207,142,0.25)]",
      dot: "bg-[#3ecf8e]",
      textClass: "text-[#3ecf8e]",
    },
    mock: {
      text: "Mock mode",
      bg: "bg-[rgba(245,165,36,0.1)] border-[rgba(245,165,36,0.25)]",
      dot: "bg-[#f5a524]",
      textClass: "text-[#f5a524]",
    },
    todo: {
      text: "To do",
      bg: "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]",
      dot: "bg-[#8b91a1]",
      textClass: "text-[#8b91a1]",
    },
    in_progress: {
      text: "In progress",
      bg: "bg-[rgba(124,140,255,0.1)] border-[rgba(124,140,255,0.25)]",
      dot: "bg-[#7c8cff]",
      textClass: "text-[#7c8cff]",
    },
    done: {
      text: "Done",
      bg: "bg-[rgba(62,207,142,0.1)] border-[rgba(62,207,142,0.25)]",
      dot: "bg-[#3ecf8e]",
      textClass: "text-[#3ecf8e]",
    },
    remediation: {
      text: "Remediation",
      bg: "bg-[rgba(245,165,36,0.1)] border-[rgba(245,165,36,0.25)]",
      dot: "bg-[#f5a524]",
      textClass: "text-[#f5a524]",
    },
  };

  const current = configs[variant] ?? configs.todo;
  const displayText = label ?? current.text;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none ${current.bg} ${current.textClass} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${current.dot}`} aria-hidden="true" />
      <span>{displayText}</span>
      {provider && (
        <span className="text-[10px] font-mono opacity-75 font-normal">
          ({provider})
        </span>
      )}
    </span>
  );
}
