import { Prisma } from "@prisma/client";
import { getBackgroundJsonResponse, startBackgroundJson } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { assertTrapMap, orderedConcepts, trapMapSchemaHint, trapMapSystemPrompt, type TrapMap } from "@/lib/prompts/trapmap";

type StoredInput = { prompt?: unknown };
export type GenerationState = { status: "preparing" | "ready" | "failed"; firstQuestion?: string; error?: string };

function inputPrompt(value: Prisma.JsonValue | null) {
  const prompt = (value as StoredInput | null)?.prompt;
  return typeof prompt === "string" ? prompt : undefined;
}

export async function startSubjectGeneration(subjectId: string, prompt: string) {
  const response = await startBackgroundJson(trapMapSystemPrompt, prompt, trapMapSchemaHint);
  await prisma.subject.update({
    where: { id: subjectId },
    data: { generationStatus: "preparing", generationResponseId: response.id, generationInput: { prompt }, generationError: null, generationAttempts: { increment: 1 } },
  });
}

export async function refreshSubjectGeneration(subjectId: string): Promise<GenerationState> {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true, trapMap: true, generationStatus: true, generationResponseId: true, generationInput: true, generationAttempts: true } });
  if (!subject) return { status: "failed", error: "This onboarding plan no longer exists." };
  if (subject.generationStatus === "ready") {
    const map = subject.trapMap as unknown as TrapMap;
    return { status: "ready", firstQuestion: orderedConcepts(map)[0]?.misconceptions[0]?.naive_question };
  }
  if (!subject.generationResponseId) return { status: "failed", error: "The onboarding plan could not be started. Try again." };

  const response = await getBackgroundJsonResponse(subject.generationResponseId);
  if (response.status === "queued" || response.status === "in_progress") return { status: "preparing" };
  if (response.status !== "completed") {
    const error = "We could not finish preparing this onboarding plan. Try again.";
    await prisma.subject.update({ where: { id: subject.id }, data: { generationStatus: "failed", generationError: error, generationResponseId: null } });
    return { status: "failed", error };
  }

  try {
    const map = JSON.parse(response.outputText) as TrapMap;
    assertTrapMap(map);
    if (map.concepts.length < 5 || map.concepts.length > 8) throw new Error("The study map needs 5 to 8 concepts.");
    await prisma.$transaction([
      prisma.conceptState.deleteMany({ where: { subjectId: subject.id } }),
      prisma.subject.update({
        where: { id: subject.id },
        data: { trapMap: map as unknown as Prisma.InputJsonValue, generationStatus: "ready", generationResponseId: null, generationInput: Prisma.JsonNull, generationError: null, learnerState: { create: map.concepts.map((concept) => ({ conceptId: concept.id, status: "not_covered" })) } },
      }),
    ]);
    return { status: "ready", firstQuestion: orderedConcepts(map)[0]?.misconceptions[0]?.naive_question };
  } catch {
    const prompt = inputPrompt(subject.generationInput);
    if (prompt && subject.generationAttempts < 2) {
      await startSubjectGeneration(subject.id, `${prompt}\n\nYour previous response was invalid. Return only a valid JSON object matching the requested schema.`);
      return { status: "preparing" };
    }
    const error = "We could not prepare this onboarding plan. Try again.";
    await prisma.subject.update({ where: { id: subject.id }, data: { generationStatus: "failed", generationError: error, generationResponseId: null } });
    return { status: "failed", error };
  }
}
