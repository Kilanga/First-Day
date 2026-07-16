/**
 * Operational telemetry deliberately excludes prompts, messages, identifiers,
 * document names, and model output. Vercel captures these structured logs.
 */
export function logOperationalEvent(event: string, fields: Record<string, string | number | boolean | undefined> = {}) {
  console.info(JSON.stringify({ event, timestamp: new Date().toISOString(), ...fields }));
}

/**
 * Error objects can carry request bodies, model output, or uploaded file
 * names. Keep production logs useful without writing any of that data.
 */
export function operationalErrorKind(error: unknown) {
  return {
    name: error instanceof Error && error.name ? error.name.slice(0, 80) : "UnknownError",
  };
}
