import Link from "next/link";

const conversations = [
  { slug: "project-foundations", topic: "Project Management Fundamentals", name: "Sam", tier: "Week 1", mastered: 2, total: 6, focus: "Scope Creep", latestWin: "Stakeholders vs the Sponsor", report: "1 teaching report", description: "Sam has already worked through the foundations and is ready to discuss a client change request." },
  { slug: "number-quest", topic: "A Playful Maths Onboarding", name: "Milo", tier: "Week 1", mastered: 2, total: 5, focus: "Negative Numbers", latestWin: "Equivalent Fractions", report: "1 teaching report", description: "Milo is preparing for an afternoon at the Number Quest Club and wants more confidence below zero." },
];

export default function DemoDesk() {
  return <main className="min-h-screen bg-white px-5 py-12 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]"><Link href="/" className="text-[#4F46E5] transition hover:text-[#4338CA]">First Day</Link><span className="text-[#9CA3AF]">/</span><span className="text-[#6B7280]">Demo</span></nav>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl"><h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#111827]">Demo onboarding desk</h1><p className="mt-3 leading-7 text-[#374151]">A filled desk from a mentor who has already spent time helping two new hires. Open either office to explore the full experience.</p></div>
        <span className="rounded-full bg-[#EEF2FF] px-3 py-2 text-sm font-semibold text-[#4F46E5]">Ephemeral preview</span>
      </header>

      <section className="mt-12 grid gap-5 sm:grid-cols-2" aria-label="Demo onboarding subjects">
        {conversations.map((conversation) => <article key={conversation.slug} className="surface-card p-6">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4F46E5]">In progress</p><span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">{conversation.tier}</span></div>
          <h2 className="font-display mt-4 text-2xl font-semibold text-[#111827]">{conversation.topic}</h2>
          <p className="mt-2 text-sm text-[#6B7280]">{conversation.name} · {conversation.mastered} of {conversation.total} ideas down</p>
          <div className="mt-5 rounded-xl bg-[#F9FAFB] px-3 py-3 text-xs leading-5 text-[#374151]"><p><span className="font-semibold text-[#111827]">Ramp-up:</span> {conversation.mastered} of {conversation.total} ideas down</p><p className="mt-1"><span className="font-semibold text-[#111827]">Next focus:</span> {conversation.focus}</p><p className="mt-1"><span className="font-semibold text-[#111827]">Latest note:</span> {conversation.latestWin}</p></div>
          <p className="mt-4 text-sm leading-6 text-[#6B7280]">{conversation.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3"><Link href={`/demo/${conversation.slug}`} className="button-primary !px-4 !py-2.5">Resume session</Link><span className="text-xs font-medium text-[#6B7280]">{conversation.report}</span></div>
        </article>)}
      </section>

      <section className="surface-card mt-12 p-6"><h2 className="font-display text-2xl font-semibold text-[#111827]">What this preview includes</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#374151]">Office conversations, field notes, a skills matrix, a teaching report, and real AI chat replies. It is separate from your own onboarding desk and is never stored there.</p></section>
    </div>
  </main>;
}
