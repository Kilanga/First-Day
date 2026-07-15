"use client";

import { useState } from "react";

export default function ShareSubjectButton({ mentorId, subjectId }: { mentorId?: string; subjectId: string }) {
  const [status, setStatus] = useState<"idle" | "working" | "copied" | "error">("idle");

  async function share() {
    if (!mentorId || status === "working") return;
    setStatus("working");
    try {
      const response = await fetch("/api/subjects/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentorId, subjectId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create a share link.");
      await navigator.clipboard.writeText(`${window.location.origin}/share/${data.shareCode}`);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return <div className="mt-5"><button onClick={() => void share()} disabled={!mentorId || status === "working"} className="text-sm font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-50">{status === "working" ? "Creating link…" : status === "copied" ? "Link copied" : "Share onboarding"}</button>{status === "copied" ? <p className="mt-1 text-xs text-emerald-700">Anyone with the link can start their own fresh copy.</p> : null}{status === "error" ? <p className="mt-1 text-xs text-rose-700">Unable to create the link. Please try again.</p> : null}</div>;
}
