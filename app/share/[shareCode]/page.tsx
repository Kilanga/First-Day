import Link from "next/link";
import { notFound } from "next/navigation";
import SharedOnboardingClaim from "@/components/SharedOnboardingClaim";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SharedOnboardingPage({ params }: { params: { shareCode: string } }) {
  const subject = await prisma.subject.findFirst({ where: { shareCode: params.shareCode, shareEnabled: true }, include: { hire: true } });
  if (!subject?.hire) notFound();
  return <main className="min-h-screen bg-[#faf9f7] px-5 py-16 sm:px-8"><div className="mx-auto max-w-2xl rounded-2xl border border-indigo-100 bg-white p-8 shadow-sm sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day · Shared onboarding</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">You&apos;ve been invited to learn {subject.title}</h1><p className="mt-4 max-w-xl leading-7 text-slate-600">You&apos;ll mentor {subject.hire.name}, a curious new colleague. This creates your own private learning space: your conversations and progress are not shared with anyone else.</p><div className="mt-7 rounded-2xl bg-indigo-50 p-5"><p className="text-sm font-semibold text-slate-900">Meet {subject.hire.name}</p><p className="mt-2 text-sm leading-6 text-slate-600">{Array.isArray(subject.hire.personality) ? subject.hire.personality.filter((trait): trait is string => typeof trait === "string").join(" · ") : "A thoughtful junior colleague, ready to learn."}</p></div><SharedOnboardingClaim shareCode={params.shareCode} title={subject.title} hireName={subject.hire.name} /><Link href="/" className="mt-6 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-900">Go to your learning desk</Link></div></main>;
}
