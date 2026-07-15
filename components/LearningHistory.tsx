"use client";

import Link from "next/link";
import { useState } from "react";

type CompletedSession = { id: string; endedAt: string };

export default function LearningHistory({ sessions }: { sessions: CompletedSession[] }) {
  const [open, setOpen] = useState(false);
  if (!sessions.length) return null;
  return <div className="mt-4"><button onClick={() => setOpen((value) => !value)} className="text-sm font-medium text-indigo-700 hover:text-indigo-900">{open ? "Hide learning history" : `Learning history (${sessions.length})`}</button>{open ? <ul className="mt-3 space-y-2 border-l border-indigo-100 pl-3">{sessions.map((session, index) => <li key={session.id} className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-600">Session {sessions.length - index} · {new Date(session.endedAt).toLocaleDateString()}</span><Link href={`/report/${session.id}`} className="font-semibold text-indigo-700 hover:text-indigo-900">View report</Link></li>)}</ul> : null}</div>;
}
