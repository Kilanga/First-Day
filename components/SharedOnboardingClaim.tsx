"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { localMentorId } from "@/lib/mentorClient";

export default function SharedOnboardingClaim({ shareCode, title, hireName }: { shareCode: string; title: string; hireName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function start() {
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

  return <div className="mt-8"><button onClick={() => void start()} disabled={loading} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? `Preparing ${hireName}'s desk…` : `Meet ${hireName}`}</button>{error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}</div>;
}
