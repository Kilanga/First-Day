"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { rampUpSummary } from "@/lib/rampUp";
import LearningHistory from "./LearningHistory";
import ShareSubjectButton from "./ShareSubjectButton";
import WaitingMessage from "./WaitingMessage";
import { clearLocalMentorId, ensureMentorSession } from "@/lib/mentorClient";

type Concept = { id: string; name: string; status: string; masteredAt?: string };
type Subject = {
  id: string;
  title: string;
  firstQuestion?: string;
  shareEnabled: boolean;
  generationStatus: "preparing" | "ready" | "failed";
  generationError?: string | null;
  hire: { name: string };
  concepts: Concept[];
  activeSession: { id: string } | null;
  latestCompletedSession: { id: string } | null;
  completedSessions: Array<{ id: string; endedAt: string }>;
};

const nextFocus = (subject: Subject) => subject.concepts.find((item) => item.status === "weak")
  ?? subject.concepts.find((item) => item.status === "partial")
  ?? subject.concepts.find((item) => item.status === "not_covered");

const latestAcquired = (subject: Subject) => [...subject.concepts]
  .filter((item) => item.masteredAt)
  .sort((a, b) => (b.masteredAt ?? "").localeCompare(a.masteredAt ?? ""))[0];

export default function Dashboard() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>();
  const [deletingId, setDeletingId] = useState<string>();
  const [deletingDesk, setDeletingDesk] = useState(false);
  const [retryingId, setRetryingId] = useState<string>();

  const load = useCallback(async () => {
    try {
      await ensureMentorSession();
      const response = await fetch("/api/state");
      setSubjects(response.ok ? (await response.json()).subjects ?? [] : []);
    } catch {
      setSubjects([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!subjects?.some((item) => item.generationStatus === "preparing")) return;
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [subjects, load]);

  const office = (subject: Subject) => router.push(`/office?${new URLSearchParams({
    subjectId: subject.id,
    title: subject.title,
    hireName: subject.hire.name,
    ...(subject.firstQuestion ? { firstQuestion: subject.firstQuestion } : {}),
  })}`);

  async function retry(subject: Subject) {
    setRetryingId(subject.id);
    try {
      if (!(await fetch(`/api/subjects/${subject.id}/generation`, { method: "POST" })).ok) throw new Error();
      await load();
    } finally {
      setRetryingId(undefined);
    }
  }

  async function remove(subject: Subject) {
    if (deletingId || !window.confirm(`Delete "${subject.title}" and all of ${subject.hire.name}'s sessions? This cannot be undone.`)) return;
    setDeletingId(subject.id);
    try {
      const response = await fetch("/api/subjects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId: subject.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete this onboarding subject.");
      setSubjects((current) => current?.filter((item) => item.id !== subject.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete this onboarding subject.");
    } finally {
      setDeletingId(undefined);
    }
  }

  async function removeDesk() {
    if (deletingDesk || !window.confirm("Delete your entire onboarding desk, including every subject, chat, report, and shared link? This cannot be undone.")) return;
    setDeletingDesk(true);
    try {
      const response = await fetch("/api/mentor/session", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete your onboarding desk.");
      clearLocalMentorId();
      window.location.assign("/");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete your onboarding desk.");
      setDeletingDesk(false);
    }
  }

  if (!subjects) return <main className="grid min-h-screen place-items-center bg-white px-5 text-[#374151]"><div className="flex items-center gap-3 text-sm font-medium"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-[#4F46E5]" />Opening your onboarding desk...</div></main>;

  return <main className="min-h-screen bg-white px-5 py-12 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
        <Link href="/" className="text-[#4F46E5] transition hover:text-[#4338CA]">First Day</Link><span className="text-[#9CA3AF]">/</span><span className="text-[#6B7280]">Onboarding desk</span>
      </nav>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#111827]">Your onboarding desk</h1>
          <p className="mt-3 text-[#374151]">Return to an active office conversation, review a completed session, or bring a new subject to the office.</p>
        </div>
        <Link href="/onboarding" className="button-primary">Create a new subject</Link>
      </div>

      {!subjects.length ? <section className="surface-card mt-12 p-8 text-center"><h2 className="font-display text-2xl font-semibold text-[#111827]">No colleagues are waiting yet</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6B7280]">Give a new hire a subject, then they will be ready for their first office conversation.</p><Link href="/onboarding" className="button-primary mt-6">Create a new subject</Link></section> : null}

      {subjects.length ? <section className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const focus = nextFocus(subject);
          const acquired = latestAcquired(subject);
          const rampUp = rampUpSummary(subject.concepts);
          const pending = subject.generationStatus === "preparing";
          const failed = subject.generationStatus === "failed";
          return <article key={subject.id} className="surface-card p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4F46E5]">{pending ? "Preparing" : failed ? "Needs a retry" : subject.activeSession ? "In progress" : subject.latestCompletedSession ? "Session completed" : "Ready to begin"}</p>
              <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">{rampUp.tier}</span>
            </div>
            <h2 className="font-display mt-4 text-2xl font-semibold text-[#111827]">{subject.title}</h2>
            <p className="mt-2 text-sm text-[#6B7280]">{subject.hire.name} &middot; {rampUp.acquired} of {rampUp.total} ideas down</p>
            {pending ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#EEF2FF] px-3 py-3 text-xs leading-5 text-[#4F46E5]"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-[#4F46E5]" /><WaitingMessage /></div> : null}
            {failed ? <div className="mt-5 rounded-xl bg-rose-50 px-3 py-3 text-xs leading-5 text-rose-700"><p>{subject.generationError ?? "The onboarding plan could not be prepared."}</p><button onClick={() => void retry(subject)} disabled={retryingId === subject.id} className="mt-2 font-semibold underline underline-offset-2 disabled:opacity-50">{retryingId === subject.id ? "Restarting..." : "Try again"}</button></div> : null}
            {!pending && !failed ? <div className="mt-5 rounded-xl bg-[#F9FAFB] px-3 py-3 text-xs leading-5 text-[#374151]"><p><span className="font-semibold text-[#111827]">Ramp-up:</span> {rampUp.acquired} of {rampUp.total} ideas down</p>{focus ? <p className="mt-1"><span className="font-semibold text-[#111827]">Next focus:</span> {focus.name}</p> : <p className="mt-1 font-semibold text-emerald-700">Everything is in great shape.</p>}{acquired ? <p className="mt-1"><span className="font-semibold text-[#111827]">Latest note:</span> {acquired.name}</p> : null}</div> : null}
            {!pending && !failed ? <div className="mt-6 flex flex-wrap gap-2"><button onClick={() => subject.activeSession || !subject.latestCompletedSession ? office(subject) : router.push(`/report/${subject.latestCompletedSession.id}`)} className="button-secondary !px-4 !py-2.5">{subject.activeSession ? "Resume session" : subject.latestCompletedSession ? "View latest report" : "Open the office"}</button>{!subject.activeSession && subject.latestCompletedSession ? <button onClick={() => office(subject)} className="rounded-full px-3 py-2 text-sm font-semibold text-[#4F46E5] hover:bg-[#EEF2FF]">Start a new session</button> : null}</div> : null}
            {!pending && !failed ? <><LearningHistory sessions={subject.completedSessions} /><ShareSubjectButton subjectId={subject.id} initiallyShared={subject.shareEnabled} /></> : null}
            <button onClick={() => void remove(subject)} disabled={Boolean(deletingId)} className="mt-5 text-sm font-medium text-[#6B7280] hover:text-rose-700 disabled:opacity-50">{deletingId === subject.id ? "Deleting..." : "Delete onboarding"}</button>
          </article>;
        })}
      </section> : null}

      <section className="surface-card mt-12 p-6">
        <h2 className="font-display text-2xl font-semibold text-[#111827]">Privacy controls</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#374151]">Delete your entire anonymous onboarding desk from this browser. This removes all of your subjects, conversations, reports, progress, and shared links.</p>
        <button onClick={() => void removeDesk()} disabled={deletingDesk} className="button-secondary mt-5 !border-rose-200 !px-4 !py-2.5 !text-rose-700 hover:!bg-rose-50">{deletingDesk ? "Deleting your data..." : "Delete my data"}</button>
      </section>
    </div>
  </main>;
}
