"use client";

import { nextRampUpMessage, rampUpSummary } from "@/lib/rampUp";
import type { HireView, ProgressMoment, SkillConcept } from "@/lib/officeTypes";

export type { HireView, SkillConcept } from "@/lib/officeTypes";

type Props = {
  hire: HireView;
  concepts?: SkillConcept[];
  progressMoment?: ProgressMoment;
  compact?: boolean;
  breakthrough?: boolean;
  onOpenFieldNotes?: () => void;
};

function conceptStatusLabel(concept: SkillConcept) {
  if (concept.status === "mastered") return "Acquired";
  if (concept.status === "not_covered") return "Not covered";
  return "In progress";
}

function segmentClass(status: string) {
  if (status === "mastered") return "bg-emerald-400";
  if (status === "not_covered") return "bg-[#F3F4F6]";
  return "bg-amber-300";
}

function conceptCellClass(status: string) {
  if (status === "mastered") return "border-emerald-300 bg-emerald-300";
  if (status === "not_covered") return "border-[#E5E7EB] bg-[#F3F4F6]";
  return "border-amber-200 bg-amber-200";
}

function RampUpBar({ concepts, name, compact = false }: { concepts: SkillConcept[]; name: string; compact?: boolean }) {
  const summary = rampUpSummary(concepts);
  const segments = concepts.length ? concepts : [{ id: "empty", name: "Ramp-up", status: "not_covered" }];

  return (
    <div
      aria-label={`${name} has ${summary.acquired} of ${summary.total} ideas down`}
      className={`grid gap-1 ${compact ? "mt-1.5" : "mt-3"}`}
      style={{ gridTemplateColumns: `repeat(${Math.max(summary.total, 1)}, minmax(0, 1fr))` }}
    >
      {segments.map((concept) => (
        <span
          key={concept.id}
          className={`h-2 rounded-full transition-all duration-700 ${segmentClass(concept.status)}`}
          title={concepts.length ? `${concept.name}: ${conceptStatusLabel(concept)}` : "Ramp-up not started"}
        />
      ))}
    </div>
  );
}

function ProgressMoment({ breakthrough, progressMoment }: Pick<Props, "breakthrough" | "progressMoment">) {
  if (breakthrough) return <div className="progress-float absolute right-6 top-4 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">Breakthrough!</div>;
  if (progressMoment === "landed") return <div className="progress-float absolute right-6 top-4 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">Idea landed ✓</div>;
  if (progressMoment === "getting-there") return <div className="progress-float absolute right-6 top-4 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">Getting there…</div>;
  return null;
}

export default function HireCard({
  hire,
  concepts = [],
  progressMoment,
  compact = false,
  breakthrough = false,
  onOpenFieldNotes,
}: Props) {
  const initials = hire.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const rampUp = rampUpSummary(concepts);

  if (compact) {
    return (
      <div className="surface-card flex items-center gap-3 px-4 py-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-slate-900">{hire.name}</p>
            <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold text-[#4F46E5]">{rampUp.tier}</span>
          </div>
          <RampUpBar concepts={concepts} name={hire.name} compact />
        </div>
      </div>
    );
  }

  return (
    <aside className="surface-card relative p-6">
      <ProgressMoment breakthrough={breakthrough} progressMoment={progressMoment} />

      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">{initials}</div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#111827]">{hire.name}</h2>
          <span className="mt-1 inline-block rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">{rampUp.tier}</span>
        </div>
      </div>

      <section className="mt-7">
        <div className="flex justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700">Ramp-up</span>
          <span className="text-right text-slate-500">
            {rampUp.total ? `${hire.name} has ${rampUp.acquired} of ${rampUp.total} ideas down` : "Ideas are being mapped"}
          </span>
        </div>
        <RampUpBar concepts={concepts} name={hire.name} />
        <p className="mt-2 text-xs text-slate-500">{nextRampUpMessage(hire.name, concepts)}</p>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Concept map</h3>
          <span className="text-xs text-slate-500">Current picture</span>
        </div>
        {concepts.length ? (
          <div className="space-y-2">
            {concepts.map((concept) => (
              <div key={concept.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{concept.name}</span>
                <span
                  className={`h-4 w-7 rounded-md border ${conceptCellClass(concept.status)}`}
                  title={concept.status === "mastered" ? `${concept.name}: ${concept.notebookEntry ?? "Understood"}` : `${concept.name}: ${conceptStatusLabel(concept)}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Concepts will take shape as your new hire works through them.</p>
        )}
      </section>

      {onOpenFieldNotes ? (
        <button onClick={onOpenFieldNotes} className="mt-5 w-full rounded-full border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-50">
          Open {hire.name}&apos;s field notes
        </button>
      ) : null}
    </aside>
  );
}
