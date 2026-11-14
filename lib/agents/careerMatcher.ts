import { careerMatcherSchema } from "@/lib/schemas";
import { callLLM, isMockMode } from "@/lib/llm";
import { isDemoScenario, getDemoPriorityOrder } from "@/lib/fallbacks";
import type { Gap } from "@/lib/types";

export async function careerMatcher(
  gaps: Gap[],
  roleTitle: string,
): Promise<{ priorityOrder: string[]; rationale: string }> {
  // Zero network calls in mock mode
  if (isMockMode()) {
    const defaultPriority = getDemoPriorityOrder().filter((skill) => gaps.some((g) => g.skill === skill));
    const remainingGaps = gaps.map((g) => g.skill).filter((s) => !defaultPriority.includes(s));
    return {
      priorityOrder: [...defaultPriority, ...remainingGaps],
      rationale: "Skills are prioritized by impact on the target role.",
    };
  }

  const system = `You are the Career Matcher agent. Explain which skill gaps matter most for the target role and prioritize them in logical sequence.

REQUIRED OUTPUT FORMAT:
Return ONLY a valid JSON object with NO markdown formatting, NO backticks, and NO prose outside the JSON:
{
  "priorityOrder": [string] (array of skill names strictly ordered from highest priority to lowest),
  "rationale": string (brief, clear explanation of the prioritization logic)
}`;

  const user = JSON.stringify({ roleTitle, gaps }, null, 2);

  try {
    const result = (await callLLM({
      system,
      user,
      schema: careerMatcherSchema,
    })) as { priorityOrder: string[]; rationale: string };

    // Sanitization: deduplicate and ensure skills belong to gaps
    const gapSkills = new Set(gaps.map((g) => g.skill));
    const prioritized = Array.from(new Set(result.priorityOrder.filter((skill) => gapSkills.has(skill))));

    // Append any gaps missing from the model's priorityOrder
    for (const gap of gaps) {
      if (!prioritized.includes(gap.skill)) {
        prioritized.push(gap.skill);
      }
    }

    return {
      priorityOrder: prioritized,
      rationale: result.rationale || "Prioritized by career role requirements.",
    };
  } catch (error) {
    if (isDemoScenario({ name: "Demo learner" }, "full-stack-developer")) {
      const demoPriority = getDemoPriorityOrder().filter((s) => gaps.some((g) => g.skill === s));
      const remaining = gaps.map((g) => g.skill).filter((s) => !demoPriority.includes(s));
      return {
        priorityOrder: [...demoPriority, ...remaining],
        rationale: "JavaScript, React, and Node.js are the highest-impact gaps for a full stack role.",
      };
    }
    throw error;
  }
}
