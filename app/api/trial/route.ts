import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { callJson } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import type { TrapMap } from "@/lib/prompts/trapmap";
import { requireMentorId } from "@/lib/mentorSession";
import { consumeAiActionQuota } from "@/lib/ratelimit";
import { operationalErrorKind } from "@/lib/telemetry";

type TrialQuestion = { conceptId: string; concept: string; question: string };
type TrialAnswer = { conceptId: string; answer: string };

function previousTier(tier: string) { return tier === "confirmed" ? "month1" : tier === "month1" ? "week1" : "week1"; }

export async function POST(request: Request) {
  try {
    const { subjectId } = await request.json();
    const mentorId = requireMentorId(request);
    if (typeof subjectId !== "string") return NextResponse.json({ error: "subjectId is required." }, { status: 400 });
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, mentorId }, include: { hire: true, learnerState: true } });
    if (!subject?.hire) return NextResponse.json({ error: "Subject not found." }, { status: 404 });

    const trapMap = subject.trapMap as unknown as TrapMap;
    const states = subject.learnerState.filter((state) => ["mastered", "partial", "weak"].includes(state.status));
    if (!subject.learnerState.length || subject.learnerState.some((state) => state.status !== "mastered")) return NextResponse.json({ error: "Help your new hire acquire every idea before starting the confirmation review." }, { status: 400 });
    if (!(await consumeAiActionQuota(mentorId, "trial"))) return NextResponse.json({ error: "The office is closed for today — come back tomorrow." }, { status: 429 });
    const stateById = new Map(states.map((state) => [state.conceptId, state.status]));
    const candidates = trapMap.concepts.filter((concept) => stateById.has(concept.id)).sort(() => Math.random() - 0.5).slice(0, Math.min(5, states.length));

    const questions = await callJson<TrialQuestion[]>(
      "You create a short educational knowledge check. Return a JSON object with a questions array. Write 3-5 concise questions that ask the learner to explain or apply each supplied concept. Never mention evaluation, trap maps, or hidden learning states.",
      JSON.stringify({ concepts: candidates.map((concept) => ({ id: concept.id, name: concept.name, core_idea: concept.core_idea })) }),
      '{ "questions": [{ "conceptId": "string", "concept": "string", "question": "string" }] }',
    ).then((value) => (value as unknown as { questions: TrialQuestion[] }).questions);
    if (!Array.isArray(questions) || questions.length < 3 || questions.length > 5 || questions.some((question) => !stateById.has(question.conceptId) || !question.question)) throw new Error("Invalid trial questions.");

    const personality = Array.isArray(subject.hire.personality) ? subject.hire.personality.filter((item): item is string => typeof item === "string").join("; ") : "thoughtful and eager";
    const answerResult = await callJson<{ answers: TrialAnswer[] }>(
      `You are ${subject.hire.name}, a new hire in their first weeks. Answer the supplied questions in character: motivated, polite, and a little hesitant when an idea is new. Personality: ${personality}. Return only JSON. For a mastered concept, answer correctly and concretely. For a partial concept, give a partly correct but incomplete answer. For a weak concept, visibly struggle or give a plausible wrong answer. Never mention tests, scores, concept statuses, evaluation, or AI.`,
      JSON.stringify({ questions, hiddenStatuses: questions.map((question) => ({ conceptId: question.conceptId, status: stateById.get(question.conceptId) })) }),
      '{ "answers": [{ "conceptId": "string", "answer": "string" }] }',
    );
    const answersById = new Map(answerResult.answers.map((answer) => [answer.conceptId, answer.answer]));
    if (questions.some((question) => typeof answersById.get(question.conceptId) !== "string")) throw new Error("Invalid trial answers.");

    const results = questions.map((question) => ({ ...question, answer: answersById.get(question.conceptId)!, correct: stateById.get(question.conceptId) === "mastered" }));
    const score = Math.round((results.filter((result) => result.correct).length / results.length) * 100);
    const passed = score >= 80;
    const failed = results.filter((result) => !result.correct);
    const nextTier = passed ? subject.hire.tier : previousTier(subject.hire.tier);
    if (!passed) await prisma.$transaction([
      prisma.conceptState.updateMany({ where: { subjectId: subject.id, conceptId: { in: failed.map((result) => result.conceptId) } }, data: { status: "weak" } }),
      prisma.hire.update({ where: { id: subject.hire.id }, data: { tier: nextTier } }),
    ]);

    return NextResponse.json({ hireName: subject.hire.name, questions: results, score, passed, failed: failed.map(({ conceptId, concept }) => ({ conceptId, concept })) });
  } catch (error) {
    console.error("Trial failed", operationalErrorKind(error));
    return NextResponse.json({ error: "Unable to run the trial." }, { status: 502 });
  }
}
