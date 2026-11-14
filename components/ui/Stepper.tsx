import React from "react";

export interface StepItem {
  id: string;
  label: string;
  description?: string;
  completed?: boolean;
  active?: boolean;
  locked?: boolean;
  lockedReason?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStepId: string;
  onSelectStep?: (id: string) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStepId,
  onSelectStep,
  className = "",
}: StepperProps) {
  return (
    <nav aria-label="Progress" className={`w-full ${className}`}>
      <ol className="flex items-center justify-between gap-2 max-w-xl mx-auto">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = step.completed && !isCurrent;
          const isLocked = step.locked && !isCompleted && !isCurrent;
          const isClickable = !isLocked && onSelectStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <li className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => isClickable && onSelectStep(step.id)}
                  disabled={isLocked || !onSelectStep}
                  title={isLocked ? step.lockedReason : undefined}
                  className={`w-full group flex flex-col items-center text-center focus-visible:outline-none ${
                    isClickable ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-[#7c8cff] text-[#0b0c0f] ring-4 ring-[rgba(124,140,255,0.2)]"
                          : isCompleted
                          ? "bg-[#3ecf8e] text-[#0b0c0f]"
                          : isLocked
                          ? "bg-[#171a21] text-[#8b91a1] border border-[rgba(255,255,255,0.06)] opacity-60"
                          : "bg-[#171a21] text-[#e8eaf0] border border-[rgba(255,255,255,0.12)]"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap hidden sm:inline ${
                        isCurrent
                          ? "text-[#e8eaf0]"
                          : isCompleted
                          ? "text-[#8b91a1]"
                          : isLocked
                          ? "text-[#8b91a1] opacity-50"
                          : "text-[#8b91a1] group-hover:text-[#e8eaf0]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Subtext on mobile or lock reason */}
                  {isLocked && step.lockedReason && (
                    <span className="text-[10px] text-[#8b91a1] opacity-70 hidden md:block">
                      {step.lockedReason}
                    </span>
                  )}
                </button>
              </li>

              {/* Connecting line between steps */}
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-10 sm:w-16 shrink-0 transition-colors ${
                    step.completed
                      ? "bg-[#3ecf8e]"
                      : "bg-[rgba(255,255,255,0.08)]"
                  }`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
