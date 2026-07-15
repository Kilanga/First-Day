import { describe, expect, it } from "vitest";
import { applyXp } from "@/lib/xp";

const explanation = (verdict: "pass" | "partial" | "fail" | "n/a") => ({
  concept_id: "concept",
  verdict,
  scores: { accuracy: 3, completeness: 3, clarity: 3, example: 2 },
  missing_piece: "",
  note_for_report: "",
});

describe("applyXp", () => {
  it("rewards a clear explanation and promotes an Intern to Junior at the threshold", () => {
    const result = applyXp(45, explanation("pass"));
    expect(result.xpDelta).toBe(10);
    expect(result.tier).toBe("month1");
    expect(result.tierUp).toBe(true);
  });

  it("keeps the correct smaller rewards for incomplete and unsuccessful explanations", () => {
    expect(applyXp(0, explanation("partial")).xpDelta).toBe(4);
    expect(applyXp(0, explanation("fail")).xpDelta).toBe(1);
  });

  it("does not award progress for a conversational message", () => {
    const result = applyXp(80, explanation("n/a"));
    expect(result.xpDelta).toBe(0);
    expect(result.statDeltas).toEqual({ comprehension: 0, autonomy: 0, reflexes: 0, confidence: 0 });
  });
});
