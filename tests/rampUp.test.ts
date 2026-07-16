import { describe, expect, it } from "vitest";
import { nextRampUpMessage, rampUpSummary } from "@/lib/rampUp";

describe("ramp-up display", () => {
  it("moves to First Month at half the acquired ideas", () => {
    const concepts = ["mastered", "mastered", "mastered", "not_covered", "not_covered"];
    const summary = rampUpSummary(concepts.map((status) => ({ status })));

    expect(summary).toMatchObject({ total: 5, acquired: 3, firstMonthAt: 3, tier: "First Month" });
    expect(nextRampUpMessage("Sam", concepts.map((status) => ({ status })))).toBe("2 more ideas until Sam's confirmation review");
  });

  it("shows the confirmation review only after every idea is acquired", () => {
    const concepts = ["mastered", "mastered", "mastered"];
    const summary = rampUpSummary(concepts.map((status) => ({ status })));

    expect(summary).toMatchObject({ acquired: 3, readyForConfirmation: true, tier: "Ready for confirmation review" });
  });
});
