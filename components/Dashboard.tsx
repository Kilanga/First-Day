"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DemoSubjectButton from "./DemoSubjectButton";
import { tierLabel } from "./HireCard";
import LearningHistory from "./LearningHistory";
import ShareSubjectButton from "./ShareSubjectButton";
import WaitingMessage from "./WaitingMessage";
import { clearLocalMentorId, ensureMentorSession } from "@/lib/mentorClient";

type Concept = { id: string; name: string; status: string; masteredAt?: string };
type Subject = {
  id: string; title: string; firstQuestion?: string; shareEnabled: boolean;
  generationStatus: "preparing" | "ready" | "failed"; generationError?: string | null;
  hire: { name: string; tier: string; xp: number };
  progress: { explored: number; mastered: number; toRevisit: number; total: number };
  concepts: Concept[]; activeSession: { id: string } | null;
  latestCompletedSession: { id: string } | null; completedSessions: Array<{ id: string; endedAt: string }>;
};

function nextFocus(subject: Subject) {
  return subject.concepts.find((concept) => concept.status === "weak")
    ?? subject.concepts.find((concept) => concept.status === "partial")
    ?? subject.concepts.find((concept) => concept.status === "not_covered");
}
function latestAcquired(subject: Subject) {
  return [...subject.concepts].filter((concept) => concept.masteredAt).sort((a, b) => (b.masteredAt ?? "").localeCompare(a.masteredAt ?? ""))[0];
}

