import { z } from "zod";

export const levelSchema = z.number().int().min(0).max(5);

export const profileSchema = z.object({
  name: z.string().min(1),
  education: z.string().min(1),
  claimedSkills: z.array(z.string().min(1)).optional().default([]),
  certifications: z.array(z.string()),
  projects: z.array(z.string()),
});

export const skillMapItemSchema = z.object({
  name: z.string().min(1),
  level: levelSchema,
  evidence: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
});

export const interviewTurnSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["mentor", "learner"]),
  text: z.string().max(1000),
  targetSkill: z.string().optional(),
  at: z.string().min(1),
});
export const interviewSchema = z.object({
  turns: z.array(interviewTurnSchema),
  status: z.enum(["in_progress", "complete"]),
  skillsOverride: z.array(z.string()).optional(),
});

export const gapSchema = z.object({
  skill: z.string().min(1),
  currentLevel: levelSchema,
  requiredLevel: levelSchema,
  importance: z.number().min(1).max(3),
  gapSize: z.number().int().min(0).max(5),
});

export const milestoneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  skill: z.string().min(1),
  targetLevel: levelSchema,
  resourceIds: z.array(z.string()),
  exercise: z.string().min(1),
  estHours: z.number().min(1),
  status: z.enum(["todo", "in_progress", "done", "remediation"]),
});

export const scoreEntrySchema = z.object({
  milestoneId: z.string().min(1),
  score: z.number().min(0),
  total: z.number().min(1),
  at: z.string().min(1),
});

export const agentLogEntrySchema = z.object({
  id: z.string().min(1),
  agent: z.enum(["Skill Analyst", "Career Matcher", "Path Planner", "Assessor", "Mentor"]),
  action: z.string().min(1),
  summary: z.string().min(1),
  durationMs: z.number().min(0),
  at: z.string().min(1),
});

export const learnerSchema = z.object({
  profile: profileSchema,
  goalRoleId: z.string().min(1),
  skillMap: z.array(skillMapItemSchema),
  gaps: z.array(gapSchema),
  matchPercent: z.number().min(0).max(100),
  roadmap: z.array(milestoneSchema),
  scores: z.array(scoreEntrySchema),
  agentLog: z.array(agentLogEntrySchema),
  interview: interviewSchema.nullable().optional().default(null),
});

export const analyzeRequestSchema = z.object({
  profile: profileSchema,
  goalRoleId: z.string().min(1),
  turns: z.array(interviewTurnSchema),
  skillsOverride: z.array(z.string()).optional(),
  previousSkillMap: z.array(skillMapItemSchema).optional(),
});

export const interviewNextRequestSchema = z.object({
  profile: profileSchema,
  goalRoleId: z.string().min(1),
  turns: z.array(interviewTurnSchema),
  skillsOverride: z.array(z.string()).optional(),
});

export const quizRequestSchema = z.object({
  milestone: milestoneSchema,
});

export const submitRequestSchema = z.object({
  learner: learnerSchema,
  milestoneId: z.string().min(1),
  questions: z.array(
    z.object({
      id: z.string().min(1),
      question: z.string().min(1),
      options: z.array(z.string()).length(4),
      answerIndex: z.number().int().min(0).max(3),
      explanation: z.string().min(1),
    }),
  ),
  answers: z.array(z.number().int().min(0).max(3)),
});

export const changeGoalRequestSchema = z.object({
  learner: learnerSchema,
  newRoleId: z.string().min(1),
});

export const mentorRequestSchema = z.object({
  learner: learnerSchema,
  message: z.string().min(1),
});

export const mentorChatReplySchema = z.object({
  reply: z.string().min(1),
});

export const skillAnalystSchema = z.object({
  skillMap: z.array(skillMapItemSchema),
});

export const mentorInterviewSchema = z.object({
  message: z.string().min(1).max(399),
  targetSkill: z.string().nullable(),
  done: z.boolean(),
});

export const careerMatcherSchema = z.object({
  priorityOrder: z.array(z.string().min(1)),
  rationale: z.string().min(1),
});

export const pathPlannerSchema = z.object({
  milestones: z.array(milestoneSchema),
});

export const assessmentQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

export const assessmentSchema = z.object({
  questions: z.array(assessmentQuestionSchema).length(5),
});

export const mentorSchema = z.object({
  message: z.string().min(1),
  action: z.enum(["continue", "remediate", "advance"]),
  weakTopics: z.array(z.string()),
});
