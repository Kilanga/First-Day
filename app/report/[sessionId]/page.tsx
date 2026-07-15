import Link from "next/link";
import { notFound } from "next/navigation";
import GapReport from "@/components/GapReport";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type GapReportData = { strengths: string[]; gaps: Array<{ concept: string; whatWasMissing: string; tryNextTime: string }>; suggestedNextSession: string };

export default async function ReportPage({ params }: { params: { sessionId: string } }) {
  const session = await prisma.learningSession.findUnique({ where: { id: params.sessionId }, include: { subject: true } });
  if (!session) notFound();
  const report = session.gapReport as unknown as GapReportData | null;
  return <main className="min-h-screen bg-[#faf9f7] px-5 py-10 text-slate-800 sm:px-8"><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day · {session.subject.title}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Here&apos;s how your teaching went</h1><p className="mt-3 max-w-2xl text-slate-600">A few clear takeaways from this session — what helped, and where your next explanation can go further.</p><div className="mt-10">{report ? <GapReport report={report} /> : <p className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">Your session report is being prepared.</p>}</div><Link href="/" className="mt-10 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">Back to home</Link></div></main>;
}
