import { describe, expect, it } from "vitest";
import { selectAgendaTargets } from "@/lib/orchestrator";
import type { TrapMap } from "@/lib/prompts/trapmap";

const map: TrapMap = {
  subject: "Test subject",
  concepts: [
    { id: "basics", name: "Basics", core_idea: "A", misconceptions: [{ id: "a", wrong_belief: "", naive_question: "?", why_it_matters: "" }], depends_on: [] },
    { id: "advanced", name: "Advanced", core_idea: "B", misconceptions: [{ id: "b", wrong_belief: "", naive_question: "?", why_it_matters: "" }], depends_on: ["basics"] },
    { id: "practice", name: "Practice", core_idea: "C", misconceptions: [{ id: "c", wrong_belief: "", naive_question: "?", why_it_matters: "" }], depends_on: ["advanced"] },
  ],
};

describe("selectAgendaTargets", () => {
  it("puts concepts that need another explanation before untouched concepts", () => {
    const targets = selectAgendaTargets(map, [
      { conceptId: "basics", status: "mastered" },
      { conceptId: "advanced", status: "not_covered" },
      { conceptId: "practice", status: "weak" },
    ]);
    expect(targets.map((concept) => concept.id)).toEqual(["practice", "advanced"]);
  });
});
