"use client";

import { useState } from "react";

export default function ShareSubjectButton({ subjectId, initiallyShared }: { subjectId: string; initiallyShared: boolean }) {
  const [shared, setShared] = useState(initiallyShared);
  const [status, setStatus] = useState<"idle" | "working" | "copied" | "disabled" | "error">("idle");

  async function createOrCopy(rotate = false) {
    if (status === "working") return;
    setStatus("working");
    try {
      const response = await fetch("/api/subjects/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, rotate }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create a share link.");
      await navigator.clipboard.writeText(`${window.location.origin}/share/${data.shareCode}`);
      setShared(true);
      setStatus("copied");
    } catch { setStatus("error"); }
  }

  async function disable() {
    if (status === "working" || !window.confirm("Disable this shared link? Anyone opening it will no longer be able to start this learning.")) return;
    setStatus("working");
    try {
      const response = await fetch("/api/subjects/share", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to disable this shared link.");
      setShared(false);
      setStatus("disabled");
    } catch { setStatus("error"); }
  }

  return <div className="mt-5"><div className="flex flex-wrap gap-x-3 gap-y-2"><button onClick={() => void createOrCopy(false)} disabled={status === "working"} className="text-sm font-medium text-indigo-700 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-50">{status === "working" ? "Updating link…" : shared ? "Copy shared link" : "Share this learning"}</button>{shared ? <><button onClick={() => void createOrCopy(true)} disabled={status === "working"} className="text-sm font-medium text-indigo-700 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-50">Create new link</button><button onClick={() => void disable()} disabled={status === "working"} className="text-sm font-medium text-slate-500 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 disabled:opacity-50">Disable link</button></> : null}</div><p className="mt-2 text-xs leading-5 text-slate-500">Shared links are public to anyone who has them. Do not share confidential learning material.</p>{status === "copied" ? <p role="status" className="mt-1 text-xs text-emerald-700">Link copied. Each recipient starts with a private fresh copy.</p> : null}{status === "disabled" ? <p role="status" className="mt-1 text-xs text-slate-500">The shared link has been disabled.</p> : null}{status === "error" ? <p role="alert" className="mt-1 text-xs text-rose-700">Unable to update the link. Please try again.</p> : null}</div>;
}
