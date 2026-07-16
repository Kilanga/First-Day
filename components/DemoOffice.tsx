"use client";

import Link from "next/link";
import { useState } from "react";
import HireCard, { type HireView, type SkillConcept } from "./HireCard";
import NotebookPanel from "./NotebookPanel";
import demoTrapMap from "@/public/demo/pm-fundamentals.json";

type DemoMessage = { role: "mentor" | "hire"; content: string };
type DemoConversation = {
  id: string;
  label: string;
  title: string;
  description: string;
  hire: HireView;
  concepts: SkillConcept[];
  agenda: Array<{ name: string; complete: boolean }>;
  messages: DemoMessage[];
};

const projectConcepts: SkillConcept[] = demoTrapMap.concepts.map((concept, index) => ({
  id: concept.id,
  name: concept.name,
  status: index < 2 ? "mastered" : index === 2 ? "partial" : "not_covered",
  notebookEntry: index === 0
    ? "A deliverable is the thing we make; a milestone is the moment we reach an important point, so it does not take a week by itself."
    : index === 1
      ? "The sponsor has the final call and funds the work, while stakeholders can affect it or be affected by it."
      : undefined,
}));

const mathsConcepts: SkillConcept[] = [
  { id: "number-line", name: "The Number Line", status: "mastered", notebookEntry: "Zero is the starting point. Numbers to the right are bigger and numbers to the left are smaller, even when the left ones look a bit grumpy." },
  { id: "equivalent-fractions", name: "Equivalent Fractions", status: "mastered", notebookEntry: "One half can look like two quarters because the pieces change size and number together, but the amount of pizza stays the same." },
  { id: "negative-numbers", name: "Negative Numbers", status: "partial" },
  { id: "order-of-operations", name: "Order of Operations", status: "not_covered" },
  { id: "word-problems", name: "Turning Stories into Maths", status: "not_covered" },
];

const conversations: DemoConversation[] = [
  {
    id: "project-foundations",
    label: "Project foundations",
    title: "Project Management Fundamentals",
    description: "A new hire learns to separate the work from the checkpoints around it.",
    hire: { name: "Sam", tier: "month1", xp: 58, stats: { comprehension: 14, autonomy: 11, reflexes: 8, confidence: 1 } },
    concepts: projectConcepts,
    agenda: [
      { name: "Milestones vs Deliverables", complete: true },
      { name: "Stakeholders vs the Sponsor", complete: true },
      { name: "Scope Creep", complete: false },
    ],
    messages: [
      { role: "hire", content: "So the final report is a milestone, right? Since it's a big important thing we have to finish?" },
      { role: "mentor", content: "The final report is a deliverable because it is an output we produce. A milestone is a zero-duration checkpoint, such as the moment the report is approved." },
      { role: "hire", content: "That makes sense now: the report needs work, but approval is the marker in time. I wrote that down so I do not put a week of work on the milestone itself." },
      { role: "mentor", content: "Exactly. The sponsor is the person accountable for the business case and major decisions. Stakeholders are the wider group affected by, or able to influence, the project." },
      { role: "hire", content: "So an operations team can still be a stakeholder even when they are pushing back. The sponsor is not just another person to keep happy - they are where major trade-offs go." },
      { role: "hire", content: "Can I check one more thing? If a client asks for one extra field on a form, we should still look at the impact before slipping it into the plan, right?" },
    ],
  },
  {
    id: "number-quest",
    label: "Number Quest Club",
    title: "A Playful Maths Onboarding",
    description: "A junior helper gets ready for their first afternoon at the Number Quest Club.",
    hire: { name: "Milo", tier: "week1", xp: 36, stats: { comprehension: 10, autonomy: 7, reflexes: 9, confidence: 2 } },
    concepts: mathsConcepts,
    agenda: [
      { name: "The Number Line", complete: true },
      { name: "Equivalent Fractions", complete: true },
      { name: "Negative Numbers", complete: false },
    ],
    messages: [
      { role: "hire", content: "For the Number Quest Club, if -3 is three steps left of zero, is zero just the lobby where nobody has picked a direction yet?" },
      { role: "mentor", content: "That is a useful picture. Zero is the reference point: numbers to the right are greater and numbers to the left are smaller. Negative does not mean bad; it only tells us which side of zero we are on." },
      { role: "hire", content: "Okay, so -3 is not a sad 3. It is just three steps on the other side of the lobby. I think the kids will like that." },
      { role: "hire", content: "And can one half really be the same as two quarters? It sounds like the pizza is trying to do a magic trick." },
      { role: "mentor", content: "It is the same amount when we split the same whole into smaller equal pieces. Two quarters cover the same half of one pizza, so the fractions are equivalent even though the numbers look different." },
      { role: "hire", content: "Right - the number of slices changes, but not the amount of pizza. I am still a little wobbly when the number line crosses below zero, though." },
    ],
  },
];

export default function DemoOffice() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const conversation = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const initials = conversation.hire.name.slice(0, 2).toUpperCase();

  return <main className="min-h-screen bg-white text-[#374151]">
    <header className="border-b border-[#F3F4F6] bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day &middot; Demo</p>
          <h1 className="font-display mt-1 text-2xl font-semibold text-[#111827]">{conversation.title}</h1>
        </div>
        <Link href="/" className="button-secondary !px-4 !py-2.5">Back to welcome</Link>
      </div>
      <nav aria-label="Demo conversations" className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 pb-4 sm:px-8">
        {conversations.map((item) => <button key={item.id} onClick={() => { setActiveId(item.id); setNotebookOpen(false); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${item.id === conversation.id ? "bg-[#4F46E5] text-white" : "bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100"}`}>{item.label}</button>)}
      </nav>
    </header>

    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-[#EEF2FF] px-5 py-4 text-sm leading-6 text-indigo-900">
        <span className="font-semibold">A finished office conversation.</span> {conversation.description} This read-only preview is separate from your onboarding desk and never changes your own new hire.
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section aria-label="Demo conversation" className="surface-card flex min-h-[620px] flex-col">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <p className="text-sm font-medium text-slate-500">Office conversation</p>
            <p className="mt-1 text-xs text-slate-400">A completed example of a mentor helping a new hire think through a subject.</p>
          </div>
          <div role="log" className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
            {conversation.messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === "mentor" ? "justify-end" : "justify-start"}`}>
              {message.role === "hire" ? <div aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div> : null}
              <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${message.role === "mentor" ? "rounded-br-md bg-[#4F46E5] text-white" : "rounded-bl-md border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151]"}`}>{message.content}</div>
            </div>)}
          </div>
          <div className="border-t border-[#F3F4F6] p-4"><div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">This demo is read-only. Start your own subject to continue the conversation.</div></div>
        </section>

        <aside className="space-y-6">
          <section className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Today's office plan</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {conversation.agenda.map((item) => <li key={item.name} className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center rounded-full text-xs font-bold ${item.complete ? "bg-emerald-100 text-emerald-700" : "border border-amber-300 bg-amber-50 text-amber-700"}`}>{item.complete ? "✓" : ""}</span>{item.name}</li>)}
            </ul>
          </section>
          <HireCard hire={conversation.hire} concepts={conversation.concepts} onOpenFieldNotes={() => setNotebookOpen(true)} />
        </aside>
      </div>
    </div>
    {notebookOpen ? <NotebookPanel name={conversation.hire.name} concepts={conversation.concepts} onClose={() => setNotebookOpen(false)} /> : null}
  </main>;
}
