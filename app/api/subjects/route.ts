import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { callJson } from "@/lib/openai";
import { extractSourceDocuments, type ImportedSource } from "@/lib/documentText";
import { assertTrapMap, orderedConcepts, trapMapSchemaHint, trapMapSystemPrompt, type TrapMap } from "@/lib/prompts/trapmap";
import { prisma } from "@/lib/prisma";
import demoTrapMap from "@/public/demo/pm-fundamentals.json";

export const runtime = "nodejs";

const NAMES = ["Sam", "Alex", "Jordan", "Riley", "Casey", "Morgan", "Charlie", "Taylor", "Jamie", "Quinn"];
const TRAITS = ["always taking notes on a battered notepad", "slightly too much coffee", "worried about the probation review", "quotes their professor from time to time", "over-apologizes when confused", "gets visibly excited when something clicks", "keeps a list of 'questions I was afraid to ask'", "compares everything to their student job at a bakery"];
type SubjectInput = { mentorId?: unknown; title?: unknown; notes?: unknown; demo?: unknown; files: File[] };

function pickTraits() { return [...TRAITS].sort(() => Math.random() - 0.5).slice(0, 3); }

async function readInput(request: Request): Promise<SubjectInput> {
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      mentorId: form.get("mentorId"), title: form.get("title"), notes: form.get("notes"), demo: form.get("demo"),
      files: form.getAll("files").filter((value): value is File => value instanceof File),
    };
  }
  const body = await request.json();
  return { ...body, files: [] };
}

export async function POST(request: Request) {
  try {
    const body = await readInput(request);
    const isDemo = body.demo === true || body.demo === "true";
    if (typeof body.mentorId !== "string" || (!isDemo && (typeof body.title !== "string" || !body.title.trim() || body.title.length > 120)) || (body.notes !== undefined && typeof body.notes !== "string")) {
      return NextResponse.json({ error: "A mentor ID and a subject title are required." }, { status: 400 });
    }
    if (typeof body.notes === "string" && body.notes.length > 12_000) return NextResponse.json({ error: "Study notes must be 12,000 characters or shorter." }, { status: 400 });

    const mentorId = body.mentorId as string;
    const providedTitle = typeof body.title === "string" ? body.title.trim() : "";
    const mentor = await prisma.mentor.upsert({ where: { id: mentorId }, update: {}, create: { id: mentorId } });
    const title = isDemo ? "Project Management Fundamentals" : providedTitle;
    const imported = isDemo ? { text: "", sources: [] as ImportedSource[] } : await extractSourceDocuments(body.files);
    const sourceNotes = [typeof body.notes === "string" ? body.notes.trim() : "", imported.text].filter(Boolean).join("\n\n");
    const trapMap = isDemo ? demoTrapMap as TrapMap : await callJson<TrapMap>(
      trapMapSystemPrompt,
      `SUBJECT TITLE: ${title}\n\nSTUDY NOTES AND DOCUMENT EXCERPTS:\n${sourceNotes || "No notes provided."}`,
      trapMapSchemaHint,
    );
    assertTrapMap(trapMap);
    if (trapMap.concepts.length < 5 || trapMap.concepts.length > 8) throw new Error("The trap map must contain 5 to 8 concepts.");

    const personality = pickTraits();
    const subject = await prisma.subject.create({
      data: {
        mentorId: mentor.id, title, sourceNotes: sourceNotes || null,
        sourceFiles: imported.sources.length ? imported.sources as unknown as Prisma.InputJsonValue : undefined,
        trapMap: trapMap as unknown as Prisma.InputJsonValue,
        learnerState: { create: trapMap.concepts.map((concept) => ({ conceptId: concept.id, status: "not_covered" })) },
        hire: { create: { mentorId: mentor.id, name: NAMES[Math.floor(Math.random() * NAMES.length)], personality: personality as unknown as Prisma.InputJsonValue } },
      },
      include: { hire: true },
    });
    const firstQuestion = orderedConcepts(trapMap)[0]?.misconceptions[0]?.naive_question;
    if (!subject.hire || !firstQuestion) throw new Error("The trap map has no initial question.");
    return NextResponse.json({ subjectId: subject.id, hire: { name: subject.hire.name, tier: subject.hire.tier, xp: subject.hire.xp, stats: { comprehension: subject.hire.statComprehension, autonomy: subject.hire.statAutonomy, reflexes: subject.hire.statReflexes, confidence: subject.hire.statConfidence }, personality }, firstQuestion });
  } catch (error) {
    console.error("Subject creation failed", error);
    const message = error instanceof Error && /document|supported|larger|read any text|Add up to/i.test(error.message) ? error.message : "Unable to create this subject.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
