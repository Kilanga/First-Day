import Link from "next/link";

const conversations = [
  { slug: "project-foundations", topic: "Project Management Fundamentals", name: "Sam", tier: "First Month", xp: 58, description: "A colleague learns how to tell deliverables, milestones, stakeholders, and scope changes apart." },
  { slug: "number-quest", topic: "A Playful Maths Onboarding", name: "Milo", tier: "Week 1", xp: 36, description: "A junior helper gets ready for an afternoon at the Number Quest Club, using friendly maths examples." },
];

export default function DemoDesk() {
  return <main className="min-h-screen bg-white px-5 py-12 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]"><Link href="/" className="text-[#4F46E5] transition hover:text-[#4338CA]">First Day</Link><span className="text-[#9CA3AF]">/</span><span className="text-[#6B7280]">Demo</span></nav>
      <header className="mt-5 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#111827]">Demo onboarding desk</h1>
        <p className="mt-3 leading-7 text-[#374151]">Explore two finished office conversations. They are read-only snapshots and never affect your own onboarding desk.</p>
      </header>
      <section className="mt-12 grid gap-5 sm:grid-cols-2" aria-label="Demo conversations">
        {conversations.map((conversation) => <article key={conversation.slug} className="surface-card flex flex-col p-7">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4F46E5]">Finished snapshot</p><span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">{conversation.tier}</span></div>
          <h2 className="font-display mt-5 text-2xl font-semibold text-[#111827]">{conversation.topic}</h2>
          <p className="mt-2 text-sm font-medium text-[#374151]">{conversation.name} · {conversation.xp} XP</p>
          <p className="mt-5 flex-1 text-sm leading-6 text-[#6B7280]">{conversation.description}</p>
          <Link href={`/demo/${conversation.slug}`} className="button-primary mt-7 w-fit">Open conversation</Link>
        </article>)}
      </section>
    </div>
  </main>;
}
