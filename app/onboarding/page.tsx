import Link from "next/link";
import OnboardingForm from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return <main className="min-h-screen bg-[#faf9f7] px-5 py-14 sm:px-8"><div className="mx-auto max-w-2xl">
    <Link href="/" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">← Back to your onboarding desk</Link>
    <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Give your new hire a subject</h1>
    <p className="mt-3 text-slate-600">They will learn in the way a real junior colleague would: by asking the questions that make you explain ideas clearly.</p>
    <section aria-label="What happens next" className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5"><p className="text-sm font-semibold text-indigo-900">What happens next</p><ol className="mt-3 grid gap-3 text-sm leading-5 text-slate-700 sm:grid-cols-3"><li><span className="font-semibold text-indigo-700">1. Map it.</span> We turn your topic into practical questions.</li><li><span className="font-semibold text-indigo-700">2. Meet them.</span> A curious new hire arrives with a personality.</li><li><span className="font-semibold text-indigo-700">3. Teach it.</span> You explain; they turn the ideas into their own words.</li></ol></section>
    <div className="mt-8"><OnboardingForm /></div>
  </div></main>;
}
