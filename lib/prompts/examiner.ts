import type { Misconception, TrapConcept } from "./trapmap";

export type ExaminerVerdict = "pass" | "partial" | "fail" | "n/a";
export type ExaminerResult = {
  concept_id: string;
  verdict: ExaminerVerdict;
  scores: { accuracy: number; completeness: number; clarity: number; example: number };
  missing_piece: string;
  note_for_report: string;
};

export const examinerSchemaHint = `{
  "concept_id": "string", "verdict": "pass" | "partial" | "fail" | "n/a",
  "scores": { "accuracy": 0, "completeness": 0, "clarity": 0, "example": 0 },
  "missing_piece": "string", "note_for_report": "string"
}`;

export function examinerSystemPrompt(concept?: TrapConcept, misconception?: Misconception) {
  return `You are a strict but fair assessor of explanations. You receive:
- the TARGET CONCEPT (core_idea = ground truth) and the misconception
  the learner's question embodied,
- the mentor's explanation (verbatim),
- the conversation context.

Judge ONLY the mentor's explanation. Return ONLY valid JSON:

{
  "concept_id": string,
  "verdict": "pass" | "partial" | "fail" | "n/a",
  "scores": {
    "accuracy": 0-3,
    "completeness": 0-3,
    "clarity": 0-3,
    "example": 0-2
  },
  "missing_piece": string,
  "note_for_report": string
}

Verdict rules:
- n/a: the message is not an explanation attempt (small talk, a question back, off-topic). All scores must be 0 and missing_piece and note_for_report must be empty.
- pass: accuracy 3 and completeness at least 2; the misconception is resolved.
- partial: accuracy at least 2 but something important is missing or vague.
- fail: accuracy at most 1, the explanation dodges the question, or it is circular.
- Be strict on accuracy and generous on style. A rough but correct explanation with a good example beats polished vagueness.
- If the mentor says "I don't know", return fail with an encouraging note.

TARGET CONCEPT (hidden): ${JSON.stringify(concept ?? null)}
TARGET MISCONCEPTION (hidden): ${JSON.stringify(misconception ?? null)}
Write note_for_report to the mentor in English.`;
}

export function assertExaminerResult(value: unknown): asserts value is ExaminerResult {
  const result = value as Partial<ExaminerResult>;
  if (!result || !["pass", "partial", "fail", "n/a"].includes(result.verdict ?? "") ||
    !result.scores || !Number.isFinite(result.scores.accuracy) || !Number.isFinite(result.scores.completeness) ||
    !Number.isFinite(result.scores.clarity) || !Number.isFinite(result.scores.example) ||
    typeof result.concept_id !== "string" || typeof result.missing_piece !== "string" || typeof result.note_for_report !== "string") {
    throw new Error("The examiner response has an invalid shape.");
  }
}
