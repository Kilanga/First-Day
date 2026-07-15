"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ChatWindow, { type ChatMessage } from "./ChatWindow";
import GapReport, { type Report } from "./GapReport";
import HireCard, { tierLabel, type HireView } from "./HireCard";

type WorkspaceSubject = { id: string; title: string; firstQuestion?: string; hire: HireView; progress?: { explored: number; mastered: number; toRevisit: number; total: number }; activeSession: { id: string; messages: ChatMessage[] } | null };
type Props = { subjectId?: string; mentorId?: string; title: string; name: string; initialQuestion?: string };

function subjectUrl(mentorId: string, subject: WorkspaceSubject) {
  return `/office?${new URLSearchParams({ subjectId: subject.id, mentorId, title: subject.title, hireName: subject.hire.name, ...(subject.firstQuestion ? { firstQuestion: subject.firstQuestion } : {}) })}`;
}

export default function OfficeWorkspace({ subjectId, mentorId, title, name, initialQuestion }: Props) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<WorkspaceSubject[]>([]);
  const [hire, setHire] = useState<HireView>({ name, tier: "week1", xp: 0, stats: { comprehension: 0, autonomy: 0, reflexes: 0, confidence: 0 } });
  const [xpFloat, setXpFloat] = useState(0);
  const [tierUp, setTierUp] = useState(false);
  const [ending, setEnding] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [report, setReport] = useState<Report>();
  const [reportOpen, setReportOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState<number>();
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    if (!mentorId) return;
    fetch(`/api/state?mentorId=${encodeURIComponent(mentorId)}`).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setSubjects(data.subjects ?? []);
    }).catch(() => undefined);
  }, [mentorId]);

  const currentSubject = useMemo(() => subjects.find((subject) => subject.id === subjectId), [subjects, subjectId]);
  const currentTitle = currentSubject?.title ?? title;
  const currentQuestion = currentSubject?.firstQuestion ?? initialQuestion;
  const currentProgress = currentSubject?.progress;

  useEffect(() => {
    if (!currentSubject) return;
    setHire(currentSubject.hire);
    setSessionId(currentSubject.activeSession?.id);
  }, [currentSubject]);

  function updateHire(nextHire: HireView, xpDelta: number, crossedTier: boolean, nextSessionId?: string) {
    setHire(nextHire); setSessionId(nextSessionId);
    setSubjects((current) => current.map((subject) => subject.id === subjectId ? { ...subject, hire: nextHire, activeSession: subject.activeSession ?? { id: nextSessionId!, messages: [] } } : subject));
    if (xpDelta) { setXpFloat(xpDelta); window.setTimeout(() => setXpFloat(0), 1100); }
    if (crossedTier) { setTierUp(true); window.setTimeout(() => setTierUp(false), 3200); }
  }

  async function endSession() {
    if (!sessionId || ending) return;
    setEnding(true);
    try {
      const response = await fetch("/api/session/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to end the session.");
      router.push(`/report/${data.sessionId}`);
    } catch { setEnding(false); }
  }

  async function viewReport() {
    if (!sessionId || loadingReport) return;
    setLoadingReport(true);
    try {
      const response = await fetch("/api/session/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, preview: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to prepare the report.");
      setReport(data.report); setSnapshotCount(data.snapshotMessageCount); setReportOpen(true);
    } finally { setLoadingReport(false); }
  }

  return <main className="min-h-screen bg-[#faf9f7] text-slate-800">
    <header className="border-b border-indigo-100 bg-white"><div className="mx-auto max-w-6xl px-5 py-4 sm:px-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p><h1 className="mt-1 text-lg font-semibold text-slate-900">{currentTitle}</h1>{currentProgress ? <p className="mt-1 text-xs text-slate-500">{currentProgress.explored}/{currentProgress.total} concepts explored · {currentProgress.mastered} mastered{currentProgress.toRevisit ? ` · ${currentProgress.toRevisit} to revisit` : ""}</p> : null}</div><div className="flex items-center gap-1 sm:gap-2"><button onClick={() => router.push("/")} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Leave</button><button onClick={viewReport} disabled={loadingReport || !sessionId} className="rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">{loadingReport ? "Preparing…" : "View report"}</button><button onClick={() => setConfirmEnd(true)} disabled={ending || !sessionId} className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">{ending ? "Ending…" : "End session"}</button></div></div><nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{subjects.map((subject) => <button key={subject.id} onClick={() => mentorId && router.push(subjectUrl(mentorId, subject))} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition ${subject.id === subjectId ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}>{subject.title} — {subject.hire.name}{subject.activeSession ? <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" /> : null}</button>)}<button onClick={() => router.push("/onboarding")} className="shrink-0 rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">+ New subject</button></nav></div></header>
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:py-10"><div className="mb-5 md:hidden"><HireCard hire={hire} compact /></div>{tierUp ? <div className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-center text-sm font-semibold text-indigo-800">🎉 {hire.name} passed the {tierLabel(hire.tier)} milestone!</div> : null}<div className="grid items-start gap-6 md:grid-cols-3"><div className="md:col-span-2"><ChatWindow subjectId={subjectId} mentorId={mentorId} hire={hire} initialQuestion={currentQuestion} initialSessionId={currentSubject?.activeSession?.id} initialMessages={currentSubject?.activeSession?.messages} onHireUpdate={updateHire} /></div><div className="hidden md:block"><HireCard hire={hire} xpFloat={xpFloat} /></div></div></div>
    {reportOpen && report ? <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/30 p-5 backdrop-blur-sm"><div className="mx-auto my-8 max-w-4xl rounded-2xl bg-[#faf9f7] p-6 shadow-2xl sm:p-9"><div className="mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Live session report</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Here&apos;s how your teaching is going</h2><p className="mt-2 text-sm text-slate-500">Snapshot after {snapshotCount ?? 0} messages. This is the report you will see when the session ends.</p></div><button onClick={() => setReportOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button></div><GapReport report={report} /></div></div> : null}
    {confirmEnd ? <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/30 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-semibold text-slate-900">Finish this session?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Your teaching report will be saved. You can start another session on this subject whenever you like.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setConfirmEnd(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Keep learning</button><button onClick={() => { setConfirmEnd(false); void endSession(); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Finish session</button></div></div></div> : null}
  </main>;
}
