"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgentActivityPanel } from "@/components/AgentActivityPanel";
import { DashboardView } from "@/components/DashboardView";
import { InterviewView } from "@/components/InterviewView";
import { ProfileForm } from "@/components/ProfileForm";
import { QuizView } from "@/components/QuizView";
import { RoadmapView } from "@/components/RoadmapView";
import { Card } from "@/components/ui/Card";
import { CardSkeleton, SkillRowSkeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { Stepper, type StepItem } from "@/components/ui/Stepper";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import resourcesData from "@/data/resources.json";
import rolesData from "@/data/roles.json";
import { SkillPathProvider, useSkillPath } from "@/lib/store";
import type { InterviewTurn, Learner, Milestone, Profile } from "@/lib/types";

type NavTab = "Profile" | "Interview" | "Dashboard" | "Roadmap" | "Assessment" | "Agents";

type HealthPayload = {
  mode?: string;
  providers?: Array<{ name: string; configured: boolean; cooldownUntil: number | null }>;
};

const demoProfile: Profile = {
  name: "Demo learner",
  education: "Computer Science student",
  claimedSkills: ["Python", "SQL", "HTML"],
  certifications: ["Data Fundamentals"],
  projects: ["Flask blog"],
};

const roles = rolesData as Array<{ id: string; title: string }>;

function MainApp() {
  const { learner, setLearner } = useSkillPath();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<NavTab>("Profile");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisStepText, setAnalysisStepText] = useState<string | null>(null);
  const [mentorMessage, setMentorMessage] = useState(
    "Welcome! Complete your technical interview to generate your personalized career readiness roadmap.",
  );
  const [mentorWeakTopics, setMentorWeakTopics] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(learner.roadmap[0] ?? null);
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{ id: string; question: string; options: string[]; answerIndex: number; explanation: string }>
  >([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [health, setHealth] = useState<HealthPayload | null | undefined>(undefined);
  const [confirmReset, setConfirmReset] = useState(false);

  // Request counter to cancel / ignore stale responses
  const requestIdRef = useRef(0);

  const resourceMap = useMemo(
    () =>
      Object.fromEntries(
        (resourcesData as Array<{ id: string; title: string; url: string; type?: string; hours?: number }>).map(
          (resource) => [
            resource.id,
            { title: resource.title, url: resource.url, type: resource.type, hours: resource.hours },
          ],
        ),
      ),
    [],
  );

  const currentRole = useMemo(
    () => roles.find((r) => r.id === learner.goalRoleId) ?? roles[0],
    [learner.goalRoleId],
  );

  // Health check on mount
  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HealthPayload | null) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const configuredProviders = health?.providers?.filter((p) => p.configured) ?? [];
  const isMock = health?.mode === "mock";
  const primaryProvider = isMock
    ? "mock"
    : configuredProviders.length > 0
    ? configuredProviders[0].name
    : "fallback";

  // Stepper state
  const hasProfile = Boolean(learner.profile?.name?.trim());
  const hasCompletedInterview = learner.interview?.status === "complete" || learner.roadmap.length > 0;
  const interviewTurns = learner.interview?.turns || [];

  const stepperSteps: StepItem[] = useMemo(
    () => [
      {
        id: "Profile",
        label: "Profile",
        completed: hasProfile,
      },
      {
        id: "Interview",
        label: "Interview",
        completed: hasCompletedInterview,
        locked: !hasProfile,
        lockedReason: "Enter profile details first",
      },
      {
        id: "Dashboard",
        label: "Results",
        completed: hasCompletedInterview && learner.roadmap.length > 0,
        locked: !hasCompletedInterview,
        lockedReason: "Complete interview first",
      },
    ],
    [hasProfile, hasCompletedInterview, learner.roadmap.length],
  );

  const currentStepId =
    activeTab === "Profile"
      ? "Profile"
      : activeTab === "Interview"
      ? "Interview"
      : "Dashboard";

  // Fetch helper with timeout
  const fetchJson = async (url: string, body: unknown, timeoutMs = 35000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error("Request timed out. Please retry.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  // 1. Start Interview Turn
  const startInterview = async () => {
    const curReq = ++requestIdRef.current;
    setLoading(true);
    setActiveAgent("Mentor");
    setActiveTab("Interview");

    try {
      const turns = learner.interview?.turns || [];
      if (turns.length === 0) {
        const data = await fetchJson("/api/interview/next", {
          profile: learner.profile,
          goalRoleId: learner.goalRoleId,
          turns: [],
        });
        if (curReq !== requestIdRef.current) return;

        const firstTurn: InterviewTurn = {
          id: `mentor-turn-${turns.length + 1}`,
          role: "mentor",
          text: data.message,
          targetSkill: data.targetSkill || undefined,
          at: new Date().toISOString(),
        };

        const updatedInterview = {
          turns: [firstTurn],
          status: "in_progress" as const,
        };

        const updatedLearner: Learner = {
          ...learner,
          interview: updatedInterview,
          agentLog: data.agentLog ? [data.agentLog, ...learner.agentLog] : learner.agentLog,
        };
        setLearner(updatedLearner);
      }
    } catch (err) {
      if (curReq !== requestIdRef.current) return;
      toast.error(
        "Interview initialization failed",
        err instanceof Error ? err.message : "Could not start interview.",
        () => startInterview(),
      );
    } finally {
      if (curReq === requestIdRef.current) {
        setLoading(false);
        setActiveAgent(null);
      }
    }
  };

  // 2. Send Learner Answer in Interview
  const handleSendInterviewAnswer = async (answerText: string) => {
    const curReq = ++requestIdRef.current;
    setLoading(true);
    setActiveAgent("Mentor");

    const turns = learner.interview?.turns || [];
    const learnerTurn: InterviewTurn = {
      id: `learner-turn-${turns.length + 1}`,
      role: "learner",
      text: answerText,
      at: new Date().toISOString(),
    };

    const newTurns = [...turns, learnerTurn];
    setLearner({
      ...learner,
      interview: { turns: newTurns, status: "in_progress" },
    });

    try {
      const data = await fetchJson("/api/interview/next", {
        profile: learner.profile,
        goalRoleId: learner.goalRoleId,
        turns: newTurns,
      });

      if (curReq !== requestIdRef.current) return;

      const mentorTurn: InterviewTurn = {
        id: `mentor-turn-${newTurns.length + 1}`,
        role: "mentor",
        text: data.message,
        targetSkill: data.targetSkill || undefined,
        at: new Date().toISOString(),
      };

      const finalTurns = [...newTurns, mentorTurn];

      if (data.done) {
        // Interview finished -> run full analysis automatically
        const nextLearner: Learner = {
          ...learner,
          interview: { turns: finalTurns, status: "complete" },
          agentLog: data.agentLog ? [data.agentLog, ...learner.agentLog] : learner.agentLog,
        };
        setLearner(nextLearner);
        await runAnalysis(nextLearner, finalTurns);
      } else {
        setLearner({
          ...learner,
          interview: { turns: finalTurns, status: "in_progress" },
          agentLog: data.agentLog ? [data.agentLog, ...learner.agentLog] : learner.agentLog,
        });
      }
    } catch (err) {
      if (curReq !== requestIdRef.current) return;
      toast.error(
        "Failed to generate next interview turn",
        err instanceof Error ? err.message : "Please try again.",
        () => handleSendInterviewAnswer(answerText),
      );
    } finally {
      if (curReq === requestIdRef.current) {
        setLoading(false);
        setActiveAgent(null);
      }
    }
  };

  // 3. Finish Early & Run Analysis
  const handleFinishEarly = async () => {
    const turns = learner.interview?.turns || [];
    await runAnalysis(learner, turns);
  };

  // Multi-step Analysis Progress Cycling
  const runAnalysis = async (currentLrn: Learner, turns: InterviewTurn[]) => {
    const curReq = ++requestIdRef.current;
    setLoading(true);
    setActiveAgent("Skill Analyst");
    setAnalysisStepText("Analyzing technical skill responses...");

    const cycleTimer1 = setTimeout(() => {
      if (curReq === requestIdRef.current) {
        setActiveAgent("Career Matcher");
        setAnalysisStepText("Matching capabilities to target role requirements...");
      }
    }, 1800);

    const cycleTimer2 = setTimeout(() => {
      if (curReq === requestIdRef.current) {
        setActiveAgent("Path Planner");
        setAnalysisStepText("Synthesizing learning roadmap milestones...");
      }
    }, 3600);

    try {
      const data = await fetchJson("/api/analyze", {
        profile: currentLrn.profile,
        goalRoleId: currentLrn.goalRoleId,
        turns,
      });

      if (curReq !== requestIdRef.current) return;

      const analyzed = data.learner as Learner;
      setLearner(analyzed);
      setSelectedMilestone(analyzed.roadmap[0] ?? null);
      setMentorMessage(
        "Analysis complete! Your personalized skill gaps and roadmap are ready. Focus on your highest priority gaps first.",
      );
      setMentorWeakTopics(analyzed.gaps.slice(0, 3).map((g) => g.skill));
      setActiveTab("Dashboard");
      toast.success("Roadmap ready", "Your skills have been analyzed and milestones planned.");
    } catch (err) {
      if (curReq !== requestIdRef.current) return;
      toast.error(
        "Skill analysis failed",
        err instanceof Error ? err.message : "Could not analyze profile.",
        () => runAnalysis(currentLrn, turns),
      );
    } finally {
      clearTimeout(cycleTimer1);
      clearTimeout(cycleTimer2);
      if (curReq === requestIdRef.current) {
        setLoading(false);
        setActiveAgent(null);
        setAnalysisStepText(null);
      }
    }
  };

  // 4. Load Demo Learner
  const handleLoadDemo = async () => {
    const nextLearner: Learner = {
      ...learner,
      profile: { ...demoProfile },
      goalRoleId: "full-stack-developer",
      interview: null,
      roadmap: [],
      gaps: [],
      scores: [],
    };
    setLearner(nextLearner);
    toast.info("Demo learner loaded", "Click 'Start Assessment Interview' to proceed.");
  };

  // 5. Goal Change
  const handleGoalChange = async (newRoleId: string) => {
    if (newRoleId === learner.goalRoleId) return;
    const curReq = ++requestIdRef.current;
    setLoading(true);
    setActiveAgent("Career Matcher");

    try {
      const data = await fetchJson("/api/change-goal", {
        learner,
        newRoleId,
      });
      if (curReq !== requestIdRef.current) return;

      const updated = data.learner as Learner;
      setLearner(updated);
      setSelectedMilestone(updated.roadmap[0] ?? null);
      setMentorMessage(
        "Your roadmap has been updated for your new goal role. Gaps have been re-prioritized.",
      );
      setMentorWeakTopics(updated.gaps.slice(0, 3).map((g) => g.skill));
      toast.success("Goal role updated", `Roadmap recalculated for ${roles.find((r) => r.id === newRoleId)?.title}.`);
    } catch (err) {
      if (curReq !== requestIdRef.current) return;
      toast.error(
        "Goal change failed",
        err instanceof Error ? err.message : "Failed to change goal.",
        () => handleGoalChange(newRoleId),
      );
    } finally {
      if (curReq === requestIdRef.current) {
        setLoading(false);
        setActiveAgent(null);
      }
    }
  };

  // 6. Start Quiz for Milestone
  const handleStartQuiz = async (milestone: Milestone) => {
    const curReq = ++requestIdRef.current;
    setLoading(true);
    setActiveAgent("Assessor");
    setSelectedMilestone(milestone);
    setActiveTab("Assessment");

    try {
      const data = await fetchJson("/api/quiz", { milestone });
      if (curReq !== requestIdRef.current) return;

      const questions = data.questions ?? [];
      setQuizQuestions(questions);
      setAnswers(Array(questions.length).fill(undefined as unknown as number));
    } catch (err) {
      if (curReq !== requestIdRef.current) return;
      toast.error(
        "Failed to load quiz",
        err instanceof Error ? err.message : "Could not generate assessment.",
        () => handleStartQuiz(milestone),
      );
    } finally {
      if (curReq === requestIdRef.current) {
        setLoading(false);
        setActiveAgent(null);
      }
    }
  };

  // 7. Submit Assessment
  const handleSubmitAssessment = async (customAnswers?: number[]) => {
    if (!selectedMilestone) return;
    const curReq = ++requestIdRef.current;
    const payloadAnswers = customAnswers ?? answers;
    setLoading(true);
    setActiveAgent("Mentor");

    try {
      const data = await fetchJson("/api/submit", {
        learner,
        milestoneId: selectedMilestone.id,
        questions: quizQuestions,
        answers: payloadAnswers,
      });
      if (curReq !== requestIdRef.current) return;

      const updatedLearner = data.learner as Learner;
      setLearner(updatedLearner);
      setMentorMessage(data.mentor.message);
      setMentorWeakTopics(data.mentor.weakTopics ?? []);

      const nextSelected =
        updatedLearner.roadmap.find((m) => m.id === selectedMilestone.id) ??
        updatedLearner.roadmap[0] ??
        null;
      setSelectedMilestone(nextSelected);

      if (data.mentor.action === "remediate") {
        toast.info("Remediation milestone added", "Review focused practice before advancing.");
      } else {
        toast.success("Assessment complete", "Milestone marked as completed!");
      }
    } catch (err) {
      if (curReq !== requestIdRef.current) return;
      toast.error(
        "Assessment submission failed",
        err instanceof Error ? err.message : "Failed to submit assessment.",
        () => handleSubmitAssessment(customAnswers),
      );
    } finally {
      if (curReq === requestIdRef.current) {
        setLoading(false);
        setActiveAgent(null);
      }
    }
  };

  // 8. Mentor Chat
  const handleMentorChat = async (promptText: string) => {
    const curReq = ++requestIdRef.current;
    setActiveAgent("Mentor");

    try {
      const data = await fetchJson("/api/mentor", {
        learner,
        message: promptText,
      });
      if (curReq !== requestIdRef.current) return;
      setMentorMessage(data.reply);
      toast.success("Mentor responded", "New guidance available.");
    } catch (err) {
      if (curReq !== requestIdRef.current) return;
      toast.error("Mentor chat failed", err instanceof Error ? err.message : "Failed to fetch response.");
    } finally {
      if (curReq === requestIdRef.current) {
        setActiveAgent(null);
      }
    }
  };

  // Reset Demo Action
  const handleResetDemo = () => {
    try {
      window.localStorage.removeItem("skillpath_learner_v1");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0c0f] text-[#e8eaf0] overflow-hidden">
      {/* Slim Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-[rgba(255,255,255,0.08)] bg-[#0b0c0f] p-4 select-none">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-[#7c8cff] text-[#0b0c0f] flex items-center justify-center font-bold text-sm shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-[#e8eaf0]">
              SkillPath AI
            </span>
            <span className="block text-[10px] text-[#8b91a1] -mt-0.5 font-mono">
              Career Coach
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1" aria-label="Main Navigation">
          {[
            {
              id: "Profile" as NavTab,
              label: "Profile",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              ),
            },
            {
              id: "Interview" as NavTab,
              label: "Interview",
              badge: interviewTurns.length > 0 ? `${interviewTurns.filter((t) => t.role === "learner").length}` : undefined,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              ),
            },
            {
              id: "Dashboard" as NavTab,
              label: "Dashboard",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 11a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" />
              ),
            },
            {
              id: "Roadmap" as NavTab,
              label: "Roadmap",
              badge: learner.roadmap.length > 0 ? `${learner.roadmap.length}` : undefined,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              ),
            },
            {
              id: "Assessment" as NavTab,
              label: "Assessment",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              ),
            },
            {
              id: "Agents" as NavTab,
              label: "Agents",
              badge: activeAgent ? "Live" : undefined,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              ),
            },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[rgba(124,140,255,0.12)] text-[#7c8cff]"
                    : "text-[#8b91a1] hover:text-[#e8eaf0] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon}
                  </svg>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      item.badge === "Live"
                        ? "bg-[#7c8cff] text-[#0b0c0f] font-semibold animate-pulse"
                        : "bg-[rgba(255,255,255,0.06)] text-[#8b91a1]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Area: Reset Demo Button */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.08)]">
          {confirmReset ? (
            <div className="space-y-2 p-2 bg-[#171a21] rounded-lg border border-[rgba(239,91,91,0.25)]">
              <p className="text-xs text-[#ef5b5b] font-medium">Reset all progress?</p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="flex-1 py-1 text-xs bg-[#ef5b5b] text-white rounded font-medium"
                >
                  Yes, reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-1 text-xs bg-[#111318] text-[#8b91a1] rounded hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full text-left text-xs text-[#8b91a1] hover:text-[#e8eaf0] px-3 py-1.5 rounded transition-colors"
            >
              Reset demo data
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle Ambient Header Glow */}
        <div className="ambient-glow absolute top-0 left-0 right-0 h-48 pointer-events-none" />

        {/* Top Bar */}
        <header className="h-14 shrink-0 border-b border-[rgba(255,255,255,0.08)] bg-[#0b0c0f]/80 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-semibold text-[#e8eaf0] truncate">
              {learner.profile?.name || "New Learner"}
            </span>
            <span className="text-xs text-[#8b91a1] hidden sm:inline">•</span>
            <span className="text-xs text-[#8b91a1] hidden sm:inline truncate">
              {currentRole.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StatusPill
              variant={isMock ? "mock" : "live"}
              provider={primaryProvider}
            />
          </div>
        </header>

        {/* Guided Flow Stepper (Visible during onboarding) */}
        {learner.roadmap.length === 0 && (
          <div className="border-b border-[rgba(255,255,255,0.06)] bg-[#0b0c0f] px-4 py-3 shrink-0">
            <Stepper
              steps={stepperSteps}
              currentStepId={currentStepId}
              onSelectStep={(stepId) => setActiveTab(stepId as NavTab)}
            />
          </div>
        )}

        {/* Scrollable Screen Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1100px] mx-auto pb-16 md:pb-6">
            {/* Multi-step LLM Loading Banner with Skeleton */}
            {loading && analysisStepText && (
              <div className="mb-6 space-y-4 animate-enter">
                <Card className="p-4 bg-[rgba(124,140,255,0.08)] border-[#7c8cff]/30 flex items-center gap-3.5">
                  <div className="h-5 w-5 rounded-full border-2 border-[#7c8cff] border-t-transparent animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#e8eaf0]">{analysisStepText}</p>
                    <p className="text-xs text-[#8b91a1] mt-0.5">
                      Synthesizing evidence, validating milestones, and structuring roadmap.
                    </p>
                  </div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              </div>
            )}

            {/* General Skeleton on LLM wait without analysis text */}
            {loading && !analysisStepText && activeTab === "Roadmap" && (
              <div className="space-y-4 mb-6">
                <SkillRowSkeleton />
                <SkillRowSkeleton />
              </div>
            )}

            {/* Screen 1: Profile */}
            {activeTab === "Profile" && (
              <ProfileForm
                profile={learner.profile}
                roleId={learner.goalRoleId}
                onChange={(p) => setLearner({ ...learner, profile: p })}
                onRoleChange={(r) => setLearner({ ...learner, goalRoleId: r })}
                onStartInterview={startInterview}
                onAnalyze={startInterview}
                onLoadDemo={handleLoadDemo}
                loading={loading}
              />
            )}

            {/* Screen 2: Interview */}
            {activeTab === "Interview" && (
              <InterviewView
                turns={interviewTurns}
                goalRoleTitle={currentRole.title}
                onSendAnswer={handleSendInterviewAnswer}
                onFinishEarly={handleFinishEarly}
                loading={loading}
                done={learner.interview?.status === "complete"}
                currentQuestionNumber={interviewTurns.filter((t) => t.role === "learner").length + 1}
                totalPlanned={6}
              />
            )}

            {/* Screen 3: Dashboard */}
            {activeTab === "Dashboard" && (
              <DashboardView
                learner={learner}
                roleTitle={currentRole.title}
                onGoalChange={handleGoalChange}
                mentorMessage={mentorMessage}
                mentorWeakTopics={mentorWeakTopics}
                onMentorChat={handleMentorChat}
                loading={loading}
              />
            )}

            {/* Screen 4: Roadmap */}
            {activeTab === "Roadmap" && (
              <RoadmapView
                roadmap={learner.roadmap}
                resourceMap={resourceMap}
                onStartAssessment={handleStartQuiz}
                loading={loading}
              />
            )}

            {/* Screen 5: Assessment */}
            {activeTab === "Assessment" && (
              <QuizView
                questions={quizQuestions}
                answers={answers}
                onAnswer={(qIdx, optIdx) => {
                  const next = [...answers];
                  next[qIdx] = optIdx;
                  setAnswers(next);
                }}
                onSubmit={handleSubmitAssessment}
                onSimulateLowScore={() => {
                  if (quizQuestions.length === 0) return;
                  const simulated = quizQuestions.map((q) => (q.answerIndex === 0 ? 1 : 0));
                  setAnswers(simulated);
                  handleSubmitAssessment(simulated);
                }}
                loading={loading}
                onReturnToRoadmap={() => setActiveTab("Roadmap")}
              />
            )}

            {/* Screen 6: Agent Activity */}
            {activeTab === "Agents" && (
              <AgentActivityPanel logs={learner.agentLog} activeAgent={activeAgent} />
            )}
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0b0c0f]/95 backdrop-blur border-t border-[rgba(255,255,255,0.08)] px-2 flex items-center justify-around z-40 select-none"
          aria-label="Mobile Navigation"
        >
          {[
            {
              id: "Profile" as NavTab,
              label: "Profile",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              ),
            },
            {
              id: "Interview" as NavTab,
              label: "Chat",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              ),
            },
            {
              id: "Dashboard" as NavTab,
              label: "Stats",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 11a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" />
              ),
            },
            {
              id: "Roadmap" as NavTab,
              label: "Path",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              ),
            },
            {
              id: "Assessment" as NavTab,
              label: "Quiz",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              ),
            },
            {
              id: "Agents" as NavTab,
              label: "Log",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              ),
            },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? "text-[#7c8cff]" : "text-[#8b91a1]"
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.icon}
                </svg>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <SkillPathProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </SkillPathProvider>
  );
}
