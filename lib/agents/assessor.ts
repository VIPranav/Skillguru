import { assessmentSchema } from "@/lib/schemas";
import { callLLM, isMockMode } from "@/lib/llm";
import { isDemoScenario, getDemoQuiz } from "@/lib/fallbacks";
import type { Milestone } from "@/lib/types";

export async function assessor(milestone: Milestone) {
  // Zero network calls in mock mode
  if (isMockMode()) {
    return getDemoQuiz();
  }

  const system = `You are the Assessor agent. Create a 5-question multiple choice quiz testing practical knowledge of ${milestone.skill}.
Each question must test conceptual or hands-on comprehension. Exactly 5 questions required.

REQUIRED OUTPUT FORMAT:
Return ONLY a valid JSON object with NO markdown formatting, NO backticks, and NO prose outside the JSON:
{
  "questions": [
    {
      "id": string (unique ID e.g. "q1"),
      "question": string (clear technical question),
      "options": [string, string, string, string] (array of EXACTLY 4 distinct answer choices),
      "answerIndex": integer (0, 1, 2, or 3 pointing to the correct choice in options),
      "explanation": string (concise explanation of why the answer is correct)
    }
  ]
}
(The "questions" array MUST contain EXACTLY 5 questions, each with EXACTLY 4 options.)`;

  const user = JSON.stringify({ milestone }, null, 2);

  try {
    const result = (await callLLM({
      system,
      user,
      schema: assessmentSchema,
    })) as {
      questions: Array<{
        id: string;
        question: string;
        options: string[];
        answerIndex: number;
        explanation: string;
      }>;
    };

    // Sanitization: verify each question has exactly 4 options and valid answerIndex
    const sanitized = result.questions.map((q, idx) => {
      const options = (q.options || []).slice(0, 4);
      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }
      const rawIndex = Number(q.answerIndex);
      const answerIndex = Math.max(0, Math.min(3, Math.round(Number.isFinite(rawIndex) ? rawIndex : 0)));

      return {
        id: q.id || `q-${idx + 1}`,
        question: String(q.question || `Question ${idx + 1}`).slice(0, 300),
        options,
        answerIndex,
        explanation: String(q.explanation || "Correct based on documentation.").slice(0, 300),
      };
    });

    // Ensure exactly 5 questions
    if (sanitized.length < 5) {
      const fallback = getDemoQuiz();
      for (let i = sanitized.length; i < 5; i++) {
        sanitized.push(fallback[i]);
      }
    }

    return sanitized.slice(0, 5);
  } catch (error) {
    if (isDemoScenario({ name: "Demo learner" }, "full-stack-developer")) {
      return getDemoQuiz();
    }
    throw error;
  }
}
