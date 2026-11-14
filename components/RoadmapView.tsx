"use client";

import React, { useState } from "react";
import type { Milestone } from "@/lib/types";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import { StatusPill } from "./ui/StatusPill";
import { Timeline, TimelineItem } from "./ui/Timeline";

export interface RoadmapViewProps {
  roadmap: Milestone[];
  resourceMap: Record<string, { title: string; url: string; type?: string; hours?: number }>;
  onStartAssessment: (milestone: Milestone) => void;
  loading?: boolean;
}

export function RoadmapView({
  roadmap,
  resourceMap,
  onStartAssessment,
  loading = false,
}: RoadmapViewProps) {
  // Track which completed milestones are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = roadmap.filter((m) => m.status === "done").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8eaf0]">Personalized Roadmap</h1>
          <p className="text-sm text-[#8b91a1] mt-1">
            Sequential milestones engineered by Path Planner to close your target role gaps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill variant="in_progress" label={`${completedCount}/${roadmap.length} Milestones`} />
        </div>
      </div>

      {roadmap.length === 0 ? (
        <Card className="p-8 text-center text-[#8b91a1] space-y-3">
          <p className="text-sm">No roadmap generated yet. Complete the interview to generate your personalized path.</p>
        </Card>
      ) : (
        <Timeline>
          {roadmap.map((milestone, index) => {
            const isCompleted = milestone.status === "done";
            const isActive = milestone.status === "in_progress" || (index === 0 && milestone.status === "todo");
            const isRemediation = milestone.status === "remediation";
            const isExpanded = !isCompleted || expandedIds.has(milestone.id);
            const isLast = index === roadmap.length - 1;

            return (
              <TimelineItem
                key={milestone.id}
                completed={isCompleted}
                active={isActive}
                isLast={isLast}
              >
                <Card
                  variant={isActive ? "elevated" : "surface"}
                  className={`p-5 transition-all ${
                    isActive
                      ? "border-[#7c8cff]/40 shadow-sm"
                      : isRemediation
                      ? "border-[#f5a524]/40"
                      : ""
                  }`}
                >
                  {/* Milestone Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Chip variant="accent" size="sm">
                          {milestone.skill}
                        </Chip>
                        <span className="text-xs text-[#8b91a1] font-mono">
                          ~{milestone.estHours}h
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[#e8eaf0] mt-1.5">
                        {milestone.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill variant={milestone.status} />
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(milestone.id)}
                          className="text-xs text-[#8b91a1] hover:text-[#e8eaf0] p-1 transition-colors"
                          aria-label={isExpanded ? "Collapse milestone" : "Expand milestone"}
                        >
                          {isExpanded ? "Hide details ▲" : "Show details ▼"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Body */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-4 animate-enter">
                      {/* Exercise Description */}
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
                          Hands-on Project & Exercise
                        </span>
                        <p className="text-sm text-[#e8eaf0] mt-1 leading-relaxed">
                          {milestone.exercise}
                        </p>
                      </div>

                      {/* Curated Resources */}
                      {milestone.resourceIds.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b91a1]">
                            Recommended Resources
                          </span>
                          <div className="space-y-1.5">
                            {milestone.resourceIds.map((resId) => {
                              const res = resourceMap[resId];
                              if (!res) return null;
                              return (
                                <a
                                  key={resId}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex items-center justify-between p-2.5 rounded-lg bg-[#0b0c0f] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.16)] transition-all text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Chip variant="default" size="sm">
                                      {res.type || "guide"}
                                    </Chip>
                                    <span className="text-[#e8eaf0] group-hover:text-[#7c8cff] font-medium truncate transition-colors">
                                      {res.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[#8b91a1] shrink-0 ml-2">
                                    {res.hours && <span className="font-mono">{res.hours}h</span>}
                                    <svg
                                      className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Button: Start assessment for active/unlocked milestones */}
                      {(!isCompleted || isRemediation) && (
                        <div className="pt-2 flex justify-end">
                          <Button
                            variant={isRemediation ? "secondary" : "primary"}
                            size="md"
                            onClick={() => onStartAssessment(milestone)}
                            disabled={loading}
                          >
                            {isRemediation ? "Retake Assessment →" : "Start Assessment Quiz →"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </div>
  );
}
