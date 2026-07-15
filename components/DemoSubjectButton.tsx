"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function mentorId() {
  const key = "first-day-mentor-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export default function DemoSubjectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function start() {
    setLoading(true);
    try {
      const id = mentorId();
      const response = await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentorId: id, demo: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start the demo.");
      const query = new URLSearchParams({ subjectId: data.subjectId, mentorId: id, title: "Project Management Fundamentals", hireName: data.hire.name, firstQuestion: data.firstQuestion });
      router.push(`/office?${query}`);
    } finally { setLoading(false); }
  }
  return <button onClick={start} disabled={loading} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50">{loading ? "Preparing your hire…" : "Try the demo subject"}</button>;
}
