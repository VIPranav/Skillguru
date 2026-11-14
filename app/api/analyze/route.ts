import { NextResponse } from "next/server";
import { analyzeAndPlan } from "@/lib/orchestrator";
import { analyzeRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = analyzeRequestSchema.parse(body);
    const learner = await analyzeAndPlan(parsed.profile, parsed.goalRoleId, parsed.turns, parsed.skillsOverride, parsed.previousSkillMap);
    return NextResponse.json({ learner });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze profile." },
      { status: 400 },
    );
  }
}
