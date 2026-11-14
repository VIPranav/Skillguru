"use client";

import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { StatusPill } from "./ui/StatusPill";

export interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizViewProps {
  questions: Question[];
  answers: number[];
  onAnswer: (index: number, optionIndex: number) => void;
  onSubmit: (customAnswers?: number[]) => Promise<void>;
  onSimulateLowScore: () => void;
  loading: boolean;
  onReturnToRoadmap?: () => void;
}

export function QuizView({
  questions,
  answers,
  onAnswer,
  onSubmit,
  onSimulateLowScore,
  loading,
  onReturnToRoadmap,
}: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx];
  const selectedAnswer = answers[currentIdx];

  const handleSelectOption = (optionIndex: number) => {
    if (showExplanation || loading) return;
    onAnswer(currentIdx, optionIndex);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      onSubmit();
    }
  };

  const calculateScore = () => {
    return questions.reduce((sum, q, idx) => {
      return sum + (answers[idx] === q.answerIndex ? 1 : 0);
    }, 0);
  };

  const score = calculateScore();
  const scorePercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = scorePercent >= 60;

  if (totalQuestions === 0) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center text-[#8b91a1] space-y-4">
        <div className="h-10 w-10 rounded-full bg-[rgba(255,255,255,0.05)] text-[#8b91a1] flex items-center justify-center mx-auto">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#e8eaf0]">No Assessment Active</h2>
        <p className="text-sm">Select an active milestone from your roadmap to start a skill assessment.</p>
        {onReturnToRoadmap && (
          <Button variant="secondary" size="sm" onClick={onReturnToRoadmap}>
            View Roadmap →
          </Button>
        )}
      </Card>
    );
  }

  // Result Screen after completing all questions
  if (isCompleted && !loading) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-enter">
        <Card variant="elevated" className="p-6 text-center space-y-5">
          <div
            className={`h-14 w-14 rounded-full flex items-center justify-center mx-auto ${
              passed
                ? "bg-[rgba(62,207,142,0.15)] text-[#3ecf8e]"
                : "bg-[rgba(245,165,36,0.15)] text-[#f5a524]"
            }`}
          >
            {passed ? (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
              Assessment Result
            </span>
            <h2 className="text-3xl font-bold font-mono text-[#e8eaf0] tracking-tight mt-1">
              {score} / {totalQuestions} ({scorePercent}%)
            </h2>
            <p className="text-sm text-[#8b91a1] mt-1.5">
              {passed
                ? "Great job! You have demonstrated readiness for this milestone."
                : "Remediation milestone added to your roadmap to strengthen weak concepts."}
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            {onReturnToRoadmap && (
              <Button variant="primary" size="md" onClick={onReturnToRoadmap}>
                View Updated Roadmap →
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Question Screen (One question at a time)
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header & Demo Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusPill variant="in_progress" label={`Question ${currentIdx + 1} of ${totalQuestions}`} />
        </div>
        <button
          type="button"
          onClick={onSimulateLowScore}
          disabled={loading}
          className="text-xs text-[#8b91a1] hover:text-[#f5a524] transition-colors py-1 px-2 rounded border border-[rgba(255,255,255,0.06)] hover:border-[rgba(245,165,36,0.3)] bg-[#111318]"
          title="Demo: simulate failing the assessment to trigger remediation workflow"
        >
          ⚡ Simulate low score (demo)
        </button>
      </div>

      <ProgressBar value={currentIdx + 1} max={totalQuestions} size="sm" />

      {/* Main Question Card */}
      <Card variant="elevated" className="p-6 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
            Question {currentIdx + 1}
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-[#e8eaf0] mt-1.5 leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        {/* 4 Large Selectable Option Cards */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, optIdx) => {
            const isSelected = selectedAnswer === optIdx;
            const isCorrect = optIdx === currentQuestion.answerIndex;

            let cardStyles = "border-[rgba(255,255,255,0.08)] bg-[#0b0c0f] hover:border-[rgba(255,255,255,0.18)]";
            let badgeStyles = "bg-[#171a21] text-[#8b91a1]";

            if (showExplanation) {
              if (isCorrect) {
                cardStyles = "border-[#3ecf8e] bg-[rgba(62,207,142,0.08)] text-[#3ecf8e]";
                badgeStyles = "bg-[#3ecf8e] text-[#0b0c0f]";
              } else if (isSelected) {
                cardStyles = "border-[#ef5b5b] bg-[rgba(239,91,91,0.08)] text-[#ef5b5b]";
                badgeStyles = "bg-[#ef5b5b] text-[#0b0c0f]";
              } else {
                cardStyles = "border-[rgba(255,255,255,0.04)] bg-[#0b0c0f] opacity-50";
              }
            } else if (isSelected) {
              cardStyles = "border-[#7c8cff] bg-[rgba(124,140,255,0.08)]";
              badgeStyles = "bg-[#7c8cff] text-[#0b0c0f]";
            }

            return (
              <div
                key={`${currentQuestion.id}-${optIdx}`}
                onClick={() => handleSelectOption(optIdx)}
                className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${cardStyles}`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectOption(optIdx);
                  }
                }}
              >
                <span
                  className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-colors ${badgeStyles}`}
                >
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="text-sm font-medium flex-1 text-[#e8eaf0]">{option}</span>
              </div>
            );
          })}
        </div>

        {/* Instant Explanation Sliding In */}
        {showExplanation && (
          <div className="p-4 rounded-xl bg-[#171a21] border border-[rgba(255,255,255,0.08)] space-y-2 animate-enter">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  selectedAnswer === currentQuestion.answerIndex ? "text-[#3ecf8e]" : "text-[#ef5b5b]"
                }`}
              >
                {selectedAnswer === currentQuestion.answerIndex ? "✓ Correct!" : "✗ Incorrect"}
              </span>
            </div>
            <p className="text-sm text-[#8b91a1] leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next / Submit Button */}
        {showExplanation && (
          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="md" onClick={handleNext} loading={loading}>
              {currentIdx < totalQuestions - 1 ? "Next Question →" : "Finish & Submit →"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
