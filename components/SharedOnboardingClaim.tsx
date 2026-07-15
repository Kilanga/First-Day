"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { localMentorId } from "@/lib/mentorClient";

export default function SharedOnboardingClaim({ shareCode, title, hireName }: { shareCode: string; title: string; hireName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function start() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/shared-subjects/${shareCode}/claim`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentorId: localMentorId() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start this learning.");
      const query = new URLSearchParams({ subjectId: data.subjectId, title, hireName: data.hire.name, firstQuestion: data.firstQuestion });
      router.push(`/office?${query}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start this learning.");
      setLoading(false);
    }
  }

  return <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5"><p className="text-sm font-semibold text-slate-900">Start with a clean slate</p><p className="mt-2 text-sm leading-6 text-slate-600">You&apos;ll get your own private copy of <strong>{title}</strong> with {hireName}. No messages, notes, progress, or reports from the person who shared this link will be included.</p><button onClick={() => void start()} disabled={loading} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{loading ? `Preparing ${hireName}'s desk…` : `Meet ${hireName}`}</button>{error ? <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => void start()} className="font-semibold underline underline-offset-2">Try again</button></div> : null}</div>;
}
