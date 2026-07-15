import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMentorFeedback } from "@/lib/mentorFeedback";

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (typeof sessionId !== "string") return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    const session = await prisma.learningSession.findUnique({ where: { id: sessionId }, include: { subject: { include: { hire: true } } } });
    if (!session?.subject.hire) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (session.mentorFeedback) return NextResponse.json({ feedback: session.mentorFeedback });
    const sessions = await prisma.learningSession.findMany({ where: { subjectId: session.subjectId, endedAt: { not: null } }, orderBy: { endedAt: "desc" }, take: 4, include: { messages: true } });
    const feedback = await generateMentorFeedback(session.subject.hire.name, sessions.flatMap((item) => item.messages));
    await prisma.learningSession.update({ where: { id: session.id }, data: { mentorFeedback: feedback } });
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Mentor feedback failed", error);
    return NextResponse.json({ error: "Unable to ask for feedback right now." }, { status: 502 });
  }
}
