import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { callJson } from "@/lib/openai";
import { assertTrapMap, orderedConcepts, trapMapSchemaHint, trapMapSystemPrompt, type TrapMap } from "@/lib/prompts/trapmap";
import { prisma } from "@/lib/prisma";
import demoTrapMap from "@/public/demo/pm-fundamentals.json";

const NAMES = ["Sam", "Alex", "Jordan", "Riley", "Casey", "Morgan", "Charlie", "Taylor", "Jamie", "Quinn"];
const TRAITS = [
  "always taking notes on a battered notepad",
  "slightly too much coffee",
  "worried about the probation review",
  "quotes their professor from time to time",
  "over-apologizes when confused",
  "gets visibly excited when something clicks",
  "keeps a list of 'questions I was afraid to ask'",
  "compares everything to their student job at a bakery",
];

function pickTraits() {
  return [...TRAITS].sort(() => Math.random() - 0.5).slice(0, 3);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const isDemo = body?.demo === true;
    if (!body || typeof body.mentorId !== "string" || (!isDemo && (typeof body.title !== "string" || !body.title.trim() || body.title.length > 120)) ||
      (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 12000))) {
      return NextResponse.json({ error: "mentorId and title are required." }, { status: 400 });
    }

    const mentor = await prisma.mentor.upsert({
      where: { id: body.mentorId },
      update: {},
      create: { id: body.mentorId },
    });
    const title = isDemo ? "Project Management Fundamentals" : body.title.trim();
    const trapMap = isDemo ? demoTrapMap as TrapMap : await callJson<TrapMap>(
      trapMapSystemPrompt,
      `SUBJECT TITLE: ${title}\n\nSTUDY NOTES:\n${body.notes?.trim() || "No notes provided."}`,
      trapMapSchemaHint,
    );
    assertTrapMap(trapMap);
    if (trapMap.concepts.length < 5 || trapMap.concepts.length > 8) {
      throw new Error("The trap map must contain 5 to 8 concepts.");
    }

    const personality = pickTraits();
    const subject = await prisma.subject.create({
      data: {
        mentorId: mentor.id,
        title,
        sourceNotes: body.notes?.trim() || null,
        trapMap: trapMap as unknown as Prisma.InputJsonValue,
        learnerState: { create: trapMap.concepts.map((concept) => ({ conceptId: concept.id, status: "not_covered" })) },
        hire: { create: { mentorId: mentor.id, name: NAMES[Math.floor(Math.random() * NAMES.length)], personality: personality as unknown as Prisma.InputJsonValue } },
      },
      include: { hire: true },
    });
    const firstConcept = orderedConcepts(trapMap)[0];
    const firstQuestion = firstConcept?.misconceptions[0]?.naive_question;
    if (!subject.hire || !firstQuestion) throw new Error("The trap map has no initial question.");

    return NextResponse.json({
      subjectId: subject.id,
      hire: {
        name: subject.hire.name,
        tier: subject.hire.tier,
        xp: subject.hire.xp,
        stats: {
          comprehension: subject.hire.statComprehension,
          autonomy: subject.hire.statAutonomy,
          reflexes: subject.hire.statReflexes,
          confidence: subject.hire.statConfidence,
        },
        personality,
      },
      firstQuestion,
    });
  } catch (error) {
    console.error("Subject creation failed", error);
    return NextResponse.json({ error: "Unable to create this subject." }, { status: 502 });
  }
}
