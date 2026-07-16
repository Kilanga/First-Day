import Link from "next/link";
import OnboardingForm from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return <main className="min-h-screen bg-white px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-2xl">
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]"><Link href="/" className="text-[#4F46E5] transition hover:text-[#4338CA]">First Day</Link><span className="text-[#9CA3AF]">/</span><Link href="/desk" className="text-[#4F46E5] transition hover:text-[#4338CA]">Onboarding desk</Link><span className="text-[#9CA3AF]">/</span><span className="text-[#6B7280]">New subject</span></nav>
    <h1 className="font-display mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#111827] sm:text-5xl">Give your new hire a subject</h1>
    <p className="mt-4 text-[#374151]">They will get up to speed by asking the questions that make you explain ideas clearly.</p>
    <section aria-label="What happens next" className="mt-8 rounded-2xl border border-[#E0E7FF] bg-[#EEF2FF] p-6"><p className="text-sm font-semibold text-[#111827]">What happens next</p><ol className="mt-4 grid gap-4 text-sm leading-5 text-[#374151] sm:grid-cols-3"><li><span className="font-semibold text-[#4F46E5]">1. Map it.</span> We turn your topic into practical questions.</li><li><span className="font-semibold text-[#4F46E5]">2. Meet them.</span> A curious new hire arrives with a personality.</li><li><span className="font-semibold text-[#4F46E5]">3. Teach it.</span> You explain; they turn the ideas into their own words.</li></ol></section>
    <div className="mt-8"><OnboardingForm /></div>
  </div></main>;
}
