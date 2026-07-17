"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import GapReport, { type Report } from "./GapReport";
import HireCard from "./HireCard";
import FocusDialog from "./FocusDialog";
import type { HireView, SkillConcept } from "@/lib/officeTypes";
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
  agenda: Array<{ id: string; name: string; complete: boolean }>;
  messages: DemoMessage[];
  tryThis: string;
  completion: { conceptId: string; notebookEntry: string };
  report: Report;
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
    hire: { name: "Sam" },
    concepts: projectConcepts,
    agenda: [
      { id: "milestone-vs-deliverable", name: "Milestones vs Deliverables", complete: true },
      { id: "stakeholder-vs-sponsor", name: "Stakeholders vs the Sponsor", complete: true },
      { id: "scope-creep", name: "Scope Creep", complete: false },
    ],
    messages: [
      { role: "hire", content: "So the final report is a milestone, right? Since it's a big important thing we have to finish?" },
      { role: "mentor", content: "The final report is a deliverable because it is an output we produce. A milestone is a zero-duration checkpoint, such as the moment the report is approved." },
      { role: "hire", content: "That makes sense now: the report needs work, but approval is the marker in time. Before I invite people to the review, is the sponsor just another stakeholder, or do they have a different job?" },
      { role: "mentor", content: "The sponsor is accountable for the business case and major decisions. Stakeholders are the wider group affected by, or able to influence, the project." },
      { role: "hire", content: "So an operations team can still be a stakeholder when they push back, while the sponsor is where major trade-offs go. If a client asks for one extra field on a form, do we still need to check its impact before adding it?" },
    ],
    tryThis: "Yes. Treat it as a change request: check the effect on effort, timeline, cost, and risk before deciding whether to approve it. It becomes scope creep when we add it informally without managing that impact.",
    completion: { conceptId: "scope-creep", notebookEntry: "A change is not automatically a problem. We check its impact and agree it properly, instead of quietly adding it to the plan." },
    report: {
      strengths: [
        "You made the difference between a deliverable and a milestone concrete by separating the report from its approval point.",
        "Your explanation of sponsors and stakeholders gave Sam a practical way to think about who makes decisions and who is affected.",
      ],
      gaps: [{ concept: "Scope Creep", whatWasMissing: "The final question about a client request is still open, so Sam has not yet practised deciding what to do with a change.", tryNextTime: "Walk through one small change request: pause, check its impact, then decide how it enters the plan." }],
      suggestedNextSession: "Start with Sam's question about the extra field, then compare a planned change with scope creep.",
    },
  },
  {
    id: "number-quest",
    label: "Number Quest Club",
    title: "A Playful Maths Onboarding",
    description: "A junior helper gets ready for their first afternoon at the Number Quest Club.",
    hire: { name: "Milo" },
    concepts: mathsConcepts,
    agenda: [
      { id: "number-line", name: "The Number Line", complete: true },
      { id: "equivalent-fractions", name: "Equivalent Fractions", complete: true },
      { id: "negative-numbers", name: "Negative Numbers", complete: false },
    ],
    messages: [
      { role: "hire", content: "For the Number Quest Club, if -3 is three steps left of zero, is zero just the lobby where nobody has picked a direction yet?" },
      { role: "mentor", content: "That is a useful picture. Zero is the reference point: numbers to the right are greater and numbers to the left are smaller. Negative does not mean bad; it only tells us which side of zero we are on." },
      { role: "hire", content: "Okay, so -3 is not a sad 3. It is just three steps on the other side of the lobby. Can one half really be the same as two quarters, though? It sounds like the pizza is trying to do a magic trick." },
      { role: "mentor", content: "It is the same amount when we split the same whole into smaller equal pieces. Two quarters cover the same half of one pizza, so the fractions are equivalent even though the numbers look different." },
      { role: "hire", content: "Right - the number of slices changes, but not the amount of pizza. I am still wobbly below zero: if it is -3 degrees outside and then -7, which one is colder?" },
    ],
    tryThis: "-7 degrees is colder because it is farther left on the number line than -3. The farther left we move below zero, the smaller the number and the colder the temperature.",
    completion: { conceptId: "negative-numbers", notebookEntry: "On the number line, -7 is farther left than -3, so it is smaller — and that means colder when we are talking about temperature." },
    report: {
      strengths: [
        "You used the number line as a clear visual reference, which helped Milo describe negative numbers without treating them as something bad.",
        "The pizza example made equivalent fractions memorable and gave Milo words they can reuse with younger learners.",
      ],
      gaps: [{ concept: "Negative Numbers", whatWasMissing: "Milo can picture the two sides of zero, but still needs a chance to compare negative values with confidence.", tryNextTime: "Use a short temperature or lift-floor example and ask Milo to place a few values on the number line." }],
      suggestedNextSession: "Let Milo lead a tiny Number Quest Club warm-up about values below zero, then revisit the tricky comparisons.",
    },
  },
];

