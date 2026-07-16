"use client";

export type HireView = { name: string; tier: string; xp: number; stats: { comprehension: number; autonomy: number; reflexes: number; confidence: number } };
export type SkillConcept = { id: string; name: string; status: string; notebookEntry?: string };
type Props = { hire: HireView; concepts?: SkillConcept[]; progressMoment?: "landed" | "getting-there"; compact?: boolean; breakthrough?: boolean; onOpenFieldNotes?: () => void };

export function rampUpSummary(concepts: Pick<SkillConcept, "status">[]) {
  const total = concepts.length;
  const acquired = concepts.filter((concept) => concept.status === "mastered").length;
  const firstMonthAt = Math.ceil(total / 2);
  const readyForConfirmation = total > 0 && acquired === total;
  const firstMonth = total > 0 && acquired >= firstMonthAt && !readyForConfirmation;
  const tier = readyForConfirmation ? "Ready for confirmation review" : firstMonth ? "First Month" : "Week 1";
  return { total, acquired, firstMonthAt, readyForConfirmation, firstMonth, tier };
}

export function nextRampUpMessage(name: string, concepts: Pick<SkillConcept, "status">[]) {
  const { total, acquired, firstMonthAt, readyForConfirmation, firstMonth } = rampUpSummary(concepts);
  if (!total) return `${name}'s ramp-up will take shape as you cover the first ideas.`;
  if (readyForConfirmation) return `${name} is ready for the confirmation review.`;
  const remaining = (firstMonth ? total : firstMonthAt) - acquired;
  const review = firstMonth ? "confirmation" : "first-month";
  return `${remaining} more idea${remaining === 1 ? "" : "s"} until ${name}'s ${review} review`;
}

function RampUpBar({ concepts, name, compact = false }: { concepts: SkillConcept[]; name: string; compact?: boolean }) {
  const summary = rampUpSummary(concepts);
  const segments = concepts.length ? concepts : [{ id: "empty", name: "Ramp-up", status: "not_covered" }];
  return <div className={`grid gap-1 ${compact ? "mt-1.5" : "mt-3"}`} style={{ gridTemplateColumns: `repeat(${Math.max(summary.total, 1)}, minmax(0, 1fr))` }} aria-label={`${name} has ${summary.acquired} of ${summary.total} ideas down`}>
    {segments.map((concept) => <span key={concept.id} title={concepts.length ? `${concept.name}: ${concept.status === "mastered" ? "Acquired" : concept.status === "not_covered" ? "Not covered" : "In progress"}` : "Ramp-up not started"} className={`h-2 rounded-full transition-all duration-700 ${concept.status === "mastered" ? "bg-emerald-400" : concept.status === "not_covered" ? "bg-[#F3F4F6]" : "bg-amber-300"}`} />)}
  </div>;
}

export default function HireCard({ hire, concepts = [], progressMoment, compact = false, breakthrough = false, onOpenFieldNotes }: Props) {
  const initials = hire.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const rampUp = rampUpSummary(concepts);

  if (compact) return <div className="surface-card flex items-center gap-3 px-4 py-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700">{initials}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-semibold text-slate-900">{hire.name}</p><span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">{rampUp.tier}</span></div><RampUpBar concepts={concepts} name={hire.name} compact /></div></div>;

  return <aside className="surface-card relative p-6">
    {breakthrough ? <div className="progress-float absolute right-6 top-4 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">Breakthrough!</div> : progressMoment === "landed" ? <div className="progress-float absolute right-6 top-4 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">Idea landed ✓</div> : progressMoment === "getting-there" ? <div className="progress-float absolute right-6 top-4 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">Getting there…</div> : null}
    <div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">{initials}</div><div><h2 className="font-display text-2xl font-semibold text-[#111827]">{hire.name}</h2><span className="mt-1 inline-block rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">{rampUp.tier}</span></div></div>
    <section className="mt-7"><div className="flex justify-between gap-3 text-sm"><span className="font-medium text-slate-700">Ramp-up</span><span className="text-right text-slate-500">{rampUp.total ? `${hire.name} has ${rampUp.acquired} of ${rampUp.total} ideas down` : "Ideas are being mapped"}</span></div><RampUpBar concepts={concepts} name={hire.name} /><p className="mt-2 text-xs text-slate-500">{nextRampUpMessage(hire.name, concepts)}</p></section>
    <section className="mt-8"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Concept map</h3><span className="text-xs text-slate-400">Current picture</span></div>{concepts.length ? <div className="space-y-2">{concepts.map((concept) => <div key={concept.id} className="flex items-center gap-3"><span className="min-w-0 flex-1 truncate text-xs text-slate-600">{concept.name}</span><span title={concept.status === "mastered" ? `${concept.name}: ${concept.notebookEntry ?? "Understood"}` : `${concept.name}: ${concept.status === "not_covered" ? "Not explored yet" : "In progress"}`} className={`h-4 w-7 rounded-md border ${concept.status === "mastered" ? "border-emerald-300 bg-emerald-300" : concept.status === "not_covered" ? "border-[#E5E7EB] bg-[#F3F4F6]" : "border-amber-200 bg-amber-200"}`} /></div>)}</div> : <p className="text-xs text-slate-400">Concepts will take shape as your new hire works through them.</p>}</section>
    {onOpenFieldNotes ? <button onClick={onOpenFieldNotes} className="mt-5 w-full rounded-full border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-50">Open {hire.name}&apos;s field notes</button> : null}
  </aside>;
}
