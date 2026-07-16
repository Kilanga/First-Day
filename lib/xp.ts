import type { ExaminerResult } from "./prompts/examiner";

export function applyXp(currentXp: number, verdict: ExaminerResult) {
  const xpDelta = verdict.verdict === "pass" ? 10 : verdict.verdict === "partial" ? 4 : verdict.verdict === "fail" ? 1 : 0;
  const nextXp = currentXp + xpDelta;
  const tier = nextXp >= 151 ? "confirmed" : nextXp >= 51 ? "month1" : "week1";
  const currentTier = currentXp >= 151 ? "confirmed" : currentXp >= 51 ? "month1" : "week1";
  return {
    xpDelta,
    tier,
    tierUp: tier !== currentTier,
    statDeltas: verdict.verdict === "n/a"
      ? { comprehension: 0, autonomy: 0, reflexes: 0, confidence: 0 }
      : { comprehension: verdict.scores.accuracy, autonomy: verdict.scores.completeness, reflexes: verdict.scores.example, confidence: 0 },
  };
}
