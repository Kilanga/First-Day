import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMentorId } from "@/lib/mentorSession";
import { operationalErrorKind } from "@/lib/telemetry";

function createShareCode() { return crypto.randomUUID().replace(/-/g, ""); }

export async function POST(request: Request) {
  try {
    const { subjectId, rotate = false } = await request.json();
    const mentorId = requireMentorId(request);
    if (typeof subjectId !== "string") return NextResponse.json({ error: "subjectId is required." }, { status: 400 });
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, mentorId }, select: { id: true, shareCode: true } });
    if (!subject) return NextResponse.json({ error: "Learning subject not found." }, { status: 404 });
    const shareCode = rotate || !subject.shareCode ? createShareCode() : subject.shareCode;
    await prisma.subject.update({ where: { id: subject.id }, data: { shareCode, shareEnabled: true } });
    return NextResponse.json({ shareCode });
  } catch (error) {
    console.error("Share link creation failed", operationalErrorKind(error));
    return NextResponse.json({ error: "Unable to create a share link." }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { subjectId } = await request.json();
    const mentorId = requireMentorId(request);
    if (typeof subjectId !== "string") return NextResponse.json({ error: "subjectId is required." }, { status: 400 });
    const updated = await prisma.subject.updateMany({ where: { id: subjectId, mentorId }, data: { shareEnabled: false } });
    if (!updated.count) return NextResponse.json({ error: "Learning subject not found." }, { status: 404 });
    return NextResponse.json({ disabled: true });
  } catch (error) {
    console.error("Share link disabling failed", operationalErrorKind(error));
    return NextResponse.json({ error: "Unable to disable this shared link." }, { status: 502 });
  }
}
