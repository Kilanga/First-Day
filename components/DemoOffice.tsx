"use client";

import Link from "next/link";
import { useState } from "react";
import HireCard, { type SkillConcept } from "./HireCard";
import NotebookPanel from "./NotebookPanel";
import demoTrapMap from "@/public/demo/pm-fundamentals.json";

const hire = {
  name: "Sam",
  tier: "month1",
  xp: 86,
  stats: { comprehension: 22, autonomy: 18, reflexes: 13, confidence: 3 },
};

const concepts: SkillConcept[] = demoTrapMap.concepts.map((concept, index) => ({
  id: concept.id,
  name: concept.name,
  status: index < 3 ? "mastered" : index === 3 ? "partial" : "not_covered",
  notebookEntry: index === 0 ? "A deliverable is the thing we make; a milestone is the moment we reach an important point, so it does not take a week by itself." : index === 1 ? "The sponsor has the final call and funds the work, while stakeholders can affect it or be affected by it." : index === 2 ? "A change is not automatically a problem, but we need to check its impact before quietly adding it to the work." : undefined,
}));

const messages = [
  { role: "hire", content: "So the final report is a milestone, right? Since it's a big important thing we have to finish?" },
  { role: "mentor", content: "The final report is a deliverable because it is an output we produce. A milestone is a zero-duration checkpoint, such as the moment the report is approved." },
  { role: "hire", content: "That makes sense now: the report needs work, but approval is the marker in time. I wrote that down so I do not put a week of work on the milestone itself." },
  { role: "mentor", content: "Exactly. The sponsor is the person accountable for the business case and major decisions. Stakeholders are the wider group affected by, or able to influence, the project." },
  { role: "hire", content: "So an operations team can still be a stakeholder even when they are pushing back. The sponsor is not just another person to keep happy - they are where major trade-offs go." },
  { role: "hire", content: "Can I check one more thing? If a client asks for one extra field on a form, we should still look at the impact before slipping it into the plan, right?" },
];

export default function DemoOffice() {
  const [notebookOpen, setNotebookOpen] = useState(false);
  const initials = hire.name.slice(0, 2).toUpperCase();

  return <main className="min-h-screen bg-white text-[#374151]">
    <header className="border-b border-[#F3F4F6] bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day &middot; Demo</p>
          <h1 className="font-display mt-1 text-2xl font-semibold text-[#111827]">Project Management Fundamentals</h1>
        </div>
        <Link href="/" className="button-secondary !px-4 !py-2.5">Back to welcome</Link>
      </div>
    </header>

    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-[#EEF2FF] px-5 py-4 text-sm leading-6 text-indigo-900">
        <span className="font-semibold">A finished office conversation.</span> This read-only preview is separate from your onboarding desk and never changes your own new hire.
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section aria-label="Demo conversation" className="surface-card flex min-h-[620px] flex-col">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <p className="text-sm font-medium text-slate-500">Office conversation</p>
            <p className="mt-1 text-xs text-slate-400">A completed example of a mentor helping a new hire think through a subject.</p>
          </div>
          <div role="log" className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
            {messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === "mentor" ? "justify-end" : "justify-start"}`}>
              {message.role === "hire" ? <div aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div> : null}
              <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${message.role === "mentor" ? "rounded-br-md bg-[#4F46E5] text-white" : "rounded-bl-md border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151]"}`}>{message.content}</div>
            </div>)}
          </div>
          <div className="border-t border-[#F3F4F6] p-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">This demo is read-only. Start your own subject to continue the conversation.</div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Today's office plan</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {concepts.slice(0, 3).map((concept) => <li key={concept.id} className="flex items-center gap-3"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">&#10003;</span>{concept.name}</li>)}
            </ul>
          </section>
          <HireCard hire={hire} concepts={concepts} onOpenFieldNotes={() => setNotebookOpen(true)} />
        </aside>
      </div>
    </div>
    {notebookOpen ? <NotebookPanel name={hire.name} concepts={concepts} onClose={() => setNotebookOpen(false)} /> : null}
  </main>;
}
