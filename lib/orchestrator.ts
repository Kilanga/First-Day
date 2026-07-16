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

export function selectAgendaTargets(trapMap: TrapMap, states: Array<{ conceptId: string; status: string }>, limit = 3): TrapConcept[] {
  const statusByConcept = new Map(states.map((state) => [state.conceptId, state.status]));
  const concepts = orderedConcepts(trapMap);
  return [
    ...concepts.filter((concept) => statusByConcept.get(concept.id) === "weak"),
    ...concepts.filter((concept) => statusByConcept.get(concept.id) === "not_covered"),
  ].slice(0, limit);
}

function misconceptionFor(concept?: TrapConcept) {
  return concept?.misconceptions[0];
}

function notebookExcerpt(reply: string) {
  const sentences = reply.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  return (sentences.slice(0, 2).join(" ") || reply).slice(0, 700);
}

function mentorNote(verdict: ExaminerResult) {
  if (verdict.verdict === "n/a") return undefined;
  const total = verdict.scores.accuracy + verdict.scores.completeness + verdict.scores.clarity + verdict.scores.example;
  return {
    summary: total >= 9 ? "That explanation gave your colleague a solid foundation." : total >= 6 ? "Your colleague has the main idea, with one useful point to reinforce." : "This topic would benefit from another clear pass together.",
    nextStep: verdict.missing_piece ? `A useful point to return to: ${verdict.missing_piece}` : undefined,
  };
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
  const hire = subject.hire;

  const trapMap = asTrapMap(subject.trapMap);
  const agendaTargets = selectAgendaTargets(trapMap, subject.learnerState);
  const session = input.sessionId
    ? await prisma.learningSession.findFirst({ where: { id: input.sessionId, subjectId: subject.id } })
    : undefined;
  if (input.sessionId && !session) throw new Error("Session not found.");

  const history = session ? await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  }) : [];
  history.reverse();

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
  const priorState = currentTarget ? subject.learnerState.find((state) => state.conceptId === currentTarget.id) : undefined;
  const breakthrough = priorState?.status === "weak" && stateStatus === "mastered";
  const ideaLanded = stateStatus === "mastered" && priorState?.status !== "mastered";
  const progressMoment = breakthrough ? undefined : ideaLanded ? "landed" : stateStatus === "partial" ? "getting-there" : undefined;
  const agendaValue = session?.agenda as { conceptIds?: unknown } | null | undefined;
  const agendaIds = Array.isArray(agendaValue?.conceptIds)
    ? agendaValue.conceptIds.filter((value): value is string => typeof value === "string")
    : agendaTargets.map((concept) => concept.id);

  // Keep the entire turn atomic: no XP, state, or message is stored until the
  // hire has successfully produced a reply. Build the prompt from the projected
  // state instead of writing the examiner result first.
  const projectedLearnerState = subject.learnerState.map((state) => state.conceptId === currentTarget?.id && stateStatus
    ? { ...state, status: stateStatus }
    : state);
  const nextTarget = selectTarget(trapMap, projectedLearnerState);
  const newHireSystem = newHireSystemPrompt({
    name: hire.name,
    personality: Array.isArray(hire.personality) ? hire.personality.filter((value): value is string => typeof value === "string") : [],
    trapMap,
    learnerState: projectedLearnerState,
    memories: hire.memories,
    verdict,
    targetConceptId: nextTarget?.id,
    breakthrough,
  });
  const conversation: ConversationMessage[] = [
    ...history.map((entry) => ({ role: entry.role === "hire" ? "assistant" as const : "user" as const, content: entry.content })),
    { role: "user", content: input.message },
  ];
  const hireReply = await callText(newHireSystem, conversation);
  const updated = await prisma.$transaction(async (tx) => {
    const activeSession = session ?? await tx.learningSession.create({
      data: { subjectId: subject.id, agenda: { conceptIds: agendaIds } },
    });
    if (stateStatus && currentTarget) {
      await tx.conceptState.update({
        where: { subjectId_conceptId: { subjectId: subject.id, conceptId: currentTarget.id } },
        data: {
          status: stateStatus,
          attempts: { increment: 1 },
          ...(stateStatus === "mastered" ? { notebookEntry: { text: notebookExcerpt(hireReply), createdAt: new Date().toISOString() } } : {}),
        },
      });
    }
    let nextHire = await tx.hire.update({
      where: { id: hire.id },
      data: {
        xp: { increment: xp.xpDelta },
        tier: xp.tier,
        statComprehension: { increment: xp.statDeltas.comprehension },
        statAutonomy: { increment: xp.statDeltas.autonomy },
        statReflexes: { increment: xp.statDeltas.reflexes },
      },
    });
    let agendaComplete = false;
    if (agendaIds.length && !activeSession.agendaBonusAwarded) {
      const agendaStates = await tx.conceptState.findMany({ where: { subjectId: subject.id, conceptId: { in: agendaIds } } });
      if (agendaStates.length === agendaIds.length && agendaStates.every((state) => state.status === "mastered")) {
        const claimed = await tx.learningSession.updateMany({ where: { id: activeSession.id, agendaBonusAwarded: false }, data: { agendaBonusAwarded: true } });
        if (claimed.count) {
          agendaComplete = true;
          const totalXp = nextHire.xp + 15;
          const tier = totalXp >= 151 ? "confirmed" : totalXp >= 51 ? "month1" : "week1";
          nextHire = await tx.hire.update({ where: { id: nextHire.id }, data: { xp: { increment: 15 }, tier } });
        }
      }
    }
    await tx.message.create({
      data: {
        sessionId: activeSession.id,
        role: "mentor",
        content: input.message,
        conceptId: verdictConceptId || null,
        verdict: verdict as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.message.create({
      data: { sessionId: activeSession.id, role: "hire", content: hireReply, conceptId: nextTarget?.id ?? null },
    });
    return { hire: nextHire, agendaComplete, sessionId: activeSession.id };
  });

  return {
    sessionId: updated.sessionId,
    hireReply,
    teachingNote: mentorNote(verdict),
    xpDelta: xp.xpDelta + (updated.agendaComplete ? 15 : 0),
    statDeltas: xp.statDeltas,
    tierUp: updated.hire.tier !== hire.tier,
    breakthrough,
    progressMoment,
    agendaComplete: updated.agendaComplete,
    hire: {
      name: updated.hire.name,
      tier: updated.hire.tier,
      xp: updated.hire.xp,
      stats: {
        comprehension: updated.hire.statComprehension,
        autonomy: updated.hire.statAutonomy,
        reflexes: updated.hire.statReflexes,
        confidence: updated.hire.statConfidence,
      },
    },
  };
}
