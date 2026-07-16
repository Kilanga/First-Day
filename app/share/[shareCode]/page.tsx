import Link from "next/link";
import { notFound } from "next/navigation";
import SharedOnboardingClaim from "@/components/SharedOnboardingClaim";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SharedOnboardingPage({ params }: { params: { shareCode: string } }) {
  const subject = await prisma.subject.findFirst({ where: { shareCode: params.shareCode, shareEnabled: true }, include: { hire: true } });
  if (!subject?.hire) notFound();
  return <main className="min-h-screen bg-white px-5 py-16 sm:px-8"><div className="surface-card mx-auto max-w-2xl p-8 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day · Shared onboarding</p><h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#111827]">You&apos;ve been invited to teach {subject.title}</h1><p className="mt-4 max-w-xl leading-7 text-slate-600">You&apos;ll mentor {subject.hire.name}, a curious new colleague. This creates your own private onboarding space: your conversations and progress are not shared with anyone else.</p><div className="mt-7 rounded-2xl bg-[#EEF2FF] p-5"><p className="text-sm font-semibold text-slate-900">Meet {subject.hire.name}</p><p className="mt-2 text-sm leading-6 text-slate-600">{Array.isArray(subject.hire.personality) ? subject.hire.personality.filter((trait): trait is string => typeof trait === "string").join(" · ") : "A thoughtful junior colleague, ready to learn."}</p></div><SharedOnboardingClaim shareCode={params.shareCode} title={subject.title} hireName={subject.hire.name} /><Link href="/" className="mt-6 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-900">Go to your onboarding desk</Link></div></main>;
}
