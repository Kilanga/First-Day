import { NextResponse } from "next/server";
import { requireMentorId } from "@/lib/mentorSession";
import { prisma } from "@/lib/prisma";
import { refreshSubjectGeneration, startSubjectGeneration } from "@/lib/subjectGeneration";

async function privateSubject(request: Request, subjectId: string) {
  const mentorId = requireMentorId(request);
  return prisma.subject.findFirst({ where: { id: subjectId, mentorId }, select: { id: true, generationInput: true } });
}

export async function GET(request: Request, { params }: { params: Promise<{ subjectId: string }> }) {
  try {
    const subject = await privateSubject(request, (await params).subjectId);
    if (!subject) return NextResponse.json({ error: "Learning subject not found." }, { status: 404 });
    return NextResponse.json(await refreshSubjectGeneration(subject.id));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check this study path." }, { status: 401 }); }
}

export async function POST(request: Request, { params }: { params: Promise<{ subjectId: string }> }) {
  try {
    const subject = await privateSubject(request, (await params).subjectId);
    const prompt = (subject?.generationInput as { prompt?: unknown } | null)?.prompt;
    if (!subject || typeof prompt !== "string") return NextResponse.json({ error: "This study path cannot be retried." }, { status: 400 });
    await startSubjectGeneration(subject.id, prompt);
    return NextResponse.json({ status: "preparing" });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to retry this study path." }, { status: 502 }); }
}
