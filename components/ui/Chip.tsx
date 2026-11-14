import React from "react";

export type ChipVariant = "default" | "accent" | "success" | "warning" | "danger" | "muted";

export interface ChipProps {
  children: React.ReactNode;
  variant?: ChipVariant;
  size?: "sm" | "md";
  onRemove?: () => void;
  className?: string;
  onClick?: () => void;
}

export function Chip({
  children,
  variant = "default",
  size = "md",
  onRemove,
  className = "",
  onClick,
}: ChipProps) {
  const variantStyles: Record<ChipVariant, string> = {
    default:
      "bg-[#171a21] text-[#e8eaf0] border border-[rgba(255,255,255,0.08)]",
    accent:
      "bg-[rgba(124,140,255,0.12)] text-[#7c8cff] border border-[rgba(124,140,255,0.25)]",
    success:
      "bg-[rgba(62,207,142,0.12)] text-[#3ecf8e] border border-[rgba(62,207,142,0.25)]",
    warning:
      "bg-[rgba(245,165,36,0.12)] text-[#f5a524] border border-[rgba(245,165,36,0.25)]",
    danger:
      "bg-[rgba(239,91,91,0.12)] text-[#ef5b5b] border border-[rgba(239,91,91,0.25)]",
    muted:
      "bg-[rgba(255,255,255,0.04)] text-[#8b91a1] border border-[rgba(255,255,255,0.06)]",
  };

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium select-none ${sizeStyles} ${variantStyles[variant]} ${onClick ? "cursor-pointer hover:brightness-110" : ""} ${className}`}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="inline-flex items-center justify-center -mr-1 h-3.5 w-3.5 rounded-full hover:bg-[rgba(255,255,255,0.15)] text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
