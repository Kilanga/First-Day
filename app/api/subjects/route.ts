import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { extractSourceDocuments, type ImportedSource } from "@/lib/documentText";
import { orderedConcepts, type TrapMap } from "@/lib/prompts/trapmap";
import { prisma } from "@/lib/prisma";
import demoTrapMap from "@/public/demo/pm-fundamentals.json";
import { assertMentorSessionConfigured, issueMentorSession, requireMentorId, resolveMentorId } from "@/lib/mentorSession";
import { consumeAiActionQuota, consumeIpQuota, refundAiActionQuota } from "@/lib/ratelimit";
import { logOperationalEvent } from "@/lib/telemetry";
import { startSubjectGeneration } from "@/lib/subjectGeneration";

export const runtime = "nodejs";

const NAMES = ["Sam", "Alex", "Jordan", "Riley", "Casey", "Morgan", "Charlie", "Taylor", "Jamie", "Quinn"];
const TRAITS = ["always taking notes on a battered notepad", "slightly too much coffee", "quotes a favorite teacher from time to time", "over-apologizes when confused", "gets visibly excited when something clicks", "keeps a list of 'questions I was afraid to ask'", "makes colourful revision cards", "compares everything to a film or book they loved"];
type SubjectInput = { mentorId?: unknown; title?: unknown; notes?: unknown; focus?: unknown; demo?: unknown; files: File[] };
const MAX_MULTIPART_BYTES = 4_500_000;

function pickTraits() { return [...TRAITS].sort(() => Math.random() - 0.5).slice(0, 3); }
function textField(value: FormDataEntryValue | null) { return typeof value === "string" ? value : undefined; }
function isUploadedFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && typeof value === "object" && value !== null && "arrayBuffer" in value && typeof value.arrayBuffer === "function";
}

