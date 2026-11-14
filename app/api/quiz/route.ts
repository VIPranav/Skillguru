import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/orchestrator";
import { quizRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = quizRequestSchema.parse(body);
    const result = await generateQuiz(parsed.milestone);
    return NextResponse.json({ questions: result.questions, agentLog: result.agentLog });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate quiz." }, { status: 400 });
  }
}
