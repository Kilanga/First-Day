"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { localMentorId } from "@/lib/mentorClient";

export default function DemoSubjectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function start() {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: localMentorId(), demo: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start the demo.");
      const query = new URLSearchParams({
        subjectId: data.subjectId,
        title: "Project Management Fundamentals",
        hireName: data.hire.name,
        firstQuestion: data.firstQuestion,
      });
      router.push(`/office?${query}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start the demo.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="flex flex-col items-center gap-2"><button onClick={start} disabled={loading} aria-busy={loading} className="button-primary">{loading ? "Preparing your new hire..." : "Try the demo subject"}</button>{error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}</div>;
}
