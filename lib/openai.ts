import OpenAI from "openai";

const MODEL = "gpt-5.6";
const DEFAULT_TIMEOUT_MS = 45_000;
const SUBJECT_CREATION_TIMEOUT_MS = 90_000;
const mockBackgroundResponses = new Map<string, string>();

function mockEnabled() {
  return process.env.OPENAI_MOCK_MODE?.trim().toLowerCase() === "true";
}

function mockTrapMap(user: string) {
  const title = user.match(/SUBJECT:\s*(.+)/i)?.[1]?.trim() || "Your subject";
  const ideas = [
    ["foundation", "The core idea", "the basic principle that makes the rest of the topic work"],
    ["components", "Key parts", "the pieces involved and how they relate"],
    ["process", "How it works", "the sequence that turns the idea into a result"],
    ["tradeoffs", "Useful trade-offs", "when the approach helps and where its limits are"],
    ["application", "Putting it into practice", "a concrete way to apply the idea"],
  ];
  return {
    subject: title,
    concepts: ideas.map(([id, name, core_idea], index) => ({ id, name, core_idea, depends_on: index ? [ideas[index - 1][0]] : [], misconceptions: [{ id: `${id}-mixup`, wrong_belief: `The ${name.toLowerCase()} can be handled without the earlier idea.`, naive_question: `Sorry, but can I use ${name.toLowerCase()} before I understand the earlier part?`, why_it_matters: "It can cause a practical misunderstanding later." }] })),
  };
}

function mockJson(system: string, user: string, schemaHint: string): unknown {
  if (schemaHint.includes('"concepts"')) return mockTrapMap(user);
  if (schemaHint.includes('"verdict"')) {
    const conceptId = system.match(/"id":"([^"]+)"/)?.[1] ?? "foundation";
    const message = user.match(/MENTOR MESSAGE:\s*([\s\S]*?)(?:\n\nCONVERSATION|$)/)?.[1]?.trim() ?? "";
    const nonExplanation = /^(hi|hello|thanks|thank you|i don't know)[.!]?$/i.test(message);
    return nonExplanation
      ? { concept_id: conceptId, verdict: "n/a", scores: { accuracy: 0, completeness: 0, clarity: 0, example: 0 }, missing_piece: "", note_for_report: "" }
      : { concept_id: conceptId, verdict: "pass", scores: { accuracy: 3, completeness: 3, clarity: 3, example: 2 }, missing_piece: "", note_for_report: "The explanation was clear, concrete, and gave the colleague a solid foundation." };
  }
  if (schemaHint.includes('"questions"')) {
    const concepts = ((JSON.parse(user) as { concepts?: Array<{ id: string; name: string }> }).concepts ?? []).slice(0, 5);
    return { questions: concepts.map((concept) => ({ conceptId: concept.id, concept: concept.name, question: `How would you explain ${concept.name} to a new colleague?` })) };
  }
  if (schemaHint.includes('"answers"')) {
    const input = JSON.parse(user) as { questions?: Array<{ conceptId: string; concept: string }>; hiddenStatuses?: Array<{ conceptId: string; status: string }> };
    const statuses = new Map((input.hiddenStatuses ?? []).map((item) => [item.conceptId, item.status]));
    return { answers: (input.questions ?? []).map((question) => ({ conceptId: question.conceptId, answer: statuses.get(question.conceptId) === "mastered" ? `I would explain ${question.concept} with the key idea and a practical example.` : `I am still unsure about ${question.concept}; I need to ask about it again.` })) };
  }
  if (schemaHint.includes('"strengths"')) return { strengths: ["You gave your colleague a clear foundation and a useful example."], gaps: [{ concept: "Next useful detail", whatWasMissing: "One practical edge case could make the explanation even stronger.", tryNextTime: "Add a short example of when the rule changes." }], suggestedNextSession: "Start with one quick recap, then apply the idea to a concrete case.", language: "English" };
  throw new OpenAIJsonError("No local mock is available for this JSON schema.");
}

