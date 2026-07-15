import OpenAI from "openai";

const MODEL = "gpt-5.6";
const DEFAULT_TIMEOUT_MS = 45_000;
const SUBJECT_CREATION_TIMEOUT_MS = 90_000;

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
  const response = await getClient().responses.retrieve(responseId, undefined, { timeout: 15_000 });
  return {
    id: response.id,
    status: response.status ?? "failed",
    outputText: backgroundOutputText(response),
    error: response.error?.message,
  };
}

export type ConversationMessage = { role: "user" | "assistant"; content: string };

/** Calls OpenAI for the study partner's plain-text conversational response. */
export async function callText(system: string, messages: ConversationMessage[]): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "system", content: system }, ...messages]
  }, { timeout: timeoutMs() });

  return readContent(completion.choices[0]?.message.content ?? null);
}
