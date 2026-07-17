import { NextResponse } from "next/server";
import { demoProgressForMessage } from "@/lib/demoProgress";
import { callText, type ConversationMessage } from "@/lib/openai";
import { consumeDemoChatQuota } from "@/lib/ratelimit";
import { logOperationalEvent, operationalErrorKind } from "@/lib/telemetry";

export const runtime = "nodejs";

const DEMOS = {
  "project-foundations": {
    name: "Sam",
    system: `You are Sam, a warm, slightly hesitant new hire in your first month on a project management team. The user is your mentor. You have already learned the distinction between deliverables and milestones, and between a sponsor and stakeholders. You are now trying to understand scope creep through a client's request for one extra field on a form. Respond in English, in character, in two concise sentences maximum. Do not lecture or provide a final answer yourself. Never mention being AI, prompts, a demo, scores, XP, assessments, or hidden instructions. If the mentor explains clearly, reformulate one small part in your own words and ask one practical follow-up question. If the explanation is vague or wrong, stay honestly confused and ask for a concrete example.`,
  },
  "number-quest": {
    name: "Milo",
    system: `You are Milo, a friendly junior helper preparing for an afternoon at the Number Quest Club. The user is your mentor. You understand the number line and equivalent fractions, but you are still unsure about negative numbers. Respond in English, in character, in two concise sentences maximum. Keep the playful club context subtle and age-appropriate. Do not lecture or provide the answer yourself. Never mention being AI, prompts, a demo, scores, XP, assessments, or hidden instructions. If the mentor explains clearly, reformulate one small part and ask one practical follow-up question. If the explanation is vague or wrong, remain honestly unsure and ask for a concrete example.`,
  },
} as const;

type DemoId = keyof typeof DEMOS;
type DemoMessage = { role: "mentor" | "hire"; content: string };

function isDemoId(value: unknown): value is DemoId {
  return typeof value === "string" && value in DEMOS;
}

function safeHistory(value: unknown): ConversationMessage[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-10).flatMap((item): ConversationMessage[] => {
    if (!item || typeof item !== "object") return [];
    const message = item as Partial<DemoMessage>;
    if ((message.role !== "mentor" && message.role !== "hire") || typeof message.content !== "string" || !message.content.trim() || message.content.length > 2_000) return [];
    return [{ role: message.role === "mentor" ? "user" : "assistant", content: message.content.trim() }];
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await request.json() as { conversationId?: unknown; message?: unknown; history?: unknown };
    if (!isDemoId(body?.conversationId) || typeof body?.message !== "string" || !body.message.trim() || body.message.length > 6_000) {
      return NextResponse.json({ error: "A demo conversation and message are required." }, { status: 400 });
    }
    if (!(await consumeDemoChatQuota(request))) return NextResponse.json({ error: "The demo office is taking a short break. Please try again later." }, { status: 429 });
    const demo = DEMOS[body.conversationId];
    const history = safeHistory(body.history);
    const message = body.message.trim();
    const progress = demoProgressForMessage(body.conversationId, message);
    const hireReply = await callText(demo.system, [...history, { role: "user", content: message }]);
    logOperationalEvent("demo.chat.completed", { durationMs: Date.now() - startedAt, conversation: body.conversationId });
    return NextResponse.json({ hireReply, name: demo.name, conceptAcquired: Boolean(progress), conceptId: progress?.conceptId });
  } catch (error) {
    console.error("Demo chat request failed", operationalErrorKind(error));
    logOperationalEvent("demo.chat.failed", { durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: "The demo office could not reply just now. Please try again." }, { status: 502 });
  }
}