function timeoutMs() {
  const configured = Number(process.env.OPENAI_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 5_000 && configured <= 120_000 ? configured : DEFAULT_TIMEOUT_MS;
}

function boundedTimeout(value: number | undefined) {
  if (typeof value !== "number") return timeoutMs();
  return Number.isFinite(value) && value >= 5_000 && value <= 120_000 ? value : timeoutMs();
}

export class OpenAIJsonError extends Error {
  readonly code = "MALFORMED_JSON";

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "OpenAIJsonError";
  }
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new OpenAIJsonError("OPENAI_API_KEY is not configured.");
  return new OpenAI({ apiKey });
}

function readContent(content: string | null): string {
  if (!content) throw new OpenAIJsonError("OpenAI returned an empty response.");
  return content;
}

/** Calls OpenAI for a JSON object and retries once if the response is malformed. */
export async function callJson<T>(system: string, user: string, schemaHint: string, options?: { timeoutMs?: number }): Promise<T> {
  if (mockEnabled()) return mockJson(system, user, schemaHint) as T;
  const client = getClient();
  let lastError: unknown;
  let retryMessage = user;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const completion = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${system}\n\nReturn one valid JSON object only. Schema guidance: ${schemaHint}` },
        { role: "user", content: retryMessage }
      ]
    }, { timeout: boundedTimeout(options?.timeoutMs) });

    const content = readContent(completion.choices[0]?.message.content ?? null);
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      lastError = error;
      retryMessage = `${user}\n\nYour previous response was not valid JSON. Return only a JSON object matching this schema guidance: ${schemaHint}`;
    }
  }

  throw new OpenAIJsonError("OpenAI returned malformed JSON after one retry.", lastError);
}

/** Subject mapping is a larger one-off response, so it may take longer than chat. */
export const subjectCreationTimeoutMs = SUBJECT_CREATION_TIMEOUT_MS;

export type BackgroundJsonResponse = { id: string; status: string; outputText: string; error?: string };

function backgroundOutputText(value: unknown) {
  const output = (value as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";
  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      const text = (part as { type?: unknown; text?: unknown }).text;
      if ((part as { type?: unknown }).type === "output_text" && typeof text === "string") return text;
    }
  }
  return "";
}

/** Starts a durable Responses API job. Poll it with getBackgroundJsonResponse. */
export async function startBackgroundJson(system: string, user: string, schemaHint: string) {
  if (mockEnabled()) {
    const id = `mock_${crypto.randomUUID()}`;
    mockBackgroundResponses.set(id, JSON.stringify(mockJson(system, user, schemaHint)));
    return { id, status: "completed" };
  }
  const response = await getClient().responses.create({
    model: MODEL,
    background: true,
    instructions: `${system}\n\nReturn one valid JSON object only. Schema guidance: ${schemaHint}`,
    // The Responses API requires the input itself to explicitly mention JSON
    // when json_object mode is selected; instructions alone do not satisfy it.
    input: `${user}\n\nReturn JSON only.`,
    text: { format: { type: "json_object" } },
  }, { timeout: 15_000 });
  return { id: response.id, status: response.status ?? "queued" };
}

export async function getBackgroundJsonResponse(responseId: string): Promise<BackgroundJsonResponse> {
  if (mockEnabled()) {
    const outputText = mockBackgroundResponses.get(responseId);
    return outputText ? { id: responseId, status: "completed", outputText } : { id: responseId, status: "failed", outputText: "", error: "Mock response not found." };
  }
  const response = await getClient().responses.retrieve(responseId, undefined, { timeout: 15_000 });
  return {
    id: response.id,
    status: response.status ?? "failed",
    outputText: backgroundOutputText(response),
    error: response.error?.message,
  };
}

export type ConversationMessage = { role: "user" | "assistant"; content: string };

/** Calls OpenAI for the learner's plain-text conversational response. */
export async function callText(system: string, messages: ConversationMessage[]): Promise<string> {
  if (mockEnabled()) {
    if (/warm memory/i.test(system)) return "I finally saw how the example fits the idea, and I wrote it down to revisit later.";
    if (/reflection/i.test(system)) return "Your concrete examples helped me connect the dots. A short recap before the next topic would help me feel ready for the probation review.";
    return "That finally clicked for me. Could we walk through one concrete example together so I can use it on my own?";
  }
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "system", content: system }, ...messages]
  }, { timeout: timeoutMs() });

  return readContent(completion.choices[0]?.message.content ?? null);
}
