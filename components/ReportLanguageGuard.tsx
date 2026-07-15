"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ReportLanguageGuard({ sessionId, language }: { sessionId: string; language?: string }) {
  const router = useRouter();
  const refreshed = useRef(false);

  useEffect(() => {
    if (language === "English" || refreshed.current) return;
    refreshed.current = true;
    void fetch("/api/session/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, preview: true, refreshLanguage: true }),
    }).then((response) => { if (response.ok) router.refresh(); });
  }, [language, router, sessionId]);

  return null;
}
