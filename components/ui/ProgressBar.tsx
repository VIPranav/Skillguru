import React from "react";

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: "accent" | "success" | "warning";
  size?: "sm" | "md";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = false,
  variant = "accent",
  size = "md",
  className = "",
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(safeMax, Math.max(0, value));
  const percent = Math.round((clamped / safeMax) * 100);

  const fillColors: Record<string, string> = {
    accent: "bg-[#7c8cff]",
    success: "bg-[#3ecf8e]",
    warning: "bg-[#f5a524]",
  };

  const heightClass = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs text-[#8b91a1] mb-1.5 font-medium">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono text-[#e8eaf0]">{percent}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-[#171a21] rounded-full overflow-hidden ${heightClass} border border-[rgba(255,255,255,0.04)]`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label ?? "Progress"}
      >
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out ${fillColors[variant] ?? fillColors.accent}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
