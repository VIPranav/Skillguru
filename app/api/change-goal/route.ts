import { NextResponse } from "next/server";
import { changeGoal } from "@/lib/orchestrator";
import { changeGoalRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = changeGoalRequestSchema.parse(body);
    const learner = await changeGoal(parsed.learner, parsed.newRoleId);
    return NextResponse.json({ learner });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to change goal." }, { status: 400 });
  }
}
