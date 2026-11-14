"use client";

import React, { useState } from "react";
import type { Learner, SkillMapItem } from "@/lib/types";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import { MatchRing } from "./ui/MatchRing";
import { ProgressBar } from "./ui/ProgressBar";
import { GoalSwitcher } from "./GoalSwitcher";

export interface DashboardViewProps {
  learner: Learner;
  roleTitle: string;
  onGoalChange: (newRoleId: string) => Promise<void>;
  mentorMessage: string;
  mentorWeakTopics: string[];
  onMentorChat: (message: string) => Promise<void>;
  loading: boolean;
}

export function DashboardView({
  learner,
  roleTitle,
  onGoalChange,
  mentorMessage,
  mentorWeakTopics,
  onMentorChat,
  loading,
}: DashboardViewProps) {
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const completedMilestones = learner.roadmap.filter((m) => m.status === "done").length;
  const totalMilestones = learner.roadmap.length;
  const overallProgressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const handleAskMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim() || chatLoading) return;
    setChatLoading(true);
    try {
      await onMentorChat(chatPrompt.trim());
      setChatPrompt("");
    } finally {
      setChatLoading(false);
    }
  };

  // Sort gaps by gapSize desc, then importance desc
  const sortedGaps = [...learner.gaps].sort(
    (a, b) => b.gapSize - a.gapSize || b.importance - a.importance,
  );

  // Map skillMap items for quick lookup
  const skillMapLookup = new Map<string, SkillMapItem>(
    (learner.skillMap || []).map((s) => [s.name.toLowerCase(), s]),
  );

  return (
    <div className="space-y-6">
      {/* Hero Card: Match Ring + Goal Switcher + Overall Progress */}
      <Card variant="elevated" className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <MatchRing percent={learner.matchPercent || 0} size={110} strokeWidth={8} />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
                Target Career Path
              </span>
              <h1 className="text-2xl font-bold text-[#e8eaf0] tracking-tight mt-0.5">
                {roleTitle}
              </h1>
              <p className="text-sm text-[#8b91a1] mt-1 max-w-md">
                Based on your technical interview answers and background assessment.
              </p>
            </div>
          </div>

          <div className="w-full md:w-72 flex flex-col gap-3.5 bg-[#111318] p-4 rounded-xl border border-[rgba(255,255,255,0.06)]">
            <GoalSwitcher value={learner.goalRoleId} onChange={onGoalChange} disabled={loading} />
            <div className="pt-1">
              <div className="flex justify-between text-xs text-[#8b91a1] mb-1 font-medium">
                <span>Roadmap Progress</span>
                <span className="font-mono text-[#e8eaf0]">
                  {completedMilestones}/{totalMilestones} done ({overallProgressPercent}%)
                </span>
              </div>
              <ProgressBar value={overallProgressPercent} size="sm" />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Skills Readiness & Gaps (Left) + Mentor Guidance (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Skills Readiness & Priority Gaps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Gap Chips */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#e8eaf0]">Priority Skill Gaps</h2>
              <span className="text-xs text-[#8b91a1] font-mono">
                {sortedGaps.length} gaps identified
              </span>
            </div>

            {sortedGaps.length === 0 ? (
              <p className="text-sm text-[#8b91a1]">No critical skill gaps identified. Great match!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedGaps.map((gap) => (
                  <Chip
                    key={gap.skill}
                    variant={gap.gapSize >= 3 ? "danger" : gap.gapSize >= 2 ? "warning" : "default"}
                    size="md"
                  >
                    <span className="font-medium">{gap.skill}</span>
                    <span className="opacity-70 text-[11px] font-mono ml-1">
                      (gap: {gap.gapSize})
                    </span>
                  </Chip>
                ))}
              </div>
            )}
          </Card>

          {/* Skill Readiness Rows */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#e8eaf0]">Skills Assessment Breakdown</h2>
              <span className="text-xs text-[#8b91a1]">Current vs Required (0-5)</span>
            </div>

            {learner.gaps.length === 0 ? (
              <p className="text-sm text-[#8b91a1] py-4">No skills assessed yet. Run the interview to see your breakdown.</p>
            ) : (
              <div className="space-y-4 pt-1">
                {learner.gaps.map((gap) => {
                  const assessedItem = skillMapLookup.get(gap.skill.toLowerCase());
                  const isAssessed = gap.currentLevel > 0 || (assessedItem && assessedItem.evidence !== "Not assessed");
                  const currentPercent = (gap.currentLevel / 5) * 100;
                  const requiredPercent = (gap.requiredLevel / 5) * 100;

                  return (
                    <div
                      key={gap.skill}
                      className="p-3.5 rounded-lg bg-[#0b0c0f] border border-[rgba(255,255,255,0.06)] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#e8eaf0]">{gap.skill}</span>
                          {!isAssessed ? (
                            <Chip variant="muted" size="sm">
                              Not assessed
                            </Chip>
                          ) : assessedItem?.confidence ? (
                            <Chip
                              variant={
                                assessedItem.confidence === "high"
                                  ? "success"
                                  : assessedItem.confidence === "medium"
                                  ? "accent"
                                  : "muted"
                              }
                              size="sm"
                            >
                              {assessedItem.confidence} conf
                            </Chip>
                          ) : null}
                        </div>

                        <div className="text-xs font-mono text-[#8b91a1]">
                          <span className="text-[#e8eaf0] font-semibold">{gap.currentLevel}</span>
                          <span className="text-[#8b91a1]"> / 5</span>
                          <span className="text-[#7c8cff] ml-1.5 font-medium">
                            (need {gap.requiredLevel})
                          </span>
                        </div>
                      </div>

                      {/* Custom Horizontal Bar with Required Marker */}
                      <div className="relative h-2 w-full bg-[#171a21] rounded-full overflow-hidden border border-[rgba(255,255,255,0.04)]">
                        {/* Current Level Fill */}
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            gap.currentLevel >= gap.requiredLevel ? "bg-[#3ecf8e]" : "bg-[#7c8cff]"
                          }`}
                          style={{ width: `${currentPercent}%` }}
                        />
                        {/* Required Level Marker Line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-[#f5a524] z-10"
                          style={{ left: `${requiredPercent}%` }}
                          title={`Target: Level ${gap.requiredLevel}`}
                        />
                      </div>

                      {/* Evidence quote */}
                      {assessedItem?.evidence && assessedItem.evidence !== "Not assessed" && (
                        <p className="text-xs text-[#8b91a1] italic line-clamp-2">
                          &ldquo;{assessedItem.evidence}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 col): Mentor Guidance + Ask Mentor */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-[rgba(124,140,255,0.12)] text-[#7c8cff] flex items-center justify-center shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#e8eaf0]">Mentor Guidance</h2>
            </div>

            <p className="text-sm text-[#e8eaf0] leading-relaxed bg-[#0b0c0f] p-3.5 rounded-lg border border-[rgba(255,255,255,0.06)]">
              {mentorMessage}
            </p>

            {mentorWeakTopics.length > 0 && (
              <div>
                <span className="text-xs text-[#8b91a1] block mb-1.5 font-medium">Focus Topics:</span>
                <div className="flex flex-wrap gap-1.5">
                  {mentorWeakTopics.map((topic) => (
                    <Chip key={topic} variant="warning" size="sm">
                      {topic}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Ask Mentor Input */}
            <form onSubmit={handleAskMentor} className="pt-2 space-y-2 border-t border-[rgba(255,255,255,0.06)]">
              <label htmlFor="mentor-prompt" className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
                Ask Your Mentor
              </label>
              <textarea
                id="mentor-prompt"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Ask advice on next steps or how to tackle a specific topic..."
                rows={3}
                disabled={chatLoading}
                className="w-full rounded-lg bg-[#0b0c0f] border border-[rgba(255,255,255,0.08)] p-2.5 text-xs text-[#e8eaf0] placeholder-[#8b91a1] focus:border-[#7c8cff] focus:ring-1 focus:ring-[#7c8cff] outline-none resize-none transition-colors"
              />
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  type="submit"
                  disabled={chatLoading || !chatPrompt.trim()}
                  loading={chatLoading}
                >
                  Send Question
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
