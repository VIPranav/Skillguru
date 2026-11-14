import { NextResponse } from "next/server";
import { interviewNextRequestSchema } from "@/lib/schemas";
import { nextInterviewQuestion } from "@/lib/orchestrator";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const parsed = interviewNextRequestSchema.parse(await request.json());
    const response = await nextInterviewQuestion(parsed.profile, parsed.goalRoleId, parsed.turns, parsed.skillsOverride);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate the next interview question." }, { status: 400 });
  }
}
