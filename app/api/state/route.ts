import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderedConcepts, type TrapMap } from "@/lib/prompts/trapmap";
import { requireMentorId } from "@/lib/mentorSession";

function nextQuestion(trapMap: TrapMap, states: Array<{ conceptId: string; status: string }>) {
  const statusById = new Map(states.map((state) => [state.conceptId, state.status]));
  const concepts = orderedConcepts(trapMap);
  const target = concepts.find((concept) => statusById.get(concept.id) === "weak")
    ?? concepts.find((concept) => statusById.get(concept.id) === "not_covered")
    ?? concepts[0];
  return target?.misconceptions[0]?.naive_question;
}

export async function GET(request: Request) {
  let mentorId: string;
  try { mentorId = requireMentorId(request); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Private session required." }, { status: 401 }); }
  const subjects = await prisma.subject.findMany({
    where: { mentorId },
    orderBy: { createdAt: "desc" },
    include: {
      hire: true,
      learnerState: true,
      sessions: { orderBy: { startedAt: "desc" }, take: 12, include: { messages: { orderBy: { createdAt: "desc" }, take: 60 } } },
    },
  });
  return NextResponse.json({
    subjects: subjects.filter((subject) => subject.hire).map((subject) => {
      const active = subject.sessions.find((session) => !session.endedAt);
      const completed = subject.sessions.filter((session) => session.endedAt);
      return {
      id: subject.id,
      title: subject.title,
      shareEnabled: subject.shareEnabled,
      firstQuestion: nextQuestion(subject.trapMap as unknown as TrapMap, subject.learnerState),
      hire: {
        name: subject.hire!.name,
        tier: subject.hire!.tier,
        xp: subject.hire!.xp,
        stats: { comprehension: subject.hire!.statComprehension, autonomy: subject.hire!.statAutonomy, reflexes: subject.hire!.statReflexes, confidence: subject.hire!.statConfidence },
      },
      progress: {
        explored: subject.learnerState.filter((state) => state.status !== "not_covered").length,
        mastered: subject.learnerState.filter((state) => state.status === "mastered").length,
        toRevisit: subject.learnerState.filter((state) => state.status === "weak" || state.status === "partial").length,
        total: subject.learnerState.length,
      },
      concepts: orderedConcepts(subject.trapMap as unknown as TrapMap).map((concept) => {
        const state = subject.learnerState.find((item) => item.conceptId === concept.id);
        const notebook = state?.notebookEntry as { text?: unknown } | null;
        return { id: concept.id, name: concept.name, status: state?.status ?? "not_covered", notebookEntry: typeof notebook?.text === "string" ? notebook.text : undefined };
      }),
      activeSession: active ? {
        id: active.id,
        agenda: active.agenda,
        agendaBonusAwarded: active.agendaBonusAwarded,
        messages: [...active.messages].reverse().map((message) => ({ id: message.id, role: message.role, content: message.content })),
      } : null,
      latestCompletedSession: completed[0] ? { id: completed[0].id } : null,
      completedSessions: completed.map((session) => ({ id: session.id, endedAt: session.endedAt!.toISOString() })),
    }; }),
  });
}
