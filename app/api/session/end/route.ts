import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { callJson, callText } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { requireMentorId } from "@/lib/mentorSession";
import { consumeAiActionQuota } from "@/lib/ratelimit";

type GapReport = {
  strengths: string[];
  gaps: Array<{ concept: string; whatWasMissing: string; tryNextTime: string }>;
  suggestedNextSession: string;
  language?: "English";
};

const gapReportSchemaHint = `{
  "strengths": ["string"],
  "gaps": [{ "concept": "string", "whatWasMissing": "string", "tryNextTime": "string" }],
  "suggestedNextSession": "string",
  "language": "English"
}`;

function noteForReport(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const note = (value as Record<string, unknown>).note_for_report;
  return typeof note === "string" && note.trim() ? note.trim() : null;
}

function assertGapReport(value: unknown): asserts value is GapReport {
  const report = value as Partial<GapReport>;
  if (!report || !Array.isArray(report.strengths) || !Array.isArray(report.gaps) || typeof report.suggestedNextSession !== "string" ||
    !report.strengths.every((item) => typeof item === "string") ||
    !report.gaps.every((gap) => gap && typeof gap.concept === "string" && typeof gap.whatWasMissing === "string" && typeof gap.tryNextTime === "string")) {
    throw new Error("The gap report response has an invalid shape.");
  }
}

function storedReport(value: Prisma.JsonValue | null): GapReport | null {
  try {
    assertGapReport(value);
    return value;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId, preview = false, refreshLanguage = false } = await request.json();
    const mentorId = requireMentorId(request);
    if (typeof sessionId !== "string") return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    const session = await prisma.learningSession.findFirst({
      where: { id: sessionId, subject: { mentorId } },
      include: { messages: { orderBy: { createdAt: "asc" } }, subject: { include: { hire: true } } },
    });
    if (!session?.subject.hire) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    const cachedReport = storedReport(session.gapReport);
    if (session.endedAt && cachedReport && (!refreshLanguage || cachedReport.language === "English")) return NextResponse.json({ sessionId: session.id, report: cachedReport, snapshotMessageCount: session.reportMessageCount, snapshotAt: session.reportSnapshotAt });
    if (!cachedReport && !(await consumeAiActionQuota(mentorId, "report"))) return NextResponse.json({ error: "The office is closed for today — come back tomorrow." }, { status: 429 });

    let report = cachedReport;
    if (report && refreshLanguage && report.language !== "English") {
      report = await callJson<GapReport>(
        "Translate this learning-session report into natural English. Preserve its meaning and JSON shape exactly. Return only JSON. Never mention scoring, verdicts, AI, or hidden evaluation.",
        JSON.stringify(report),
        gapReportSchemaHint,
      );
    } else if (!report) {
      const notes = session.messages.filter((message) => message.role === "mentor").map((message) => noteForReport(message.verdict)).filter((note): note is string => Boolean(note));
      report = await callJson<GapReport>(
        "You compile a friendly, practical learning-session report for a mentor. Write every string in English, even if the subject or notes are in another language. Return only JSON. Focus on observable teaching strengths and actionable gaps; never mention scoring, verdicts, AI, or hidden evaluation.",
        `SUBJECT: ${session.subject.title}\n\nEXAMINER NOTES:\n${notes.length ? notes.map((note) => `- ${note}`).join("\n") : "- No explanation attempts were recorded."}`,
        gapReportSchemaHint,
      );
    }
    assertGapReport(report);
    report.language = "English";
    if (preview) {
      const updated = await prisma.learningSession.update({ where: { id: session.id }, data: cachedReport ? {} : { gapReport: report as unknown as Prisma.InputJsonValue, reportSnapshotAt: new Date(), reportMessageCount: session.messages.length } });
      return NextResponse.json({ sessionId: session.id, report, snapshotMessageCount: updated.reportMessageCount ?? session.messages.length, snapshotAt: updated.reportSnapshotAt });
    }

    const memory = (await callText(
      `You are ${session.subject.hire.name}, a curious new hire. Write ONE warm memory from your perspective about this onboarding session. It must be first person, at most two sentences, and reference a concrete example the mentor used if there was one. Write in English only, even if the conversation used another language. Do not mention assessment, scores, points, or AI. Return only the memory text.`,
      [{ role: "user", content: session.messages.map((message) => `${message.role}: ${message.content}`).join("\n") }],
    )).trim();
    const existingMemories = Array.isArray(session.subject.hire.memories) ? session.subject.hire.memories.filter((item): item is string => typeof item === "string") : [];
    const completedSessionCount = await prisma.learningSession.count({ where: { subjectId: session.subjectId, endedAt: { not: null } } });
    const feedbackDue = (completedSessionCount + 1) % 2 === 0;
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const alreadyFinishedToday = Boolean(session.endedAt) || await prisma.learningSession.findFirst({
      where: { subjectId: session.subjectId, endedAt: { gte: dayStart, lt: dayEnd } },
      select: { id: true },
    });
    await prisma.$transaction([
      prisma.learningSession.update({ where: { id: session.id }, data: { endedAt: new Date(), gapReport: report as unknown as Prisma.InputJsonValue, reportSnapshotAt: session.reportSnapshotAt ?? new Date(), reportMessageCount: session.reportMessageCount ?? session.messages.length, journalEntry: memory, feedbackDue } }),
      prisma.hire.update({ where: { id: session.subject.hire.id }, data: { memories: [...existingMemories, memory].slice(-10) as unknown as Prisma.InputJsonValue, ...(alreadyFinishedToday ? {} : { statConfidence: { increment: 1 } }) } }),
    ]);
    return NextResponse.json({ sessionId: session.id, report, snapshotMessageCount: session.reportMessageCount ?? session.messages.length, snapshotAt: session.reportSnapshotAt });
  } catch (error) {
    console.error("Session end failed", error);
    return NextResponse.json({ error: "Unable to end this session." }, { status: 502 });
  }
}
