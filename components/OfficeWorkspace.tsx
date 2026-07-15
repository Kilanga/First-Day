"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ChatWindow from "./ChatWindow";
import HireCard, { tierLabel, type HireView } from "./HireCard";

type Props = { subjectId?: string; mentorId?: string; title: string; name: string; initialQuestion?: string };

export default function OfficeWorkspace({ subjectId, mentorId, title, name, initialQuestion }: Props) {
  const router = useRouter();
  const [hire, setHire] = useState<HireView>({ name, tier: "week1", xp: 0, stats: { comprehension: 0, autonomy: 0, reflexes: 0, confidence: 0 } });
  const [xpFloat, setXpFloat] = useState(0);
  const [tierUp, setTierUp] = useState(false);
  const [ending, setEnding] = useState(false);
  const [sessionId, setSessionId] = useState<string>();

  function updateHire(nextHire: HireView, xpDelta: number, crossedTier: boolean, nextSessionId?: string) {
    setHire(nextHire); setSessionId(nextSessionId);
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

  return <main className="min-h-screen bg-[#faf9f7] text-slate-800">
    <header className="border-b border-indigo-100 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p><h1 className="mt-1 text-lg font-semibold text-slate-900">{title}</h1></div><button onClick={endSession} disabled={ending || !sessionId} className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50">{ending ? "Ending…" : "End session"}</button></div></header>
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:py-10"><div className="mb-5 md:hidden"><HireCard hire={hire} compact /></div>{tierUp ? <div className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-center text-sm font-semibold text-indigo-800">🎉 {hire.name} passed the {tierLabel(hire.tier)} milestone!</div> : null}<div className="grid items-start gap-6 md:grid-cols-3"><div className="md:col-span-2"><ChatWindow subjectId={subjectId} mentorId={mentorId} hire={hire} initialQuestion={initialQuestion} onHireUpdate={updateHire} /></div><div className="hidden md:block"><HireCard hire={hire} xpFloat={xpFloat} /></div></div></div>
  </main>;
}
