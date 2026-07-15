import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orderedConcepts, type TrapMap } from "@/lib/prompts/trapmap";

export async function POST(request: Request, { params }: { params: { shareCode: string } }) {
  try {
    const { mentorId } = await request.json();
    if (typeof mentorId !== "string" || !mentorId.trim()) return NextResponse.json({ error: "A mentor session is required." }, { status: 400 });
    const template = await prisma.subject.findFirst({
      where: { shareCode: params.shareCode, shareEnabled: true },
      include: { hire: true },
    });
    if (!template?.hire) return NextResponse.json({ error: "This shared learning link is no longer available." }, { status: 404 });

    await prisma.mentor.upsert({ where: { id: mentorId }, update: {}, create: { id: mentorId } });
    const trapMap = template.trapMap as unknown as TrapMap;
    const subject = await prisma.subject.create({
      data: {
        mentorId,
        title: template.title,
        trapMap: template.trapMap as Prisma.InputJsonValue,
        learnerState: { create: orderedConcepts(trapMap).map((concept) => ({ conceptId: concept.id, status: "not_covered" })) },
        hire: { create: { mentorId, name: template.hire.name, personality: template.hire.personality as Prisma.InputJsonValue } },
      },
      include: { hire: true },
    });
    const firstQuestion = orderedConcepts(trapMap)[0]?.misconceptions[0]?.naive_question;
    if (!firstQuestion || !subject.hire) throw new Error("The shared learning has no first question.");
    return NextResponse.json({
      subjectId: subject.id,
      firstQuestion,
      hire: { name: subject.hire.name },
    });
  } catch (error) {
    console.error("Shared onboarding claim failed", error);
    return NextResponse.json({ error: "Unable to start this learning." }, { status: 502 });
  }
}