async function readInput(request: Request): Promise<SubjectInput> {
  const fallback = new URL(request.url).searchParams;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) throw new Error("Your documents must be 4 MB or smaller in total.");
    const form = await request.formData();
    return {
      // The query fallbacks keep the creation flow resilient if a browser or proxy
      // drops multipart text fields while uploading a document.
      mentorId: textField(form.get("mentorId")) ?? fallback.get("mentorId") ?? undefined,
      title: textField(form.get("title")) ?? fallback.get("title") ?? undefined,
      notes: textField(form.get("notes")), focus: textField(form.get("focus")), demo: textField(form.get("demo")),
      // Do not use `instanceof File`: Node runtimes do not consistently expose
      // the browser File constructor, even though formData() provides file-like values.
      files: form.getAll("files").filter(isUploadedFile),
    };
  }
  const body = await request.json();
  return { ...body, files: [] };
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await readInput(request);
    const isDemo = body.demo === true || body.demo === "true";
    const mentorSession = resolveMentorId(request, body.mentorId);
    assertMentorSessionConfigured();
    if (!isDemo && (typeof body.title !== "string" || !body.title.trim() || body.title.length > 120)) return NextResponse.json({ error: "Add a subject title (up to 120 characters) to continue." }, { status: 400 });
    if (body.notes !== undefined && typeof body.notes !== "string") return NextResponse.json({ error: "Your reference notes could not be read. Please try again." }, { status: 400 });
    if (body.focus !== undefined && typeof body.focus !== "string") return NextResponse.json({ error: "Your learning focus could not be read. Please try again." }, { status: 400 });
    if (typeof body.notes === "string" && body.notes.length > 12_000) return NextResponse.json({ error: "Reference notes must be 12,000 characters or shorter." }, { status: 400 });
    if (typeof body.focus === "string" && body.focus.length > 600) return NextResponse.json({ error: "Your learning focus must be 600 characters or shorter." }, { status: 400 });
    if (!isDemo && body.files.length > 0 && (typeof body.focus !== "string" || !body.focus.trim())) return NextResponse.json({ error: "Describe what your new hire should learn from the documents." }, { status: 400 });

    const mentorId = mentorSession.mentorId;
    const ipLimit = Number(process.env.IP_SUBJECT_HOURLY_CAP ?? 10);
    if (!isDemo && !(await consumeIpQuota(request, "subject", Number.isFinite(ipLimit) && ipLimit > 0 ? ipLimit : 10))) return NextResponse.json({ error: "The office is closed for today — come back tomorrow." }, { status: 429 });
    if (!isDemo && !(await consumeAiActionQuota(mentorId, "subject"))) return NextResponse.json({ error: "The office is closed for today — come back tomorrow." }, { status: 429 });
    const providedTitle = typeof body.title === "string" ? body.title.trim() : "";
    const mentor = await prisma.mentor.upsert({ where: { id: mentorId }, update: {}, create: { id: mentorId } });
    const title = isDemo ? "Project Management Fundamentals" : providedTitle;
    const imported = isDemo ? { text: "", sources: [] as ImportedSource[] } : await extractSourceDocuments(body.files);
    const learningFocus = typeof body.focus === "string" ? body.focus.trim() : "";
    const promptSourceNotes = [learningFocus ? `LEARNING FOCUS: ${learningFocus}` : "", typeof body.notes === "string" ? body.notes.trim() : "", imported.text].filter(Boolean).join("\n\n");
    const retainedNotes = [learningFocus ? `LEARNING FOCUS: ${learningFocus}` : "", typeof body.notes === "string" ? body.notes.trim() : ""].filter(Boolean).join("\n\n");
    const personality = pickTraits();
    const generationPrompt = `SUBJECT TITLE: ${title}\n\nONBOARDING OBJECTIVE (highest priority):\n${learningFocus || "Create a practical introduction to the subject."}\n\nREFERENCE NOTES AND DOCUMENT EXCERPTS:\n${promptSourceNotes || "No notes provided."}`;
    const trapMap = isDemo ? demoTrapMap as TrapMap : undefined;
    const subject = await prisma.subject.create({
      data: {
        mentorId: mentor.id, title, sourceNotes: retainedNotes || null,
        sourceFiles: imported.sources.length ? imported.sources.map(({ type, characters }) => ({ type, characters })) as unknown as Prisma.InputJsonValue : undefined,
        trapMap: (trapMap ?? {}) as unknown as Prisma.InputJsonValue,
        generationStatus: isDemo ? "ready" : "preparing",
        ...(trapMap ? { learnerState: { create: trapMap.concepts.map((concept) => ({ conceptId: concept.id, status: "not_covered" })) } } : {}),
        hire: { create: { mentorId: mentor.id, name: NAMES[Math.floor(Math.random() * NAMES.length)], personality: personality as unknown as Prisma.InputJsonValue } },
      },
      include: { hire: true },
    });
    let generationStarted = isDemo;
    if (!isDemo) {
      try { await startSubjectGeneration(subject.id, generationPrompt); generationStarted = true; }
      catch (error) {
        const details = error as { name?: unknown; message?: unknown; status?: unknown; code?: unknown };
        console.error("Subject background start failed", {
          name: typeof details?.name === "string" ? details.name : "UnknownError",
          message: typeof details?.message === "string" ? details.message.slice(0, 240) : "No message",
          status: typeof details?.status === "number" ? details.status : undefined,
          code: typeof details?.code === "string" ? details.code : undefined,
        });
        await prisma.subject.update({ where: { id: subject.id }, data: { generationStatus: "failed", generationError: "We could not start preparing this onboarding plan. Try again." } });
        await refundAiActionQuota(mentorId, "subject");
      }
    }
    const firstQuestion = trapMap ? orderedConcepts(trapMap)[0]?.misconceptions[0]?.naive_question : undefined;
    if (!subject.hire) throw new Error("The new hire could not be created.");
    const response = NextResponse.json({ subjectId: subject.id, status: generationStarted ? (isDemo ? "ready" : "preparing") : "failed", hire: { name: subject.hire.name, tier: subject.hire.tier, xp: subject.hire.xp, stats: { comprehension: subject.hire.statComprehension, autonomy: subject.hire.statAutonomy, reflexes: subject.hire.statReflexes, confidence: subject.hire.statConfidence }, personality }, firstQuestion });
    logOperationalEvent(generationStarted ? "subject.created" : "subject.generation_start_failed", { durationMs: Date.now() - startedAt, demo: isDemo });
    return mentorSession.shouldIssueCookie ? issueMentorSession(response, mentorId) : response;
  } catch (error) {
    console.error("Subject creation failed", error);
    logOperationalEvent("subject.failed", { durationMs: Date.now() - startedAt });
    const message = error instanceof Error && /private-session signing secret/i.test(error.message) ? "Private mentoring sessions are unavailable right now. Please return to your onboarding desk and try again."
      : error instanceof Error && /document|supported|larger|read any text|couldn't read|Add up to/i.test(error.message) ? error.message
      : error instanceof Error && /timed out|timeout/i.test(error.message) ? "Creating this onboarding plan took longer than expected. Please try again."
        : "Unable to create this subject.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { subjectId } = await request.json();
    const mentorId = requireMentorId(request);
    if (typeof subjectId !== "string") return NextResponse.json({ error: "subjectId is required." }, { status: 400 });
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, mentorId }, select: { id: true, hire: { select: { id: true } }, sessions: { select: { id: true } } } });
    if (!subject) return NextResponse.json({ error: "Onboarding subject not found." }, { status: 404 });
    const sessionIds = subject.sessions.map((session) => session.id);
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.learningSession.deleteMany({ where: { subjectId } }),
      prisma.conceptState.deleteMany({ where: { subjectId } }),
      prisma.hire.deleteMany({ where: { subjectId } }),
      prisma.subject.delete({ where: { id: subjectId } }),
    ]);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Subject deletion failed", error);
    return NextResponse.json({ error: "Unable to delete this onboarding subject." }, { status: 502 });
  }
}
