import Link from "next/link";
import { notFound } from "next/navigation";
import GapReport from "@/components/GapReport";
import MentorFeedback from "@/components/MentorFeedback";
import ReportLanguageGuard from "@/components/ReportLanguageGuard";
import ReportExportButton from "@/components/ReportExportButton";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getMentorIdFromCookieHeader, MENTOR_SESSION_COOKIE } from "@/lib/mentorSession";

export const dynamic = "force-dynamic";

type GapReportData = {
  strengths: string[];
  gaps: Array<{ concept: string; whatWasMissing: string; tryNextTime: string }>;
  suggestedNextSession: string;
  language?: "English";
};

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const mentorId = getMentorIdFromCookieHeader(`${MENTOR_SESSION_COOKIE}=${cookieStore.get(MENTOR_SESSION_COOKIE)?.value ?? ""}`);
  if (!mentorId) notFound();
  const session = await prisma.learningSession.findFirst({
    where: { id: sessionId, subject: { mentorId } },
    include: { subject: { include: { hire: true } } },
  });
  if (!session?.subject.hire) notFound();

  const report = session.gapReport as unknown as GapReportData | null;
  const hire = session.subject.hire;
  const followUp = `/office?${new URLSearchParams({
    subjectId: session.subjectId,
    title: session.subject.title,
    hireName: hire.name,
  })}`;

  return (
    <main className="min-h-screen bg-white px-5 py-14 text-slate-800 sm:px-8 sm:py-20">
      <ReportLanguageGuard sessionId={session.id} language={report?.language} />
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day · {session.subject.title}</p>
        <h1 className="font-display mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#111827] sm:text-5xl">Here&apos;s how your teaching went</h1>
        <p className="mt-3 max-w-2xl text-slate-600">A few clear takeaways from this session — what helped, and where your next explanation can go further.</p>

        <section className="surface-card mt-10 border-l-[3px] border-l-[#E5E7EB] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{hire.name}&apos;s journal</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-[#111827]">Today&apos;s note from my desk</h2>
          <p className="font-display mt-5 max-w-2xl whitespace-pre-line text-lg leading-8 text-slate-700">
            {session.journalEntry ? `“${session.journalEntry}”` : "I’m still putting today’s ideas into my own words."}
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-700">— {hire.name}</p>
        </section>

        <div className="mt-8"><MentorFeedback sessionId={session.id} initialFeedback={session.mentorFeedback} name={hire.name} autoAsk={session.feedbackDue} /></div>
        <div className="mt-10">{report ? <GapReport report={report} /> : <p className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">Your teaching report is being prepared.</p>}</div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={followUp} className="button-primary">Start a follow-up session</Link>
          {report ? <ReportExportButton sessionId={session.id} /> : null}
          <Link href="/" className="button-secondary">Back to welcome</Link>
        </div>
      </div>
    </main>
  );
}