export default function Dashboard() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>();
  const [deletingId, setDeletingId] = useState<string>();
  const [deletingDesk, setDeletingDesk] = useState(false);
  const [retryingId, setRetryingId] = useState<string>();
  const loadSubjects = useCallback(async () => {
    try {
      await ensureMentorSession();
      const response = await fetch("/api/state");
      const data = response.ok ? await response.json() : { subjects: [] };
      setSubjects(data.subjects ?? []);
    } catch { setSubjects([]); }
  }, []);

  useEffect(() => { void loadSubjects(); }, [loadSubjects]);
  useEffect(() => {
    if (!subjects?.some((subject) => subject.generationStatus === "preparing")) return;
    const timer = window.setInterval(() => void loadSubjects(), 5000);
    return () => window.clearInterval(timer);
  }, [subjects, loadSubjects]);

  function openOffice(subject: Subject) {
    if (subject.generationStatus !== "ready") return;
    const query = new URLSearchParams({ subjectId: subject.id, title: subject.title, hireName: subject.hire.name, ...(subject.firstQuestion ? { firstQuestion: subject.firstQuestion } : {}) });
    router.push(`/office?${query}`);
  }
  function openPrimary(subject: Subject) {
    if (subject.generationStatus !== "ready") return;
    if (subject.activeSession || !subject.latestCompletedSession) return openOffice(subject);
    router.push(`/report/${subject.latestCompletedSession.id}`);
  }
  async function retrySubject(subject: Subject) {
    setRetryingId(subject.id);
    try {
      const response = await fetch(`/api/subjects/${subject.id}/generation`, { method: "POST" });
      if (!response.ok) throw new Error();
      await loadSubjects();
    } finally { setRetryingId(undefined); }
  }
  async function deleteSubject(subject: Subject) {
    if (deletingId || !window.confirm(`Delete “${subject.title}” and all of ${subject.hire.name}'s sessions? This cannot be undone.`)) return;
    setDeletingId(subject.id);
    try {
      const response = await fetch("/api/subjects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId: subject.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete this onboarding subject.");
      setSubjects((current) => current?.filter((item) => item.id !== subject.id));
    } catch (error) { window.alert(error instanceof Error ? error.message : "Unable to delete this onboarding subject."); }
    finally { setDeletingId(undefined); }
  }
  async function deleteOnboardingDesk() {
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

  if (!subjects) return <main className="grid min-h-screen place-items-center bg-[#faf9f7] px-5 text-slate-700"><div className="flex items-center gap-3 text-sm font-medium"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />Opening your onboarding desk...</div></main>;
  if (!subjects.length) return <main className="min-h-screen bg-[#faf9f7] px-5 py-20 sm:px-8"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">First Day</p><h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">You only truly know what you can explain to a new hire.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">The protégé effect turns teaching into one of the fastest ways to consolidate knowledge. First Day inverts the AI tutor: you mentor a curious new hire instead.</p><p className="mt-6 text-sm text-slate-500">Your onboarding desk is ready for its first subject.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><DemoSubjectButton /><Link href="/onboarding" className="rounded-xl border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Teach your own subject</Link></div><button onClick={() => void deleteOnboardingDesk()} disabled={deletingDesk} className="mt-10 text-sm font-medium text-rose-700 hover:text-rose-900 disabled:opacity-50">{deletingDesk ? "Deleting your data..." : "Delete my data"}</button></div></main>;

  return <main className="min-h-screen bg-[#faf9f7] px-5 py-12 sm:px-8"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Your onboarding desk</h1><p className="mt-2 text-slate-600">Return to an active conversation, review a completed session, or bring a new subject to the office.</p></div><Link href="/onboarding" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Teach a new subject</Link></div><section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((subject) => { const focus = nextFocus(subject); const acquired = latestAcquired(subject); const pending = subject.generationStatus === "preparing"; const failed = subject.generationStatus === "failed"; return <article key={subject.id} className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{pending ? "Preparing" : failed ? "Needs a retry" : subject.activeSession ? "In progress" : subject.latestCompletedSession ? "Session completed" : "Ready to begin"}</p><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{tierLabel(subject.hire.tier)}</span></div><h2 className="mt-3 text-xl font-semibold text-slate-900">{subject.title}</h2><p className="mt-2 text-sm text-slate-600">{subject.hire.name} · {subject.hire.xp} learning points</p>{pending ? <div className="mt-4 flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-xs leading-5 text-indigo-700"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" /><WaitingMessage /></div> : failed ? <div className="mt-4 rounded-xl bg-rose-50 px-3 py-3 text-xs leading-5 text-rose-700"><p>{subject.generationError ?? "The onboarding plan could not be prepared."}</p><button onClick={() => void retrySubject(subject)} disabled={retryingId === subject.id} className="mt-2 font-semibold underline underline-offset-2 disabled:opacity-50">{retryingId === subject.id ? "Restarting..." : "Try again"}</button></div> : <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600"><p><span className="font-semibold text-slate-800">Progress:</span> {subject.progress.mastered} of {subject.progress.total} ideas acquired</p>{focus ? <p className="mt-1"><span className="font-semibold text-slate-800">Next focus:</span> {focus.name}</p> : <p className="mt-1 font-semibold text-emerald-700">Everything is in great shape.</p>}{acquired ? <p className="mt-1"><span className="font-semibold text-slate-800">Latest win:</span> {acquired.name}</p> : null}</div>}<div className="mt-6 flex flex-wrap gap-2">{!pending && !failed ? <><button onClick={() => openPrimary(subject)} className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">{subject.activeSession ? "Resume session" : subject.latestCompletedSession ? "View latest report" : "Start a session"}</button>{!subject.activeSession && subject.latestCompletedSession ? <button onClick={() => openOffice(subject)} className="rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Start a new session</button> : null}</> : null}</div>{!pending && !failed ? <><LearningHistory sessions={subject.completedSessions} /><ShareSubjectButton subjectId={subject.id} initiallyShared={subject.shareEnabled} /></> : null}<button onClick={() => void deleteSubject(subject)} disabled={Boolean(deletingId)} className="mt-4 text-sm font-medium text-slate-500 hover:text-rose-700 disabled:opacity-50">{deletingId === subject.id ? "Deleting..." : "Delete onboarding"}</button></article>; })}</section><section className="mt-10 rounded-2xl border border-rose-100 bg-white p-6"><h2 className="text-base font-semibold text-slate-900">Privacy controls</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Delete your entire anonymous onboarding desk from this browser. This removes all of your subjects, conversations, reports, progress, and shared links.</p><button onClick={() => void deleteOnboardingDesk()} disabled={deletingDesk} className="mt-4 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{deletingDesk ? "Deleting your data..." : "Delete my data"}</button></section></div></main>;
}
