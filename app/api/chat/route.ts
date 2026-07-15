import { NextResponse } from "next/server";
import { orchestrateChat } from "@/lib/orchestrator";
import { consumeMessageQuota, refundMessageQuota } from "@/lib/ratelimit";
import { requireMentorId } from "@/lib/mentorSession";

export async function POST(request: Request) {
  let chargedMentorId: string | undefined;
  try {
    const body = await request.json();
    if (!body || typeof body.subjectId !== "string" ||
      typeof body.message !== "string" || !body.message.trim() || body.message.length > 6000 || (body.sessionId !== undefined && typeof body.sessionId !== "string")) {
      return NextResponse.json({ error: "subjectId and message are required." }, { status: 400 });
    }
    const mentorId = requireMentorId(request);
    if (!(await consumeMessageQuota(mentorId))) {
      return NextResponse.json({ error: "The office is closed for today — come back tomorrow." }, { status: 429 });
    }
    chargedMentorId = mentorId;
    return NextResponse.json(await orchestrateChat({ ...body, mentorId }));
  } catch (error) {
    if (chargedMentorId) await refundMessageQuota(chargedMentorId).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat request failed", { message });
    const temporarilyUnavailable = /quota|rate limit|insufficient_quota/i.test(message);
    return NextResponse.json({
      error: temporarilyUnavailable
        ? "The office is temporarily unavailable. Please try again in a little while."
        : "We couldn't process that explanation. Please try again.",
    }, { status: temporarilyUnavailable ? 503 : 502 });
  }
}
