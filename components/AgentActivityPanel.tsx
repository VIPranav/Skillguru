"use client";

import React, { useEffect, useRef } from "react";
import type { AgentLogEntry } from "@/lib/types";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import { Timeline, TimelineItem } from "./ui/Timeline";

export interface AgentActivityPanelProps {
  logs: AgentLogEntry[];
  activeAgent: string | null;
}

const agentChipStyles: Record<string, "accent" | "success" | "warning" | "danger" | "default"> = {
  "Skill Analyst": "accent",
  "Career Matcher": "default",
  "Path Planner": "warning",
  Assessor: "danger",
  Mentor: "success",
};

function formatDuration(durationMs: number) {
  return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)}s` : `${durationMs}ms`;
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], { hour12: false });
}

export function AgentActivityPanel({ logs, activeAgent }: AgentActivityPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length, activeAgent]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8eaf0]">Agent Activity Log</h1>
          <p className="text-sm text-[#8b91a1] mt-1">
            Real-time audit trail of multi-agent LLM reasoning, validations, and tool executions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip variant="default" size="sm">
            <span className="font-mono">{logs.length} entries</span>
          </Chip>
        </div>
      </div>

      {/* Live Agent Working Row */}
      {activeAgent && (
        <Card className="p-4 bg-[rgba(124,140,255,0.06)] border-[#7c8cff]/30 animate-pulse-slow flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7c8cff] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7c8cff]" />
          </span>
          <span className="text-sm font-medium text-[#e8eaf0]">
            Agent <span className="text-[#7c8cff] font-semibold">{activeAgent}</span> is working...
          </span>
        </Card>
      )}

      {/* Log Feed */}
      <Card className="p-5">
        <div
          ref={scrollRef}
          className="max-h-[520px] overflow-y-auto pr-1"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {logs.length === 0 ? (
            <p className="text-sm text-[#8b91a1] text-center py-8">
              No agent operations recorded yet. Start an interview or analysis to view live activity.
            </p>
          ) : (
            <Timeline>
              {logs.map((log, index) => {
                const isLast = index === logs.length - 1;
                const isMock = !log.provider || log.provider === "mock" || log.provider === "fallback";

                return (
                  <TimelineItem key={log.id} isLast={isLast}>
                    <div className="rounded-lg bg-[#0b0c0f] border border-[rgba(255,255,255,0.06)] p-3.5 space-y-1.5 hover:border-[rgba(255,255,255,0.12)] transition-colors">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Chip variant={agentChipStyles[log.agent] ?? "default"} size="sm">
                            {log.agent}
                          </Chip>
                          <span className="text-xs font-mono text-[#8b91a1]">
                            {log.action}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                              isMock
                                ? "bg-[rgba(255,255,255,0.05)] text-[#8b91a1] border border-[rgba(255,255,255,0.08)]"
                                : "bg-[rgba(124,140,255,0.1)] text-[#7c8cff] border border-[rgba(124,140,255,0.2)]"
                            }`}
                          >
                            {log.provider || "mock"}
                          </span>
                          <span className="text-xs font-mono text-[#8b91a1]">
                            {formatDuration(log.durationMs)}
                          </span>
                          <span className="text-xs font-mono text-[#8b91a1] opacity-60">
                            {formatTime(log.at)}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[#e8eaf0] leading-snug">
                        {log.summary}
                      </p>
                    </div>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </div>
      </Card>
    </div>
  );
}
