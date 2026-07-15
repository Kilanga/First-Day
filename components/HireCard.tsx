"use client";

export type HireView = {
  name: string;
  tier: string;
  xp: number;
  stats: { comprehension: number; autonomy: number; reflexes: number; confidence: number };
};

type Props = { hire: HireView; xpFloat?: number; compact?: boolean };

const TIER_LABELS: Record<string, string> = { week1: "Week 1", month1: "First Month", confirmed: "Confirmed" };
const STAT_LABELS = { comprehension: "Comprehension", autonomy: "Autonomy", reflexes: "Reflexes", confidence: "Confidence" };

function nextTierXp(tier: string) {
  return tier === "week1" ? 51 : tier === "month1" ? 151 : 151;
}

function tierStartXp(tier: string) {
  return tier === "month1" ? 51 : tier === "confirmed" ? 151 : 0;
}

export function tierLabel(tier: string) {
  return TIER_LABELS[tier] ?? "Week 1";
}

export default function HireCard({ hire, xpFloat, compact = false }: Props) {
  const initials = hire.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const target = nextTierXp(hire.tier);
  const start = tierStartXp(hire.tier);
  const progress = hire.tier === "confirmed" ? 100 : Math.min(100, ((hire.xp - start) / (target - start)) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white px-4 py-3 shadow-sm">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 font-semibold text-indigo-700">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold text-slate-900">{hire.name}</p><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">{tierLabel(hire.tier)}</span></div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
    );
  }

  return (
    <aside className="relative rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      {xpFloat ? <div className="xp-float absolute right-6 top-4 font-bold text-indigo-600">+{xpFloat} XP</div> : null}
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700">{initials}</div>
        <div><h2 className="font-semibold text-slate-900">{hire.name}</h2><span className="mt-1 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{tierLabel(hire.tier)}</span></div>
      </div>
      <section className="mt-7">
        <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-700">Growth</span><span className="text-slate-500">{hire.xp} XP{hire.tier === "confirmed" ? "" : ` / ${target}`}</span></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} /></div>
      </section>
      <section className="mt-8 space-y-4">
        {Object.entries(hire.stats).map(([key, value]) => <div key={key}>
          <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-slate-600">{STAT_LABELS[key as keyof typeof STAT_LABELS]}</span><span className="text-slate-400">{value}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-400 transition-all duration-700" style={{ width: `${Math.min(100, value * 3.34)}%` }} /></div>
        </div>)}
      </section>
    </aside>
  );
}
