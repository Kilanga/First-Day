"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DemoSubjectButton from "./DemoSubjectButton";
import { tierLabel } from "./HireCard";

type Subject = { id: string; title: string; firstQuestion?: string; hire: { name: string; tier: string; xp: number }; activeSession: { id: string } | null };

function mentorId() {
  const key = "first-day-mentor-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export default function Dashboard() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>();
  const [id, setId] = useState<string>();
  useEffect(() => {
    const mentor = mentorId(); setId(mentor);
    fetch(`/api/state?mentorId=${encodeURIComponent(mentor)}`).then(async (response) => response.ok ? response.json() : { subjects: [] }).then((data) => setSubjects(data.subjects ?? [])).catch(() => setSubjects([]));
  }, []);
  function openSubject(subject: Subject) {
    if (!id) return;
    const query = new URLSearchParams({ subjectId: subject.id, mentorId: id, title: subject.title, hireName: subject.hire.name, ...(subject.firstQuestion ? { firstQuestion: subject.firstQuestion } : {}) });
    router.push(`/office?${query}`);
  }
  if (!subjects) return <main className="grid min-h-screen place-items-center bg-[#faf9f7] px-5 text-slate-700"><div className="flex items-center gap-3 text-sm font-medium"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />Opening your learning desk…</div></main>;
  if (!subjects.length) return <main className="min-h-screen bg-[#faf9f7] px-5 py-20 sm:px-8"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">First Day</p><h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">You only truly know what you can explain to the new hire.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">The protégé effect turns teaching into one of the fastest ways to consolidate knowledge. First Day inverts the AI tutor: you mentor a curious new colleague instead.</p><p className="mt-6 text-sm text-slate-500">Your learning desk is ready for its first subject.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><DemoSubjectButton /><Link href="/onboarding" className="rounded-xl border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Teach your own subject</Link></div></div></main>;
  return <main className="min-h-screen bg-[#faf9f7] px-5 py-12 sm:px-8"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Your learning desk</h1><p className="mt-2 text-slate-600">Pick up where you left off, or bring a new subject to the office.</p></div><Link href="/onboarding" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Teach a new subject</Link></div><section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((subject) => <article key={subject.id} className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{subject.activeSession ? "In progress" : "Ready to continue"}</p><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{tierLabel(subject.hire.tier)}</span></div><h2 className="mt-3 text-xl font-semibold text-slate-900">{subject.title}</h2><p className="mt-2 text-sm text-slate-600">{subject.hire.name} · {subject.hire.xp} XP</p><button onClick={() => openSubject(subject)} className="mt-6 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">{subject.activeSession ? "Resume session" : "Start a new session"}</button></article>)}</section></div></main>;
}
