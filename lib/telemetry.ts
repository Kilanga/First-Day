/**
 * Operational telemetry deliberately excludes prompts, messages, identifiers,
 * document names, and model output. Vercel captures these structured logs.
 */
export function logOperationalEvent(event: string, fields: Record<string, string | number | boolean | undefined> = {}) {
  console.info(JSON.stringify({ event, timestamp: new Date().toISOString(), ...fields }));
}