export default function DemoOffice({ conversationId }: { conversationId: string }) {
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const conversation = conversations.find((item) => item.id === conversationId) ?? conversations[0];
  const [messages, setMessages] = useState<DemoMessage[]>(conversation.messages);
  const [concepts, setConcepts] = useState<SkillConcept[]>(conversation.concepts);
  const [agenda, setAgenda] = useState(conversation.agenda);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string>();
  const [showGuidedReply, setShowGuidedReply] = useState(true);
  const [progressMoment, setProgressMoment] = useState<"landed">();
  const initials = conversation.hire.name.slice(0, 2).toUpperCase();

  useEffect(() => {
    setMessages(conversation.messages);
    setConcepts(conversation.concepts);
    setAgenda(conversation.agenda);
    setDraft("");
    setThinking(false);
    setError(undefined);
    setShowGuidedReply(true);
    setProgressMoment(undefined);
    setNotebookOpen(false);
    setReportOpen(false);
  }, [conversation]);

  async function sendDemoMessage(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || thinking) return;
    setDraft("");
    setError(undefined);
    setShowGuidedReply(false);
    setMessages((current) => [...current, { role: "mentor", content: message }]);
    setThinking(true);
    try {
      const response = await fetch("/api/demo/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: conversation.id, message, history: messages }) });
      const data = await response.json() as { hireReply?: string; error?: string; conceptAcquired?: boolean; conceptId?: string; notebookEntry?: string };
      if (!response.ok || !data.hireReply) throw new Error(data.error ?? "The demo office could not reply just now. Please try again.");
      setMessages((current) => [...current, { role: "hire", content: data.hireReply as string }]);
      if (data.conceptAcquired && data.conceptId === conversation.completion.conceptId) {
        setConcepts((current) => current.map((concept) => concept.id === data.conceptId ? { ...concept, status: "mastered", notebookEntry: data.notebookEntry ?? conversation.completion.notebookEntry } : concept));
        setAgenda((current) => current.map((item) => item.id === data.conceptId ? { ...item, complete: true } : item));
        setProgressMoment("landed");
        window.setTimeout(() => setProgressMoment(undefined), 1500);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The demo office could not reply just now. Please try again.");
    } finally {
      setThinking(false);
    }
  }

  return <main className="min-h-screen bg-white text-[#374151]">
    <header className="border-b border-[#F3F4F6] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-4 sm:flex-row sm:px-8">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]"><Link href="/" className="text-[#4F46E5] transition hover:text-[#4338CA]">First Day</Link><span className="text-[#9CA3AF]">/</span><Link href="/demo" className="text-[#4F46E5] transition hover:text-[#4338CA]">Demo</Link></nav>
          <h1 className="font-display mt-2 text-2xl font-semibold text-[#111827]">{conversation.title}</h1>
        </div>
        <button onClick={() => setReportOpen(true)} className="touch-target rounded-full px-3 py-2 text-sm font-semibold text-[#4F46E5] transition hover:bg-[#EEF2FF]">View report</button>
      </div>
      <nav aria-label="Demo conversations" className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 pb-4 sm:px-8">
        {conversations.map((item) => <Link key={item.id} href={`/demo/${item.id}`} className={`touch-target shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${item.id === conversation.id ? "bg-[#4F46E5] text-white" : "bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100"}`}>{item.label} · {item.hire.name}</Link>)}
      </nav>
    </header>

    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-[#EEF2FF] px-5 py-4 text-sm leading-6 text-indigo-900">
        <span className="font-semibold">A finished office conversation.</span> {conversation.description} Continue the conversation with a real AI reply; messages are never saved to your onboarding desk.
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section aria-label="Demo conversation" className="surface-card flex h-[min(640px,calc(100dvh-7rem))] min-h-[420px] flex-col sm:h-auto sm:min-h-[620px]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <p className="text-sm font-medium text-slate-500">Office conversation</p>
            <p className="mt-1 text-xs text-slate-500">A completed example of a mentor helping a new hire think through a subject.</p>
          </div>
          <div role="log" aria-live="polite" aria-relevant="additions text" className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
            {messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === "mentor" ? "justify-end" : "justify-start"}`}>
              {message.role === "hire" ? <div aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div> : null}
              <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${message.role === "mentor" ? "rounded-br-md bg-[#4F46E5] text-white" : "rounded-bl-md border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151]"}`}>{message.content}</div>
            </div>)}
          </div>
          {thinking ? <div className="mx-4 mb-1 flex items-center gap-3"><div aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div><div className="rounded-2xl rounded-bl-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">{conversation.hire.name} is thinking...</div></div> : null}
          <form onSubmit={(event) => void sendDemoMessage(event)} className="border-t border-[#F3F4F6] p-4"><div className="flex gap-3"><label className="sr-only" htmlFor="demo-explanation">Explain your answer</label><textarea id="demo-explanation" value={draft} onChange={(event) => setDraft(event.target.value)} disabled={thinking} rows={2} maxLength={6000} placeholder={`Explain it to ${conversation.hire.name}...`} className="min-h-[52px] flex-1 resize-none rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF] disabled:bg-[#F9FAFB]" /><button type="submit" disabled={!draft.trim() || thinking} className="touch-target rounded-full bg-[#4F46E5] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-40">Send</button></div>{showGuidedReply ? <div className="mt-3 rounded-xl border border-indigo-100 bg-[#EEF2FF] px-3 py-3 text-xs leading-5 text-indigo-950"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Not sure where to begin?</p><button type="button" onClick={() => setDraft(conversation.tryThis)} disabled={thinking} className="touch-target rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#4F46E5] shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50">Try this reply</button></div><p className="mt-1.5 text-indigo-900">{conversation.tryThis}</p></div> : null}<p className="mt-2 text-xs text-slate-500">Demo messages are not saved to your onboarding desk.</p>{error ? <p role="alert" className="mt-3 text-xs text-rose-600">{error}</p> : null}</form>
        </section>

        <aside className="space-y-6">
          <section className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Today's office plan</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {agenda.map((item) => <li key={item.id} className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center rounded-full text-xs font-bold ${item.complete ? "bg-emerald-100 text-emerald-700" : "border border-amber-300 bg-amber-50 text-amber-700"}`}>{item.complete ? "✓" : ""}</span>{item.name}</li>)}
            </ul>
          </section>
          <HireCard hire={conversation.hire} concepts={concepts} progressMoment={progressMoment} onOpenFieldNotes={() => setNotebookOpen(true)} />
        </aside>
      </div>
    </div>
    {notebookOpen ? <NotebookPanel name={conversation.hire.name} concepts={concepts} onClose={() => setNotebookOpen(false)} /> : null}
    {reportOpen ? <FocusDialog ariaLabel="Demo teaching report" onClose={() => setReportOpen(false)} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/30 p-5 backdrop-blur-sm"><div className="mx-auto my-8 max-w-4xl rounded-2xl bg-white p-6 shadow-2xl sm:p-9"><div className="mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Demo teaching report</p><h2 className="font-display mt-2 text-3xl font-semibold text-[#111827]">Here&apos;s how your teaching went</h2><p className="mt-2 text-sm text-slate-500">A fixed report that belongs to this finished demo conversation.</p></div><button onClick={() => setReportOpen(false)} className="touch-target rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Close</button></div><GapReport report={conversation.report} /></div></FocusDialog> : null}
  </main>;
}
