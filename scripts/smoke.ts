import { getDemoInterviewTurns } from "../lib/fallbacks";
import type { Learner, Profile } from "../lib/types";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

const demoProfile: Profile = {
  name: "Demo learner",
  education: "Computer Science student",
  claimedSkills: ["Python", "SQL", "HTML"],
  certifications: ["Data Fundamentals"],
  projects: ["Flask blog"],
};

interface StepResult {
  step: string;
  pass: boolean;
  durationMs: number;
  provider?: string;
  details?: string;
}

function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

async function runStep<T>(
  stepName: string,
  fn: () => Promise<{ data: T; provider?: string }>,
): Promise<{ result: StepResult; data?: T }> {
  const start = performance.now();
  try {
    const { data, provider } = await fn();
    const durationMs = Math.round(performance.now() - start);
    return {
      result: {
        step: stepName,
        pass: true,
        durationMs,
        provider: provider || "fallback/mock",
      },
      data,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    return {
      result: {
        step: stepName,
        pass: false,
        durationMs,
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

async function main() {
  console.log(`\n========================================`);
  console.log(`  SKILLPATH AI - SMOKE TEST SUITE`);
  console.log(`  Target: ${baseUrl}`);
  console.log(`========================================\n`);

  const results: StepResult[] = [];
  let currentLearner: Learner | null = null;
  let firstMilestone: Learner["roadmap"][0] | null = null;
  let quizQuestions: Array<{ id: string; question: string; options: string[]; answerIndex: number; explanation: string }> = [];

  // Step 1: Health check
  const step1 = await runStep("1. Health Check (GET /api/health)", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { mode?: string; providers?: Array<{ name: string; configured: boolean }> };
    const configured = data.providers?.filter((p) => p.configured).map((p) => p.name).join(", ");
    return { data, provider: data.mode === "mock" ? "mock" : configured || "none" };
  });
  results.push(step1.result);

  // Step 2: Interview opening turn
  const step2 = await runStep("2. Interview Opening Turn (POST /api/interview/next)", async () => {
    const res = await fetch(`${baseUrl}/api/interview/next`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile: demoProfile,
        goalRoleId: "full-stack-developer",
        turns: [],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${err.error || res.statusText}`);
    }
    const data = (await res.json()) as { message: string; targetSkill: string | null; done: boolean; agentLog?: { provider?: string } };
    if (!data.message) throw new Error("Missing interview message in response");
    return { data, provider: data.agentLog?.provider };
  });
  results.push(step2.result);

  // Step 3: Full analysis with demo transcript
  const step3 = await runStep("3. Full Analysis (POST /api/analyze)", async () => {
    const demoTurns = getDemoInterviewTurns();
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile: demoProfile,
        goalRoleId: "full-stack-developer",
        turns: demoTurns,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${err.error || res.statusText}`);
    }
    const data = (await res.json()) as { learner: Learner };
    if (!data.learner || !Array.isArray(data.learner.roadmap) || data.learner.roadmap.length === 0) {
      throw new Error("Invalid learner object or empty roadmap");
    }
    currentLearner = data.learner;
    firstMilestone = data.learner.roadmap[0];
    const topProvider = data.learner.agentLog?.[0]?.provider;
    return { data, provider: topProvider };
  });
  results.push(step3.result);

  // Step 4: Quiz generation for first milestone
  const step4 = await runStep("4. Generate Quiz (POST /api/quiz)", async () => {
    if (!firstMilestone) throw new Error("No milestone available from analysis step");
    const res = await fetch(`${baseUrl}/api/quiz`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ milestone: firstMilestone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${err.error || res.statusText}`);
    }
    const data = (await res.json()) as {
      questions: Array<{ id: string; question: string; options: string[]; answerIndex: number; explanation: string }>;
      agentLog?: Array<{ provider?: string }>;
    };
    if (!Array.isArray(data.questions) || data.questions.length !== 5) {
      throw new Error(`Expected exactly 5 questions, received ${data.questions?.length}`);
    }
    quizQuestions = data.questions;
    const provider = data.agentLog?.[0]?.provider;
    return { data, provider };
  });
  results.push(step4.result);

  // Step 5: Failing quiz submission
  const step5 = await runStep("5. Submit Failing Quiz (POST /api/submit)", async () => {
    if (!currentLearner || !firstMilestone || quizQuestions.length === 0) {
      throw new Error("Missing test state from previous steps");
    }
    // Deliberately wrong answers
    const failingAnswers = quizQuestions.map((q) => (q.answerIndex === 0 ? 1 : 0));
    const res = await fetch(`${baseUrl}/api/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        learner: currentLearner,
        milestoneId: firstMilestone.id,
        questions: quizQuestions,
        answers: failingAnswers,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${err.error || res.statusText}`);
    }
    const data = (await res.json()) as { learner: Learner; mentor: { message: string; action: string; weakTopics: string[] } };
    if (!data.learner || !data.mentor) {
      throw new Error("Missing learner or mentor feedback in submission result");
    }
    currentLearner = data.learner;
    const provider = data.learner.agentLog?.slice(-1)[0]?.provider;
    return { data, provider };
  });
  results.push(step5.result);

  // Step 6: Goal change
  const step6 = await runStep("6. Change Target Goal (POST /api/change-goal)", async () => {
    if (!currentLearner) throw new Error("No learner available from previous steps");
    const res = await fetch(`${baseUrl}/api/change-goal`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        learner: currentLearner,
        newRoleId: "data-analyst",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${err.error || res.statusText}`);
    }
    const data = (await res.json()) as { learner: Learner };
    if (data.learner?.goalRoleId !== "data-analyst") {
      throw new Error(`Expected goalRoleId data-analyst, got ${data.learner?.goalRoleId}`);
    }
    const provider = data.learner.agentLog?.slice(-1)[0]?.provider;
    return { data, provider };
  });
  results.push(step6.result);

  // Print Summary Table
  console.log("---------------------------------------------------------------------------------");
  console.log(
    "%-5s %-45s %-12s %-18s".replace(/%-\d+s/g, (match) => match),
    "STATUS",
    "STEP",
    "DURATION",
    "PROVIDER",
  );
  console.log("---------------------------------------------------------------------------------");

  let allPassed = true;
  for (const r of results) {
    const statusTag = r.pass ? "[PASS]" : "[FAIL]";
    const providerTag = r.provider ? `[${r.provider}]` : "[-]";
    const durationTag = formatDuration(r.durationMs);

    console.log(
      `${statusTag.padEnd(7)} ${r.step.padEnd(46)} ${durationTag.padEnd(12)} ${providerTag}`,
    );
    if (!r.pass && r.details) {
      console.log(`       --> Error: ${r.details}`);
      allPassed = false;
    }
  }

  console.log("---------------------------------------------------------------------------------\n");

  if (!allPassed) {
    console.error("FAIL: One or more smoke tests failed.\n");
    process.exit(1);
  }

  console.log("SUCCESS: All smoke test steps passed successfully!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal smoke test error:", err);
  process.exit(1);
});
