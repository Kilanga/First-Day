type DemoProgress = { conceptId: string };

/**
 * The two public demos are fixed, browser-only scenarios. This lightweight
 * check lets their visible progress react to a clear explanation without
 * adding a second model call or persisting any visitor data.
 */
export function demoProgressForMessage(conversationId: string, message: string): DemoProgress | null {
  const text = message.toLowerCase();

  if (conversationId === "project-foundations") {
    const identifiesChange = /change request|scope creep|scope change/.test(text);
    const checksImpact = /impact|effort|timeline|cost|budget|risk/.test(text);
    const usesAProcess = /approv|formal|agree|decid/.test(text);
    return identifiesChange && checksImpact && usesAProcess ? { conceptId: "scope-creep" } : null;
  }

  if (conversationId === "number-quest") {
    const comparesTemperatures = /-\s*7/.test(text) && /-\s*3/.test(text) && /colder|cold/.test(text);
    const explainsOrder = /left|smaller|lower|less/.test(text);
    return comparesTemperatures && explainsOrder ? { conceptId: "negative-numbers" } : null;
  }

  return null;
}
