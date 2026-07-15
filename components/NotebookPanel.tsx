"use client";

export type NotebookConcept = { id: string; name: string; status: string; notebookEntry?: string };

export default function NotebookPanel({ name, concepts, onClose }: { name: string; concepts: NotebookConcept[]; onClose: () => void }) {
  const entries = concepts.filter((concept) => concept.status !== "not_covered");
  return <div className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${name}'s notebook`}>
    <aside className="ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#fffdf6] p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{name}&apos;s notebook</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Notes from the desk</h2></div><button onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-amber-50">Close</button></div>
      {entries.length === 0 ? <p className="mt-16 rounded-2xl border border-dashed border-amber-200 bg-white/70 p-6 text-center text-sm leading-6 text-slate-500">{name}&apos;s notebook is waiting for its first entry.</p> : <div className="mt-8 space-y-4">{entries.map((concept) => concept.status === "mastered" ? <article key={concept.id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"><p className="font-semibold text-slate-900">{concept.name}</p><p className="mt-3 text-sm leading-6 text-slate-600">“{concept.notebookEntry ?? "I wrote this down, but I want to put it into my own words again."}”</p></article> : <article key={concept.id} className="rotate-[-1deg] rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-5"><p className="font-semibold text-slate-700 line-through decoration-amber-400 decoration-2">{concept.name}</p><p className="mt-2 font-mono text-sm text-amber-800/80">something about this... ask again??</p></article>)}</div>}
    </aside>
  </div>;
}
