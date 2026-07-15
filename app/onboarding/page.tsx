import Link from "next/link";
import OnboardingForm from "@/components/OnboardingForm";

export default function OnboardingPage() { return <main className="min-h-screen bg-[#faf9f7] px-5 py-14 sm:px-8"><div className="mx-auto max-w-2xl"><Link href="/" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">← Back to your learning desk</Link><p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Give your new hire a subject</h1><p className="mt-3 text-slate-600">They will learn it the way a real junior colleague would: by asking the questions that make you explain it clearly.</p><div className="mt-8"><OnboardingForm /></div></div></main>; }
