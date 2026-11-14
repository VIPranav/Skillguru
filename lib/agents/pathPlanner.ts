import { pathPlannerSchema } from "@/lib/schemas";
import { callLLM, isMockMode } from "@/lib/llm";
import { isDemoScenario, getDemoRoadmap, getDemoRemediationRoadmap } from "@/lib/fallbacks";
import type { Gap, Milestone } from "@/lib/types";

export async function pathPlanner(
  gaps: Gap[],
  priorityOrder: string[],
  resources: Record<string, unknown>[],
  previousScores: { milestoneId: string; score: number; total: number }[],
  mode: "initial" | "remediate" | "goal_change",
): Promise<Milestone[]> {
  // Zero network calls in mock mode
  if (isMockMode()) {
    if (mode === "remediate") {
      return getDemoRemediationRoadmap();
    }
    return getDemoRoadmap();
  }

  const validResourceIds = new Set(resources.map((resource) => (resource as { id: string }).id));
  const validResourcesList = resources.map((r) => {
    const item = r as { id: string; skill: string; title: string };
    return { id: item.id, skill: item.skill, title: item.title };
  });

  const system = `You are the Path Planner agent. Build an ordered roadmap of learning milestones ordered logically by prerequisites.
Use ONLY resource IDs from the provided VALID_RESOURCES list. Do not invent resource IDs.

REQUIRED OUTPUT FORMAT:
Return ONLY a valid JSON object with NO markdown formatting, NO backticks, and NO prose outside the JSON:
{
  "milestones": [
    {
      "id": string (unique slug identifier, e.g. "js-foundations"),
      "title": string (descriptive milestone title),
      "skill": string (target skill name),
      "targetLevel": integer (1, 2, 3, 4, or 5),
      "resourceIds": [string] (array of IDs from VALID_RESOURCES),
      "exercise": string (concrete practice project or exercise),
      "estHours": number (integer between 1 and 40),
      "status": "todo" | "in_progress" | "done" | "remediation"
    }
  ]
}`;

  const user = JSON.stringify(
    {
      gaps,
      priorityOrder,
      VALID_RESOURCES: validResourcesList,
      previousScores,
      mode,
    },
    null,
    2,
  );

  try {
    const result = (await callLLM({
      system,
      user,
      schema: pathPlannerSchema,
    })) as { milestones: Milestone[] };

    // Sanitization:
    // 1. Filter resource IDs to only existing ones
    // 2. Ensure non-duplicate IDs
    // 3. Clamp targetLevel (1-5), estHours (min 1)
    // 4. Ensure valid status
    const seenIds = new Set<string>();
    const sanitized: Milestone[] = [];

    for (const m of result.milestones) {
      const validIds = Array.from(
        new Set((m.resourceIds || []).filter((id) => validResourceIds.has(id))),
      );

      // If no valid resources, pick one from catalog matching the skill
      if (validIds.length === 0) {
        const fallbackResource = (resources as Array<{ id: string; skill: string }>).find(
          (r) => r.skill.toLowerCase() === m.skill.toLowerCase(),
        );
        if (fallbackResource) {
          validIds.push(fallbackResource.id);
        } else if (resources.length > 0) {
          validIds.push((resources[0] as { id: string }).id);
        }
      }

      // Ensure unique ID
      let uniqueId = m.id || `${m.skill.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-milestone`;
      if (seenIds.has(uniqueId)) {
        uniqueId = `${uniqueId}-${sanitized.length + 1}`;
      }
      seenIds.add(uniqueId);

      const targetLevel = Math.max(1, Math.min(5, Math.round(Number(m.targetLevel) || 3)));
      const estHours = Math.max(1, Math.round(Number(m.estHours) || 8));
      const status =
        m.status === "todo" || m.status === "in_progress" || m.status === "done" || m.status === "remediation"
          ? m.status
          : "todo";

      sanitized.push({
        id: uniqueId,
        title: String(m.title || `${m.skill} Mastery`).slice(0, 100),
        skill: m.skill,
        targetLevel,
        resourceIds: validIds,
        exercise: String(m.exercise || "Complete practice exercises.").slice(0, 300),
        estHours,
        status,
      });
    }

    return sanitized.slice(0, 8);
  } catch (error) {
    if (mode === "remediate") {
      return getDemoRemediationRoadmap();
    }
    if (isDemoScenario({ name: "Demo learner" }, "full-stack-developer")) {
      return getDemoRoadmap();
    }
    throw error;
  }
}
