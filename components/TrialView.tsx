"use client";

import { useState } from "react";

type Result = { conceptId: string; concept: string; question: string; answer: string; correct: boolean };
type Trial = { hireName: string; questions: Result[]; score: number; passed: boolean; failed: Array<{ conceptId: string; concept: string }>; tier: string };

export default function TrialView({ subjectId }: { subjectId?: string }) {
  const [trial, setTrial] = useState<Trial>();
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();

  async function start() {
    if (!subjectId) { setError("Open this page from a learning subject to run a live trial."); return; }
    setRunning(true); setError(undefined); setIndex(0);
    try {
      const response = await fetch("/api/trial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start the trial.");
      setTrial(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to start the trial."); }
    finally { setRunning(false); }
  }

  const current = trial?.questions[index];
  const finished = trial && index >= trial.questions.length;
  return <main className="min-h-screen bg-[#faf9f7] px-5 py-10 text-slate-800 sm:px-8"><div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day · Tier Trial</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Watch what your hire can do alone</h1><p className="mt-3 text-slate-600">This short check lets your new colleague put the ideas into their own words.</p>{!trial ? <div className="mt-10 rounded-2xl border border-indigo-100 bg-white p-7 shadow-sm"><p className="text-sm text-slate-600">The trial draws from concepts you have already covered.</p><button onClick={start} disabled={running} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{running ? "Preparing trial…" : "Start trial"}</button>{error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}</div> : null}{current ? <section className="mt-10 rounded-2xl border border-indigo-100 bg-white p-7 shadow-sm"><p className="text-sm font-medium text-indigo-600">Question {index + 1} of {trial.questions.length} · {current.concept}</p><h2 className="mt-4 text-xl font-semibold leading-8 text-slate-900">{current.question}</h2><div className="mt-7 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{trial.hireName}&apos;s answer</p><p className="mt-3 text-sm leading-7 text-slate-700">{current.answer}</p></div><button onClick={() => setIndex((value) => value + 1)} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">{index + 1 === trial.questions.length ? "See results" : "Next"}</button></section> : null}{finished ? <section className="mt-10 rounded-2xl border border-indigo-100 bg-white p-7 shadow-sm"><p className="text-sm font-semibold text-indigo-600">Trial complete</p><h2 className="mt-2 text-4xl font-semibold text-slate-900">{trial.score}%</h2><p className="mt-3 text-slate-600">Your hire only knows what you taught well.</p><p className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${trial.passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{trial.passed ? `The ${trial.tier} tier is confirmed.` : "This tier needs a little more practice."}</p>{trial.failed.length ? <div className="mt-7"><h3 className="font-semibold text-slate-900">Questions to revisit</h3><ul className="mt-3 space-y-2">{trial.failed.map((item) => <li key={item.conceptId} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{item.concept}</li>)}</ul></div> : null}</section> : null}</div></main>;
}
