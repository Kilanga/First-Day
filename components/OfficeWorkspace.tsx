"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ChatWindow from "./ChatWindow";
import GapReport, { type Report } from "./GapReport";
import HireCard from "./HireCard";
import NotebookPanel from "./NotebookPanel";
import FocusDialog from "./FocusDialog";
import type { ChatMessage, HireView, ProgressMoment, SkillConcept } from "@/lib/officeTypes";

type ActiveSession = { id: string; agenda?: unknown; agendaBonusAwarded?: boolean; messages: ChatMessage[] };
type WorkspaceSubject = {
  id: string;
  title: string;
  firstQuestion?: string;
  hire: HireView;
  concepts: SkillConcept[];
  activeSession: ActiveSession | null;
  latestCompletedSession?: { id: string } | null;
};
type Props = { subjectId?: string; title: string; name: string; initialQuestion?: string };

function subjectUrl(subject: WorkspaceSubject) {
  return `/office?${new URLSearchParams({
    subjectId: subject.id,
    title: subject.title,
    hireName: subject.hire.name,
    ...(subject.firstQuestion ? { firstQuestion: subject.firstQuestion } : {}),
  })}`;
}

function agendaIds(value: unknown) {
  return value && typeof value === "object" && Array.isArray((value as { conceptIds?: unknown }).conceptIds)
    ? (value as { conceptIds: unknown[] }).conceptIds.filter((id): id is string => typeof id === "string")
    : [];
}

