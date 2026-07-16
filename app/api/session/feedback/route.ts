import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMentorFeedback } from "@/lib/mentorFeedback";
import { requireMentorId } from "@/lib/mentorSession";
import { consumeAiActionQuota } from "@/lib/ratelimit";
import { operationalErrorKind } from "@/lib/telemetry";

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    const mentorId = requireMentorId(request);
    if (typeof sessionId !== "string") return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    const session = await prisma.learningSession.findFirst({ where: { id: sessionId, subject: { mentorId } }, include: { subject: { include: { hire: true } } } });
    if (!session?.subject.hire || !session.endedAt) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (session.mentorFeedback) return NextResponse.json({ feedback: session.mentorFeedback });
    if (!(await consumeAiActionQuota(mentorId, "feedback"))) return NextResponse.json({ error: "The office is closed for today — come back tomorrow." }, { status: 429 });
    const sessions = await prisma.learningSession.findMany({ where: { subjectId: session.subjectId, endedAt: { not: null } }, orderBy: { endedAt: "desc" }, take: 4, include: { messages: true } });
    const feedback = await generateMentorFeedback(session.subject.hire.name, sessions.flatMap((item) => item.messages));
    await prisma.learningSession.update({ where: { id: session.id }, data: { mentorFeedback: feedback } });
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Mentor feedback failed", operationalErrorKind(error));
    return NextResponse.json({ error: "Unable to ask for feedback right now." }, { status: 502 });
  }
}
