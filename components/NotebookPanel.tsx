"use client";

import type { SkillConcept } from "@/lib/officeTypes";

type NotebookEntry = {
  label: string;
  text: string;
  className: string;
};

function entryFor(concept: SkillConcept): NotebookEntry {
  if (concept.status === "mastered") {
    return {
      label: "Written in my own words",
      text: concept.notebookEntry ?? "I wrote this down, but I want to put it into my own words again.",
      className: "border-amber-200 bg-white shadow-sm",
    };
  }

  if (concept.status === "partial" || concept.status === "weak") {
    return {
      label: "Still working through this",
      text: "Something about this... I need to ask about it again.",
      className: "rotate-[-1deg] border-dashed border-amber-300 bg-amber-50/70",
    };
  }

  return {
    label: "A question for later",
    text: "I have not reached this one yet. I will come back to it after the earlier ideas.",
    className: "border-dashed border-slate-200 bg-white/55",
  };
}

function NotebookCard({ concept }: { concept: SkillConcept }) {
  const entry = entryFor(concept);
  const isAcquired = concept.status === "mastered";
  const isInProgress = concept.status === "partial" || concept.status === "weak";
  const badgeClass = isAcquired
    ? "bg-emerald-100 text-emerald-800"
    : isInProgress
      ? "bg-amber-100 text-amber-800"
      : "bg-slate-100 text-slate-500";

  return (
    <article className={`rounded-2xl border p-5 ${entry.className}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="font-semibold text-slate-900">{concept.name}</p>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}>
          {entry.label}
        </span>
      </div>
      <p className={`mt-3 text-sm leading-6 ${isAcquired ? "text-slate-600" : "font-mono text-amber-800/80"}`}>
        {isAcquired ? `“${entry.text}”` : entry.text}
      </p>
    </article>
  );
}

type NotebookPanelProps = {
  name: string;
  concepts: SkillConcept[];
  onClose: () => void;
};

export default function NotebookPanel({ name, concepts, onClose }: NotebookPanelProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name}'s field notes`}
      className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-sm"
    >
      <aside className="ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{name}&apos;s field notes</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-[#111827]">What is taking shape</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Each page follows one idea in {name}&apos;s onboarding journey.</p>
          </div>
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-amber-50">
            Close
          </button>
        </div>

        {concepts.length === 0 ? (
          <p className="mt-16 rounded-2xl border border-dashed border-amber-200 bg-white/70 p-6 text-center text-sm leading-6 text-slate-500">
            {name}&apos;s field notes are waiting for their first topic.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {concepts.map((concept) => <NotebookCard key={concept.id} concept={concept} />)}
          </div>
        )}
      </aside>
    </div>
  );
}
