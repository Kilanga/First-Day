import { Prisma } from "@prisma/client";
import { callJson, callText, type ConversationMessage } from "./openai";
import { prisma } from "./prisma";
import { assertExaminerResult, examinerSchemaHint, examinerSystemPrompt, type ExaminerResult } from "./prompts/examiner";
import { newHireSystemPrompt } from "./prompts/newhire";
import { orderedConcepts, type TrapConcept, type TrapMap } from "./prompts/trapmap";
import { applyXp } from "./xp";

type ChatInput = { mentorId: string; subjectId: string; sessionId?: string; message: string };

function selectTarget(trapMap: TrapMap, states: Array<{ conceptId: string; status: string }>): TrapConcept | undefined {
  const statusByConcept = new Map(states.map((state) => [state.conceptId, state.status]));
  const concepts = orderedConcepts(trapMap);
  return concepts.find((concept) => statusByConcept.get(concept.id) === "weak")
    ?? concepts.find((concept) => statusByConcept.get(concept.id) === "not_covered");
}

function misconceptionFor(concept?: TrapConcept) {
  return concept?.misconceptions[0];
}

function asTrapMap(value: Prisma.JsonValue): TrapMap {
  return value as unknown as TrapMap;
}

export async function orchestrateChat(input: ChatInput) {
  const subject = await prisma.subject.findFirst({
    where: { id: input.subjectId, mentorId: input.mentorId },
    include: { hire: true, learnerState: true },
  });
  if (!subject?.hire) throw new Error("Subject or hire not found.");

  const session = input.sessionId
    ? await prisma.learningSession.findFirst({ where: { id: input.sessionId, subjectId: subject.id } })
    : await prisma.learningSession.create({ data: { subjectId: subject.id } });
  if (!session) throw new Error("Session not found.");

  const history = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  history.reverse();

  const trapMap = asTrapMap(subject.trapMap);
  const priorHireQuestion = [...history].reverse().find((entry) => entry.role === "hire");
  const currentTarget = trapMap.concepts.find((concept) => concept.id === priorHireQuestion?.conceptId)
    ?? selectTarget(trapMap, subject.learnerState);
  const currentMisconception = misconceptionFor(currentTarget);

  const examinerRaw = await callJson<ExaminerResult>(
    examinerSystemPrompt(currentTarget, currentMisconception),
    `MENTOR MESSAGE:\n${input.message}\n\nCONVERSATION CONTEXT:\n${history.map((entry) => `${entry.role}: ${entry.content}`).join("\n")}`,
    examinerSchemaHint,
  );
  assertExaminerResult(examinerRaw);
  const verdict = examinerRaw;

  const xp = applyXp(subject.hire.xp, verdict);
  const stateStatus = verdict.verdict === "fail" ? "weak" : verdict.verdict === "partial" ? "partial" : verdict.verdict === "pass" ? "mastered" : undefined;
  const verdictConceptId = currentTarget?.id ?? verdict.concept_id;

  const updated = await prisma.$transaction(async (tx) => {
    if (stateStatus && currentTarget) {
      await tx.conceptState.update({
        where: { subjectId_conceptId: { subjectId: subject.id, conceptId: currentTarget.id } },
        data: { status: stateStatus, attempts: { increment: 1 } },
      });
    }
    return tx.hire.update({
      where: { id: subject.hire!.id },
      data: {
        xp: { increment: xp.xpDelta },
        tier: xp.tier,
        statComprehension: { increment: xp.statDeltas.comprehension },
        statAutonomy: { increment: xp.statDeltas.autonomy },
        statReflexes: { increment: xp.statDeltas.reflexes },
      },
    });
  });

  const learnerState = await prisma.conceptState.findMany({ where: { subjectId: subject.id } });
  const nextTarget = selectTarget(trapMap, learnerState);
  const newHireSystem = newHireSystemPrompt({
    name: updated.name,
    personality: Array.isArray(updated.personality) ? updated.personality.filter((value): value is string => typeof value === "string") : [],
    trapMap,
    learnerState,
    memories: updated.memories,
    verdict,
    targetConceptId: nextTarget?.id,
  });
  const conversation: ConversationMessage[] = [
    ...history.map((entry) => ({ role: entry.role === "hire" ? "assistant" as const : "user" as const, content: entry.content })),
    { role: "user", content: input.message },
  ];
  const hireReply = await callText(newHireSystem, conversation);
  await prisma.$transaction([
    prisma.message.create({
      data: {
        sessionId: session.id,
        role: "mentor",
        content: input.message,
        conceptId: verdictConceptId || null,
        verdict: verdict as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.message.create({
      data: { sessionId: session.id, role: "hire", content: hireReply, conceptId: nextTarget?.id ?? null },
    }),
  ]);

  return {
    sessionId: session.id,
    hireReply,
    verdict,
    xpDelta: xp.xpDelta,
    statDeltas: xp.statDeltas,
    tierUp: xp.tierUp,
    hire: {
      name: updated.name,
      tier: updated.tier,
      xp: updated.xp,
      stats: {
        comprehension: updated.statComprehension,
        autonomy: updated.statAutonomy,
        reflexes: updated.statReflexes,
        confidence: updated.statConfidence,
      },
    },
  };
}
