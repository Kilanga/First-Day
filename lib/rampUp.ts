export type RampUpConcept = { status: string };

export type RampUpSummary = {
  total: number;
  acquired: number;
  firstMonthAt: number;
  readyForConfirmation: boolean;
  firstMonth: boolean;
  tier: "Week 1" | "First Month" | "Ready for confirmation review";
};

export function rampUpSummary(concepts: RampUpConcept[]): RampUpSummary {
  const total = concepts.length;
  const acquired = concepts.filter((concept) => concept.status === "mastered").length;
  const firstMonthAt = Math.ceil(total / 2);
  const readyForConfirmation = total > 0 && acquired === total;
  const firstMonth = total > 0 && acquired >= firstMonthAt && !readyForConfirmation;
  const tier = readyForConfirmation
    ? "Ready for confirmation review"
    : firstMonth
      ? "First Month"
      : "Week 1";

  return { total, acquired, firstMonthAt, readyForConfirmation, firstMonth, tier };
}

export function nextRampUpMessage(name: string, concepts: RampUpConcept[]) {
  const { total, acquired, firstMonthAt, readyForConfirmation, firstMonth } = rampUpSummary(concepts);

  if (!total) return `${name}'s ramp-up will take shape as you cover the first ideas.`;
  if (readyForConfirmation) return `${name} is ready for the confirmation review.`;

  const remaining = (firstMonth ? total : firstMonthAt) - acquired;
  const review = firstMonth ? "confirmation" : "first-month";
  return `${remaining} more idea${remaining === 1 ? "" : "s"} until ${name}'s ${review} review`;
}
