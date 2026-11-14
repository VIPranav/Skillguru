"use client";

import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { Learner } from "@/lib/types";

const STORAGE_KEY = "skillpath_learner_v1";

const emptyProfile = {
  name: "",
  education: "",
  claimedSkills: [],
  certifications: [],
  projects: [],
};

const defaultLearner: Learner = {
  profile: {
    ...emptyProfile,
    name: "Demo learner",
    education: "Computer Science student",
  },
  goalRoleId: "full-stack-developer",
  skillMap: [],
  gaps: [],
  matchPercent: 0,
  roadmap: [],
  scores: [],
  agentLog: [],
  interview: null,
};

const SkillPathContext = createContext<{
  learner: Learner;
  setLearner: Dispatch<SetStateAction<Learner>>;
} | null>(null);

export function SkillPathProvider({ children }: { children: ReactNode }) {
  const [learner, setLearnerState] = useState<Learner>(defaultLearner);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Learner;
          if (parsed && parsed.profile) {
            const profile = parsed.profile as Learner["profile"];
            setLearnerState({ ...defaultLearner, ...parsed, profile: { ...defaultLearner.profile, ...profile, claimedSkills: profile.claimedSkills ?? [] }, interview: parsed.interview ?? null });
          }
        } catch {
          // Ignore invalid or legacy local storage values.
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(learner));
  }, [learner, hydrated]);

  const value = useMemo(
    () => ({
      learner,
      setLearner: setLearnerState,
    }),
    [learner],
  );

  return <SkillPathContext.Provider value={value}>{children}</SkillPathContext.Provider>;
}

export function useSkillPath() {
  const ctx = useContext(SkillPathContext);
  if (!ctx) {
    throw new Error("useSkillPath must be used within SkillPathProvider");
  }
  return ctx;
}
