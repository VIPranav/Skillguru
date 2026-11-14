import React, { type ReactNode } from "react";

export interface TimelineItemProps {
  icon?: ReactNode;
  active?: boolean;
  completed?: boolean;
  isLast?: boolean;
  children: ReactNode;
  className?: string;
}

export function TimelineItem({
  icon,
  active = false,
  completed = false,
  isLast = false,
  children,
  className = "",
}: TimelineItemProps) {
  const nodeColor = completed
    ? "bg-[#3ecf8e] text-[#0b0c0f]"
    : active
    ? "bg-[#7c8cff] text-[#0b0c0f] ring-4 ring-[rgba(124,140,255,0.2)]"
    : "bg-[#171a21] text-[#8b91a1] border border-[rgba(255,255,255,0.12)]";

  return (
    <div className={`relative flex gap-4 ${className}`}>
      {/* Node column */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 z-10 transition-colors ${nodeColor}`}
        >
          {icon ?? (
            completed ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="h-2 w-2 rounded-full bg-current" />
            )
          )}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-[rgba(255,255,255,0.08)] my-1 min-h-[32px]" />
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 pb-6 min-w-0">{children}</div>
    </div>
  );
}

export function Timeline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col ${className}`}>{children}</div>;
}
