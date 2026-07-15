"use client";

import { useState } from "react";

export default function ReportExportButton({ sessionId }: { sessionId: string }) {
  const [error, setError] = useState<string>();
  async function download() {
    setError(undefined);
    try {
      const response = await fetch(`/api/session/${sessionId}/export`);
      if (!response.ok) throw new Error("Unable to export this report.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "first-day-report.md"; anchor.click(); URL.revokeObjectURL(url);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to export this report."); }
  }
  return <div><button onClick={() => void download()} className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Download Markdown</button>{error ? <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p> : null}</div>;
}
