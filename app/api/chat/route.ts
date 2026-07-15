import { NextResponse } from "next/server";
import { orchestrateChat } from "@/lib/orchestrator";
import { consumeMessageQuota } from "@/lib/ratelimit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body.mentorId !== "string" || typeof body.subjectId !== "string" ||
      typeof body.message !== "string" || (body.sessionId !== undefined && typeof body.sessionId !== "string")) {
      return NextResponse.json({ error: "mentorId, subjectId, and message are required." }, { status: 400 });
    }
    if (!(await consumeMessageQuota(body.mentorId))) {
      return NextResponse.json({ error: "The office is closed for today — come back tomorrow." }, { status: 429 });
    }
    return NextResponse.json(await orchestrateChat(body));
  } catch (error) {
    console.error("Chat request failed", error);
    return NextResponse.json({ error: "Unable to process this message." }, { status: 502 });
  }
}
