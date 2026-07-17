import { describe, expect, it } from "vitest";
import { demoProgressForMessage } from "@/lib/demoProgress";

describe("demoProgressForMessage", () => {
  it("recognises Sam's clear explanation of a managed change", () => {
    expect(demoProgressForMessage("project-foundations", "Treat it as a change request: check the impact on effort, timeline, cost, and risk, then get formal approval before adding it.")).toEqual({ conceptId: "scope-creep" });
  });

  it("does not advance Sam for an unsupported claim", () => {
    expect(demoProgressForMessage("project-foundations", "Just add the field quickly; it is only a small change.")).toBeNull();
  });

  it("recognises Milo's number-line explanation", () => {
    expect(demoProgressForMessage("number-quest", "-7 is colder than -3 because it is farther left on the number line and therefore smaller.")).toEqual({ conceptId: "negative-numbers" });
  });
});
