import { connection, NextResponse } from "next/server";
import { getLlmHealth } from "@/lib/llm";

export async function GET() {
  await connection();
  return NextResponse.json(getLlmHealth());
}
