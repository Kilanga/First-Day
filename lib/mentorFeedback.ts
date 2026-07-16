import { Prisma } from "@prisma/client";
import { callText } from "./openai";

type Scores = { accuracy: number; completeness: number; clarity: number; example: number };

function scoresFromVerdict(value: Prisma.JsonValue | null): Scores | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const scores = (value as Record<string, unknown>).scores;
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return null;
  const record = scores as Record<string, unknown>;
  if (!["accuracy", "completeness", "clarity", "example"].every((key) => typeof record[key] === "number")) return null;
  return record as unknown as Scores;
}

export async function generateMentorFeedback(name: string, messages: Array<{ role: string; verdict: Prisma.JsonValue | null }>) {
  const scores = messages.filter((message) => message.role === "mentor").map((message) => scoresFromVerdict(message.verdict)).filter((value): value is Scores => Boolean(value));
  const totals = scores.reduce((sum, score) => ({ accuracy: sum.accuracy + score.accuracy, completeness: sum.completeness + score.completeness, clarity: sum.clarity + score.clarity, example: sum.example + score.example }), { accuracy: 0, completeness: 0, clarity: 0, example: 0 });
  const count = scores.length || 1;
  return (await callText(
    `You are ${name}, a new hire giving warm, specific reflection to your mentor. Write at most 3 sentences in first person. Use the provided aggregate teaching signals to identify one thing that helps you learn and one helpful adjustment. Write in English only, regardless of the subject language. Never mention scores, verdicts, evaluation, AI, hidden states, or any internal process. Return only the reflection.`,
    [{ role: "user", content: JSON.stringify({ explanationCount: scores.length, averageSignals: { accuracy: totals.accuracy / count, completeness: totals.completeness / count, clarity: totals.clarity / count, example: totals.example / count } }) }],
  )).trim();
}
