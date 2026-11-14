import React from "react";
import { Chip } from "./Chip";

export interface ChatBubbleProps {
  role: "mentor" | "learner";
  text: string;
  targetSkill?: string;
  time?: string;
  isTyping?: boolean;
}

export function ChatBubble({
  role,
  text,
  targetSkill,
  time,
  isTyping = false,
}: ChatBubbleProps) {
  const isMentor = role === "mentor";

  return (
    <div
      className={`flex items-start gap-3 animate-enter ${
        isMentor ? "justify-start" : "justify-end flex-row-reverse"
      }`}
    >
      {/* Avatar */}
      {isMentor ? (
        <div
          className="h-8 w-8 rounded-lg bg-[rgba(124,140,255,0.15)] border border-[rgba(124,140,255,0.3)] text-[#7c8cff] flex items-center justify-center shrink-0 mt-0.5 select-none"
          title="Mentor"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
      ) : (
        <div
          className="h-8 w-8 rounded-lg bg-[#171a21] border border-[rgba(255,255,255,0.1)] text-[#e8eaf0] flex items-center justify-center shrink-0 mt-0.5 select-none text-xs font-semibold"
          title="You"
        >
          YOU
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
          isMentor ? "items-start" : "items-end"
        }`}
      >
        {/* Meta Header */}
        {(targetSkill || time) && (
          <div className="flex items-center gap-2 mb-1 px-1">
            {targetSkill && (
              <Chip variant="accent" size="sm">
                {targetSkill}
              </Chip>
            )}
            {time && <span className="text-[11px] text-[#8b91a1] font-mono">{time}</span>}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isMentor
              ? "bg-[#111318] border border-[rgba(255,255,255,0.08)] text-[#e8eaf0] rounded-tl-sm"
              : "bg-[#7c8cff] text-[#0b0c0f] font-medium rounded-tr-sm shadow-sm"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1 px-1 text-[#8b91a1]">
              <span className="h-2 w-2 rounded-full bg-current dot-1" />
              <span className="h-2 w-2 rounded-full bg-current dot-2" />
              <span className="h-2 w-2 rounded-full bg-current dot-3" />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
