"use client";

import React, { useState, useEffect, useRef, type KeyboardEvent } from "react";
import type { InterviewTurn } from "@/lib/types";
import { demoInterviewAnswers } from "@/lib/fallbacks";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ChatBubble } from "./ui/ChatBubble";
import { ProgressBar } from "./ui/ProgressBar";

export interface InterviewViewProps {
  turns: InterviewTurn[];
  goalRoleTitle: string;
  onSendAnswer: (answer: string) => Promise<void>;
  onFinishEarly: () => Promise<void>;
  loading: boolean;
  done: boolean;
  currentQuestionNumber?: number;
  totalPlanned?: number;
}

export function InterviewView({
  turns,
  goalRoleTitle,
  onSendAnswer,
  onFinishEarly,
  loading,
  done,
  currentQuestionNumber,
  totalPlanned = 6,
}: InterviewViewProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length, loading]);

  // Auto-grow textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading || done) return;
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSendAnswer(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Demo answer helper index
  const answeredCount = turns.filter((t) => t.role === "learner").length;
  const demoAnswer = demoInterviewAnswers[answeredCount % demoInterviewAnswers.length];

  const handleFillDemoAnswer = () => {
    setInputValue(demoAnswer);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const safeQuestionNumber = Math.min(currentQuestionNumber ?? answeredCount + 1, totalPlanned);

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Top Header Card */}
      <Card className="p-4 mb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3ecf8e]" />
              <h1 className="text-base font-semibold text-[#e8eaf0]">
                Technical Skills Interview
              </h1>
            </div>
            <p className="text-xs text-[#8b91a1] mt-0.5">
              Assessing readiness for <span className="text-[#e8eaf0] font-medium">{goalRoleTitle}</span>
            </p>
          </div>

          <div className="w-full sm:w-56 flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-[#8b91a1]">
              <span>Progress</span>
              <span className="font-mono text-[#e8eaf0]">
                {done ? "Complete" : `Question ${safeQuestionNumber} of ~${totalPlanned}`}
              </span>
            </div>
            <ProgressBar
              value={done ? totalPlanned : safeQuestionNumber}
              max={totalPlanned}
              size="sm"
            />
          </div>
        </div>
      </Card>

      {/* Messages Scroll Container */}
      <Card className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 mb-4">
        {turns.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8b91a1]">
            <p className="text-sm">Initializing interview conversation...</p>
          </div>
        )}

        <div className="space-y-4" aria-live="polite">
          {turns.map((turn) => {
            const date = new Date(turn.at);
            const formattedTime = !Number.isNaN(date.getTime())
              ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : undefined;

            return (
              <ChatBubble
                key={turn.id}
                role={turn.role}
                text={turn.text}
                targetSkill={turn.targetSkill}
                time={formattedTime}
              />
            );
          })}

          {loading && (
            <ChatBubble role="mentor" text="" isTyping />
          )}

          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Bottom Action / Input Area */}
      {done ? (
        <Card className="p-4 shrink-0 bg-[#171a21] border-[#7c8cff]/30 text-center space-y-3">
          <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[rgba(62,207,142,0.15)] text-[#3ecf8e] mx-auto">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#e8eaf0]">Interview Complete</h3>
            <p className="text-xs text-[#8b91a1] mt-1">
              Your answers have been analyzed by our AI agents to build your tailored roadmap.
            </p>
          </div>
        </Card>
      ) : (
        <div className="shrink-0 space-y-2">
          {/* Quick Shortcuts */}
          <div className="flex items-center justify-between text-xs px-1">
            <button
              type="button"
              onClick={handleFillDemoAnswer}
              disabled={loading}
              className="text-[#8b91a1] hover:text-[#7c8cff] transition-colors flex items-center gap-1 font-medium"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fill demo answer
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onFinishEarly}
              disabled={loading || turns.length < 2}
              className="text-xs text-[#8b91a1] hover:text-[#e8eaf0] h-6 px-2"
            >
              Finish early →
            </Button>
          </div>

          {/* Input Box */}
          <div className="relative rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] focus-within:border-[#7c8cff] focus-within:ring-1 focus-within:ring-[#7c8cff] transition-all p-2 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              rows={1}
              className="flex-1 bg-transparent text-sm text-[#e8eaf0] placeholder-[#8b91a1] outline-none resize-none px-2 py-1 max-h-40 leading-relaxed"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              disabled={loading || !inputValue.trim()}
              loading={loading}
              className="shrink-0 h-9 w-9 p-0 rounded-lg"
              aria-label="Send answer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
