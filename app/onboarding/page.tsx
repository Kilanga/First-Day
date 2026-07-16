import Link from "next/link";
import OnboardingForm from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return <main className="min-h-screen bg-white px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-2xl">
    <Link href="/" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">← Back to your learning desk</Link>
    <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p>
    <h1 className="font-display mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#111827] sm:text-5xl">Give your learning partner a subject</h1>
    <p className="mt-4 text-[#374151]">They will learn alongside you by asking the questions that make you explain ideas clearly.</p>
    <section aria-label="What happens next" className="mt-8 rounded-2xl border border-[#E0E7FF] bg-[#EEF2FF] p-6"><p className="text-sm font-semibold text-[#111827]">What happens next</p><ol className="mt-4 grid gap-4 text-sm leading-5 text-[#374151] sm:grid-cols-3"><li><span className="font-semibold text-[#4F46E5]">1. Map it.</span> We turn your topic into practical questions.</li><li><span className="font-semibold text-[#4F46E5]">2. Meet them.</span> A curious learner arrives with a personality.</li><li><span className="font-semibold text-[#4F46E5]">3. Teach it.</span> You explain; they turn the ideas into their own words.</li></ol></section>
    <div className="mt-8"><OnboardingForm /></div>
  </div></main>;
}
