"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DemoSubjectButton from "./DemoSubjectButton";
import { tierLabel } from "./HireCard";
import LearningHistory from "./LearningHistory";
import ShareSubjectButton from "./ShareSubjectButton";
import { clearLocalMentorId, ensureMentorSession } from "@/lib/mentorClient";

type Subject = {
  id: string;
  title: string;
  firstQuestion?: string;
  shareEnabled: boolean;
  hire: { name: string; tier: string; xp: number };
  activeSession: { id: string } | null;
  latestCompletedSession: { id: string } | null;
  completedSessions: Array<{ id: string; endedAt: string }>;
};

export default function Dashboard() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>();
  const [deletingId, setDeletingId] = useState<string>();
  const [deletingDesk, setDeletingDesk] = useState(false);

  useEffect(() => {
    void ensureMentorSession()
      .then(() => fetch("/api/state"))
      .then(async (response) => response.ok ? response.json() : { subjects: [] })
      .then((data) => setSubjects(data.subjects ?? []))
      .catch(() => setSubjects([]));
  }, []);

  function openOffice(subject: Subject) {
    const query = new URLSearchParams({ subjectId: subject.id, title: subject.title, hireName: subject.hire.name, ...(subject.firstQuestion ? { firstQuestion: subject.firstQuestion } : {}) });
    router.push(`/office?${query}`);
  }

  function openPrimary(subject: Subject) {
    if (subject.activeSession || !subject.latestCompletedSession) return openOffice(subject);
    router.push(`/report/${subject.latestCompletedSession.id}`);
  }

  async function deleteSubject(subject: Subject) {
    if (deletingId || !window.confirm(`Delete “${subject.title}” and all of ${subject.hire.name}'s sessions? This cannot be undone.`)) return;
    setDeletingId(subject.id);
    try {
      const response = await fetch("/api/subjects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId: subject.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete this learning subject.");
      setSubjects((current) => current?.filter((item) => item.id !== subject.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete this learning subject.");
    } finally {
      setDeletingId(undefined);
    }
  }

  async function deleteLearningDesk() {
    if (deletingDesk || !window.confirm("Delete your entire learning desk, including every subject, chat, report, and shared link? This cannot be undone.")) return;
    setDeletingDesk(true);
    try {
      const response = await fetch("/api/mentor/session", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete your learning desk.");
      clearLocalMentorId();
      window.location.assign("/");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete your learning desk.");
      setDeletingDesk(false);
    }
  }

  if (!subjects) return <main className="grid min-h-screen place-items-center bg-[#faf9f7] px-5 text-slate-700"><div className="flex items-center gap-3 text-sm font-medium"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />Opening your learning desk…</div></main>;

  if (!subjects.length) return <main className="min-h-screen bg-[#faf9f7] px-5 py-20 sm:px-8"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">First Day</p><h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">You only truly know what you can explain to the new hire.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">The protégé effect turns teaching into one of the fastest ways to consolidate knowledge. First Day inverts the AI tutor: you mentor a curious new colleague instead.</p><p className="mt-6 text-sm text-slate-500">Your learning desk is ready for its first subject.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><DemoSubjectButton /><Link href="/onboarding" className="rounded-xl border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Teach your own subject</Link></div><button onClick={() => void deleteLearningDesk()} disabled={deletingDesk} className="mt-10 text-sm font-medium text-rose-700 hover:text-rose-900 disabled:opacity-50">{deletingDesk ? "Deleting your data…" : "Delete my data"}</button></div></main>;

  return <main className="min-h-screen bg-[#faf9f7] px-5 py-12 sm:px-8"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Your learning desk</h1><p className="mt-2 text-slate-600">Return to an active conversation, review a completed session, or bring a new subject to the office.</p></div><Link href="/onboarding" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Teach a new subject</Link></div><section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((subject) => <article key={subject.id} className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{subject.activeSession ? "In progress" : subject.latestCompletedSession ? "Session completed" : "Ready to begin"}</p><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{tierLabel(subject.hire.tier)}</span></div><h2 className="mt-3 text-xl font-semibold text-slate-900">{subject.title}</h2><p className="mt-2 text-sm text-slate-600">{subject.hire.name} · {subject.hire.xp} XP</p><div className="mt-6 flex flex-wrap gap-2"><button onClick={() => openPrimary(subject)} className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">{subject.activeSession ? "Resume session" : subject.latestCompletedSession ? "View latest report" : "Start a session"}</button>{!subject.activeSession && subject.latestCompletedSession ? <button onClick={() => openOffice(subject)} className="rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Start a new session</button> : null}</div><LearningHistory sessions={subject.completedSessions} /><ShareSubjectButton subjectId={subject.id} initiallyShared={subject.shareEnabled} /><button onClick={() => void deleteSubject(subject)} disabled={Boolean(deletingId)} className="mt-4 text-sm font-medium text-slate-500 hover:text-rose-700 disabled:opacity-50">{deletingId === subject.id ? "Deleting…" : "Delete learning"}</button></article>)}</section><section className="mt-10 rounded-2xl border border-rose-100 bg-white p-6"><h2 className="text-base font-semibold text-slate-900">Privacy controls</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Delete your entire anonymous learning desk from this browser. This removes all of your subjects, conversations, reports, progress, and shared links.</p><button onClick={() => void deleteLearningDesk()} disabled={deletingDesk} className="mt-4 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{deletingDesk ? "Deleting your data…" : "Delete my data"}</button></section></div></main>;
}
