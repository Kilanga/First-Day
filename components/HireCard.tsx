"use client";

export type HireView = { name: string; tier: string; xp: number; stats: { comprehension: number; autonomy: number; reflexes: number; confidence: number } };
export type SkillConcept = { id: string; name: string; status: string; notebookEntry?: string };
type Props = { hire: HireView; concepts?: SkillConcept[]; xpFloat?: number; compact?: boolean; breakthrough?: boolean; onOpenFieldNotes?: () => void };

const TIER_LABELS: Record<string, string> = { week1: "Explorer", month1: "Builder", confirmed: "Guide" };
const STAT_LABELS = { comprehension: "Comprehension", autonomy: "Autonomy", reflexes: "Reflexes", confidence: "Confidence" };
function nextTierXp(tier: string) { return tier === "week1" ? 51 : tier === "month1" ? 151 : 151; }
function tierStartXp(tier: string) { return tier === "month1" ? 51 : tier === "confirmed" ? 151 : 0; }
export function tierLabel(tier: string) { return TIER_LABELS[tier] ?? "Explorer"; }

export default function HireCard({ hire, concepts = [], xpFloat, compact = false, breakthrough = false, onOpenFieldNotes }: Props) {
  const initials = hire.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const target = nextTierXp(hire.tier);
  const start = tierStartXp(hire.tier);
  const progress = hire.tier === "confirmed" ? 100 : Math.min(100, ((hire.xp - start) / (target - start)) * 100);
  const nextTier = hire.tier === "week1" ? "Builder" : hire.tier === "month1" ? "Guide" : null;
  const remaining = Math.max(0, target - hire.xp);

  if (compact) return <div className="surface-card flex items-center gap-3 px-4 py-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700">{initials}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-semibold text-slate-900">{hire.name}</p><span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">{tierLabel(hire.tier)}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F3F4F6]"><div className="h-full rounded-full bg-[#4F46E5] transition-all duration-700" style={{ width: `${progress}%` }} /></div></div></div>;

  return <aside className="surface-card relative p-6">
    {breakthrough ? <div className="xp-float absolute right-6 top-4 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">Breakthrough!</div> : xpFloat ? <div className="xp-float absolute right-6 top-4 font-bold text-indigo-600">+{xpFloat} XP</div> : null}
    <div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">{initials}</div><div><h2 className="font-display text-2xl font-semibold text-[#111827]">{hire.name}</h2><span className="mt-1 inline-block rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">{tierLabel(hire.tier)}</span></div></div>
    <section className="mt-7"><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-700">Onboarding progress</span><span className="text-slate-500">{hire.xp} points{hire.tier === "confirmed" ? "" : ` / ${target}`}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#F3F4F6]"><div className="h-full rounded-full bg-[#4F46E5] transition-all duration-700 ease-out" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-slate-500">{nextTier ? `${remaining} points until ${nextTier}` : "Ready to help a colleague learn"}</p><p className="mt-1 text-xs text-slate-400">Explorer: 0–50 · Builder: 51–150 · Guide: 151+</p></section>
    <section className="mt-8"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Concept map</h3><span className="text-xs text-slate-400">Current picture</span></div>{concepts.length ? <div className="space-y-2">{concepts.map((concept) => <div key={concept.id} className="flex items-center gap-3"><span className="min-w-0 flex-1 truncate text-xs text-slate-600">{concept.name}</span><span title={concept.status === "mastered" ? `${concept.name}: ${concept.notebookEntry ?? "Understood"}` : `${concept.name}: ${concept.status === "not_covered" ? "Not explored yet" : "In progress"}`} className={`h-4 w-7 rounded-md border ${concept.status === "mastered" ? "border-emerald-300 bg-emerald-300" : concept.status === "not_covered" ? "border-[#E5E7EB] bg-[#F3F4F6]" : "border-amber-200 bg-amber-200"}`} /></div>)}</div> : <p className="text-xs text-slate-400">Concepts will take shape as your new hire works through them.</p>}<p className="mt-4 text-xs text-slate-400">Teaching signals: {Object.entries(hire.stats).map(([key, value]) => `${STAT_LABELS[key as keyof typeof STAT_LABELS]} ${value}`).join(" · ")}</p></section>
    {onOpenFieldNotes ? <button onClick={onOpenFieldNotes} className="mt-5 w-full rounded-full border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-50">Open {hire.name}&apos;s field notes</button> : null}
  </aside>;
}
