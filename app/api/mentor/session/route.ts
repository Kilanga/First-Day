import { NextResponse } from "next/server";
import { issueMentorSession, MENTOR_SESSION_COOKIE, requireMentorId, resolveMentorId } from "@/lib/mentorSession";
import { prisma } from "@/lib/prisma";
import { operationalErrorKind } from "@/lib/telemetry";

export async function POST(request: Request) {
  try {
    const { mentorId } = await request.json();
    const resolved = resolveMentorId(request, mentorId);
    return issueMentorSession(NextResponse.json({ ready: true }), resolved.mentorId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open a private onboarding desk.";
    const status = /private-session signing secret/i.test(message) ? 500 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const mentorId = requireMentorId(request);
    const subjects = await prisma.subject.findMany({ where: { mentorId }, select: { id: true } });
    const subjectIds = subjects.map((subject) => subject.id);
    const sessions = subjectIds.length ? await prisma.learningSession.findMany({ where: { subjectId: { in: subjectIds } }, select: { id: true } }) : [];
    const sessionIds = sessions.map((session) => session.id);
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.learningSession.deleteMany({ where: { subjectId: { in: subjectIds } } }),
      prisma.conceptState.deleteMany({ where: { subjectId: { in: subjectIds } } }),
      prisma.hire.deleteMany({ where: { mentorId } }),
      prisma.subject.deleteMany({ where: { mentorId } }),
      prisma.rateLimitCounter.deleteMany({ where: { key: { contains: mentorId } } }),
      prisma.mentor.delete({ where: { id: mentorId } }),
    ]);
    const response = NextResponse.json({ deleted: true });
    response.cookies.set({ name: MENTOR_SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Mentor data deletion failed", operationalErrorKind(error));
    return NextResponse.json({ error: "Unable to delete your onboarding desk data." }, { status: 502 });
  }
}
