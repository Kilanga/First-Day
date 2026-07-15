import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { callJson, callText } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

type GapReport = {
  strengths: string[];
  gaps: Array<{ concept: string; whatWasMissing: string; tryNextTime: string }>;
  suggestedNextSession: string;
};

const gapReportSchemaHint = `{
  "strengths": ["string"],
  "gaps": [{ "concept": "string", "whatWasMissing": "string", "tryNextTime": "string" }],
  "suggestedNextSession": "string"
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
    const { sessionId, preview = false } = await request.json();
    if (typeof sessionId !== "string") return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } }, subject: { include: { hire: true } } },
    });
    if (!session?.subject.hire) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    const cachedReport = storedReport(session.gapReport);
    if (session.endedAt && cachedReport) return NextResponse.json({ sessionId: session.id, report: cachedReport });

    let report = cachedReport;
    if (!report) {
      const notes = session.messages.filter((message) => message.role === "mentor").map((message) => noteForReport(message.verdict)).filter((note): note is string => Boolean(note));
      report = await callJson<GapReport>(
        "You compile a friendly, practical learning-session report for a mentor. Return only JSON. Focus on observable teaching strengths and actionable gaps; never mention scoring, verdicts, AI, or hidden evaluation.",
        `SUBJECT: ${session.subject.title}\n\nEXAMINER NOTES:\n${notes.length ? notes.map((note) => `- ${note}`).join("\n") : "- No explanation attempts were recorded."}`,
        gapReportSchemaHint,
      );
      assertGapReport(report);
    }
    if (preview) {
      await prisma.learningSession.update({ where: { id: session.id }, data: { gapReport: report as unknown as Prisma.InputJsonValue } });
      return NextResponse.json({ sessionId: session.id, report });
    }

    const memory = (await callText(
      `You are ${session.subject.hire.name}, a junior employee. Write ONE warm memory from your perspective about this mentoring session. It must be first person, at most two sentences, and reference a concrete example the mentor used if there was one. Do not mention assessment, scores, XP, or AI. Return only the memory text.`,
      [{ role: "user", content: session.messages.map((message) => `${message.role}: ${message.content}`).join("\n") }],
    )).trim();
    const existingMemories = Array.isArray(session.subject.hire.memories) ? session.subject.hire.memories.filter((item): item is string => typeof item === "string") : [];

    await prisma.$transaction([
      prisma.learningSession.update({ where: { id: session.id }, data: { endedAt: new Date(), gapReport: report as unknown as Prisma.InputJsonValue } }),
      prisma.hire.update({ where: { id: session.subject.hire.id }, data: { memories: [...existingMemories, memory].slice(-10) as unknown as Prisma.InputJsonValue } }),
    ]);
    return NextResponse.json({ sessionId: session.id, report });
  } catch (error) {
    console.error("Session end failed", error);
    return NextResponse.json({ error: "Unable to end this session." }, { status: 502 });
  }
}