export default function OfficeWorkspace({ subjectId, title, name, initialQuestion }: Props) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<WorkspaceSubject[]>([]);
  const [hire, setHire] = useState<HireView>({ name });
  const [progressMoment, setProgressMoment] = useState<ProgressMoment>();
  const [breakthrough, setBreakthrough] = useState(false);
  const [agendaComplete, setAgendaComplete] = useState(false);
  const [ending, setEnding] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [report, setReport] = useState<Report>();
  const [reportOpen, setReportOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState<number>();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);

  async function refreshSubjects() {
    const response = await fetch("/api/state");
    if (!response.ok) return;
    const data = await response.json();
    setSubjects(data.subjects ?? []);
  }

  useEffect(() => {
    void refreshSubjects().catch(() => undefined);
  }, []);

  const currentSubject = useMemo(() => subjects.find((subject) => subject.id === subjectId), [subjects, subjectId]);
  const currentTitle = currentSubject?.title ?? title;
  const currentQuestion = currentSubject?.firstQuestion ?? initialQuestion;
  const agenda = useMemo(
    () => agendaIds(currentSubject?.activeSession?.agenda)
      .map((id) => currentSubject?.concepts.find((concept) => concept.id === id))
      .filter((concept): concept is SkillConcept => Boolean(concept)),
    [currentSubject],
  );
  const readyForConfirmationReview = Boolean(currentSubject?.concepts.length) && currentSubject!.concepts.every((concept) => concept.status === "mastered");

  useEffect(() => {
    if (!currentSubject) return;
    setHire(currentSubject.hire);
    setSessionId(currentSubject.activeSession?.id);
  }, [currentSubject]);

  function updateHire(nextHire: HireView, nextSessionId: string, didBreakthrough: boolean, finishedAgenda: boolean, nextProgressMoment?: ProgressMoment) {
    setHire(nextHire);
    setSessionId(nextSessionId);
    setSubjects((current) => current.map((subject) => subject.id === subjectId
      ? { ...subject, hire: nextHire, activeSession: subject.activeSession ?? { id: nextSessionId, messages: [] } }
      : subject));
    if (nextProgressMoment) {
      setProgressMoment(nextProgressMoment);
      window.setTimeout(() => setProgressMoment(undefined), 1500);
    }
    if (didBreakthrough) {
      setBreakthrough(true);
      window.setTimeout(() => setBreakthrough(false), 2200);
    }
    if (finishedAgenda) {
      setAgendaComplete(true);
      window.setTimeout(() => setAgendaComplete(false), 4600);
    }
    void refreshSubjects().catch(() => undefined);
  }

  async function endSession() {
    if (!sessionId || ending) return;
    setEnding(true);
    try {
      const response = await fetch("/api/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to end the session.");
      router.push(`/report/${data.sessionId}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to end the session.");
      setEnding(false);
    }
  }

  async function viewReport() {
    if (loadingReport) return;
    if (!sessionId) {
      if (currentSubject?.latestCompletedSession) router.push(`/report/${currentSubject.latestCompletedSession.id}`);
      return;
    }
    setLoadingReport(true);
    try {
      const response = await fetch("/api/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, preview: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to prepare the report.");
      setReport(data.report);
      setSnapshotCount(data.snapshotMessageCount);
      setReportOpen(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to prepare the report.");
    } finally {
      setLoadingReport(false);
    }
  }

  return <main className="min-h-screen bg-white text-slate-800">
    <header className="border-b border-[#F3F4F6] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-[#111827]">{currentTitle}</h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:gap-2">
            <button onClick={() => router.push("/desk")} className="touch-target rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Onboarding desk</button>
            <button onClick={viewReport} disabled={loadingReport || !currentSubject?.latestCompletedSession} title={!currentSubject?.latestCompletedSession ? "End the session to generate your first report." : undefined} className="touch-target rounded-full px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-[#EEF2FF] disabled:cursor-not-allowed disabled:opacity-50">{loadingReport ? "Preparing..." : "View report"}</button>
            {readyForConfirmationReview ? <button onClick={() => router.push(`/trial?subjectId=${currentSubject?.id}`)} title="Watch your colleague apply every idea without help." className="touch-target rounded-full px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-[#EEF2FF]">Start confirmation review</button> : null}
            <button onClick={() => setConfirmEnd(true)} disabled={ending || !sessionId} className="touch-target rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F9FAFB] disabled:opacity-50">{ending ? "Ending..." : "End session"}</button>
          </div>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {subjects.map((subject) => <button key={subject.id} onClick={() => router.push(subjectUrl(subject))} className={`touch-target shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${subject.id === subjectId ? "bg-[#4F46E5] text-white" : "bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100"}`}>{subject.title} - {subject.hire.name}{subject.activeSession ? <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" /> : null}</button>)}
        </nav>
      </div>
    </header>

    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:py-10">
      <div className="mb-5 md:hidden">
        <HireCard hire={hire} concepts={currentSubject?.concepts} compact />
        <button onClick={() => setNotebookOpen(true)} className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100">Open {hire.name}&apos;s field notes</button>
      </div>
      {breakthrough ? <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-900">A real breakthrough - {hire.name} finally connected the dots.</div> : null}
      {agendaComplete ? <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-900">That was a great one-on-one - I got everything on my list!</div> : null}
      <div className="grid items-start gap-6 md:grid-cols-3">
        <div className="md:col-span-2"><ChatWindow subjectId={subjectId} hire={hire} initialQuestion={currentQuestion} initialSessionId={currentSubject?.activeSession?.id} initialMessages={currentSubject?.activeSession?.messages} onHireUpdate={updateHire} /></div>
        <div className="space-y-6">
          <section className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Today&apos;s office plan</p>
            {agenda.length ? <ul className="mt-4 space-y-3">{agenda.map((concept) => <li key={concept.id} className="flex items-center gap-3 text-sm text-slate-700"><span className={`grid h-5 w-5 place-items-center rounded-full text-xs ${concept.status === "mastered" ? "bg-emerald-500 text-white" : "border border-slate-300 text-transparent"}`}>✓</span>{concept.name}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Send a first message and {hire.name}&apos;s office plan will appear here.</p>}
          </section>
          <div className="hidden md:block"><HireCard hire={hire} concepts={currentSubject?.concepts} progressMoment={progressMoment} breakthrough={breakthrough} onOpenFieldNotes={() => setNotebookOpen(true)} /></div>
        </div>
      </div>
    </div>

    {notebookOpen ? <NotebookPanel name={hire.name} concepts={currentSubject?.concepts ?? []} onClose={() => setNotebookOpen(false)} /> : null}
    {reportOpen && report ? <FocusDialog ariaLabel="Live session report" onClose={() => setReportOpen(false)} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/30 p-5 backdrop-blur-sm"><div className="mx-auto my-8 max-w-4xl rounded-2xl bg-white p-6 shadow-2xl sm:p-9"><div className="mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Live session report</p><h2 className="font-display mt-2 text-3xl font-semibold text-[#111827]">Here&apos;s how your teaching is going</h2><p className="mt-2 text-sm text-slate-500">Snapshot after {snapshotCount ?? 0} messages. This is the report you will see when the session ends.</p></div><button onClick={() => setReportOpen(false)} className="touch-target rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button></div><GapReport report={report} /></div></FocusDialog> : null}
    {confirmEnd ? <FocusDialog ariaLabel="Finish this session" onClose={() => setConfirmEnd(false)} className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/30 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-semibold text-slate-900">Finish this session?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Your teaching report will be saved. You can start another session on this subject whenever you like.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setConfirmEnd(false)} className="touch-target rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Keep the office open</button><button onClick={() => { setConfirmEnd(false); void endSession(); }} className="touch-target rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Finish session</button></div></div></FocusDialog> : null}
  </main>;
}
