import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function createShareCode() { return crypto.randomUUID().replace(/-/g, ""); }

export async function POST(request: Request) {
  try {
    const { mentorId, subjectId } = await request.json();
    if (typeof mentorId !== "string" || typeof subjectId !== "string") return NextResponse.json({ error: "mentorId and subjectId are required." }, { status: 400 });
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, mentorId }, select: { id: true, shareCode: true } });
    if (!subject) return NextResponse.json({ error: "Learning subject not found." }, { status: 404 });
    const shareCode = subject.shareCode ?? createShareCode();
    await prisma.subject.update({ where: { id: subject.id }, data: { shareCode, shareEnabled: true } });
    return NextResponse.json({ shareCode });
  } catch (error) {
    console.error("Share link creation failed", error);
    return NextResponse.json({ error: "Unable to create a share link." }, { status: 502 });
  }
}
