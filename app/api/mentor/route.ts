import { NextResponse } from "next/server";
import { mentorChat } from "@/lib/orchestrator";
import { mentorRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = mentorRequestSchema.parse(body);
    const reply = await mentorChat(parsed.learner, parsed.message);
    return NextResponse.json({ reply: reply.reply });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to process mentor chat." }, { status: 400 });
  }
}
