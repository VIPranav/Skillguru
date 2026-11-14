import { NextResponse } from "next/server";
import { submitAssessment } from "@/lib/orchestrator";
import { submitRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitRequestSchema.parse(body);
    const result = await submitAssessment(parsed.learner, parsed.milestoneId, parsed.questions, parsed.answers);
    return NextResponse.json({ learner: result.learner, mentor: result.mentor });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to submit assessment." }, { status: 400 });
  }
}
