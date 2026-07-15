import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderedConcepts, type TrapMap } from "@/lib/prompts/trapmap";

function nextQuestion(trapMap: TrapMap, states: Array<{ conceptId: string; status: string }>) {
  const statusById = new Map(states.map((state) => [state.conceptId, state.status]));
  const concepts = orderedConcepts(trapMap);
  const target = concepts.find((concept) => statusById.get(concept.id) === "weak")
    ?? concepts.find((concept) => statusById.get(concept.id) === "not_covered")
    ?? concepts[0];
  return target?.misconceptions[0]?.naive_question;
}

export async function GET(request: Request) {
  const mentorId = new URL(request.url).searchParams.get("mentorId");
  if (!mentorId) return NextResponse.json({ error: "mentorId is required." }, { status: 400 });
  const subjects = await prisma.subject.findMany({
    where: { mentorId },
    orderBy: { createdAt: "desc" },
    include: {
      hire: true,
      learnerState: true,
      sessions: { where: { endedAt: null }, orderBy: { startedAt: "desc" }, take: 1, include: { messages: { orderBy: { createdAt: "asc" } } } },
    },
  });
  return NextResponse.json({
    subjects: subjects.filter((subject) => subject.hire).map((subject) => ({
      id: subject.id,
      title: subject.title,
      firstQuestion: nextQuestion(subject.trapMap as unknown as TrapMap, subject.learnerState),
      hire: {
        name: subject.hire!.name,
        tier: subject.hire!.tier,
        xp: subject.hire!.xp,
        stats: { comprehension: subject.hire!.statComprehension, autonomy: subject.hire!.statAutonomy, reflexes: subject.hire!.statReflexes, confidence: subject.hire!.statConfidence },
      },
      activeSession: subject.sessions[0] ? {
        id: subject.sessions[0].id,
        messages: subject.sessions[0].messages.map((message) => ({ id: message.id, role: message.role, content: message.content })),
      } : null,
    })),
  });
}
