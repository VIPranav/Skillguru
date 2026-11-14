export type Level = 0 | 1 | 2 | 3 | 4 | 5;
export type MilestoneStatus = "todo" | "in_progress" | "done" | "remediation";
export type AgentName = "Skill Analyst" | "Career Matcher" | "Path Planner" | "Assessor" | "Mentor";

export interface Profile {
  name: string;
  education: string;
  claimedSkills: string[];
  certifications: string[];
  projects: string[];
}

export interface SkillMapItem {
  name: string;
  level: number;
  evidence: string;
  confidence: "low" | "medium" | "high";
}

export interface InterviewTurn {
  id: string;
  role: "mentor" | "learner";
  text: string;
  targetSkill?: string;
  at: string;
}

export interface Interview {
  turns: InterviewTurn[];
  status: "in_progress" | "complete";
  skillsOverride?: string[];
}

export interface Gap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  importance: number;
  gapSize: number;
  assessed?: boolean;
}

export interface ScoreEntry {
  milestoneId: string;
  score: number;
  total: number;
  at: string;
}

export interface Milestone {
  id: string;
  title: string;
  skill: string;
  targetLevel: number;
  resourceIds: string[];
  exercise: string;
  estHours: number;
  status: MilestoneStatus;
}

export interface AgentLogEntry {
  id: string;
  agent: AgentName;
  action: string;
  summary: string;
  durationMs: number;
  at: string;
  provider?: string;
}

export interface Learner {
  profile: Profile;
  goalRoleId: string;
  skillMap: SkillMapItem[];
  gaps: Gap[];
  matchPercent: number;
  roadmap: Milestone[];
  scores: ScoreEntry[];
  agentLog: AgentLogEntry[];
  interview: Interview | null;
}

export interface RoleDefinition {
  id: string;
  title: string;
  skills: { name: string; requiredLevel: number; importance: number }[];
}

export interface ResourceItem {
  id: string;
  title: string;
  url: string;
  skill: string;
  minLevel: number;
  maxLevel: number;
  type: "course" | "tutorial" | "exercise" | "docs";
  hours: number;
}
