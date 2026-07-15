import OpenAI from "openai";

const MODEL = "gpt-5.6";

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
export async function callJson<T>(system: string, user: string, schemaHint: string): Promise<T> {
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
    });

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

export type ConversationMessage = { role: "user" | "assistant"; content: string };

/** Calls OpenAI for the new hire's plain-text conversational response. */
export async function callText(system: string, messages: ConversationMessage[]): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "system", content: system }, ...messages]
  });

  return readContent(completion.choices[0]?.message.content ?? null);
}
