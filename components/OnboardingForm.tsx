"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ensureMentorSession, localMentorId } from "@/lib/mentorClient";
import WaitingMessage from "./WaitingMessage";

type CreatedSubject = {
  subjectId: string;
  status: "preparing" | "ready" | "failed";
  firstQuestion?: string;
  error?: string;
  hire: { name: string; personality?: string[] };
};

const ACCEPTED_DOCUMENTS = ".md,.txt,.docx,.pptx,.pdf,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation";

export default function OnboardingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [focus, setFocus] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [created, setCreated] = useState<CreatedSubject>();
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    void ensureMentorSession().then(() => setSessionReady(true)).catch(() => setError("Unable to open your private onboarding desk. Please refresh and try again."));
  }, []);

  useEffect(() => {
    if (!created || created.status !== "preparing") return;
    const timer = window.setInterval(() => {
      void fetch(`/api/subjects/${created.subjectId}/generation`).then(async (response) => {
        const data = await response.json() as Pick<CreatedSubject, "status" | "firstQuestion" | "error">;
        if (data.status === "ready" || data.status === "failed") setCreated((current) => current ? { ...current, ...data } : current);
      }).catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [created?.subjectId, created?.status]);

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? []);
    if (selected.length) setFiles((current) => {
      const known = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
      return [...current, ...selected.filter((file) => !known.has(`${file.name}:${file.size}:${file.lastModified}`))].slice(0, 4);
    });
    setFileInputKey((value) => value + 1);
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setFileInputKey((value) => value + 1);
  }

  async function createSubject(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setStage(files.length ? "Reading your onboarding material..." : "Preparing your onboarding plan...");
    const questionTimer = window.setTimeout(() => setStage("Your new hire is getting ready..."), 900);
    try {
      const payload = new FormData();
      payload.set("mentorId", localMentorId());
      payload.set("title", title);
      if (notes.trim()) payload.set("notes", notes);
      if (focus.trim()) payload.set("focus", focus);
      files.forEach((file) => payload.append("files", file));
      const response = await fetch("/api/subjects", { method: "POST", body: payload });
      const raw = await response.text();
      let data: CreatedSubject & { error?: string };
      try { data = JSON.parse(raw) as CreatedSubject & { error?: string }; }
      catch { throw new Error("The document service is temporarily unavailable. Please try again."); }
      if (!response.ok) throw new Error(data.error ?? "Unable to start this onboarding plan.");
      setCreated(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start this onboarding plan.");
    } finally {
      window.clearTimeout(questionTimer);
      setLoading(false);
      setStage("");
    }
  }

  function enterOffice() {
    if (created?.firstQuestion) router.push(`/office?${new URLSearchParams({ subjectId: created.subjectId, title, hireName: created.hire.name, firstQuestion: created.firstQuestion })}`);
  }

  async function retryPreparation() {
    if (!created) return;
    setCreated((current) => current ? { ...current, status: "preparing", error: undefined } : current);
    const response = await fetch(`/api/subjects/${created.subjectId}/generation`, { method: "POST" });
    if (!response.ok) setCreated((current) => current ? { ...current, status: "failed", error: "We could not restart this onboarding plan. Try again." } : current);
  }

  if (created) return <section className="surface-card p-8 text-center">
    <p className="text-sm font-semibold text-indigo-600">Your new hire is here</p>
    <div className="mx-auto mt-5 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">{created.hire.name.slice(0, 2).toUpperCase()}</div>
    <h2 className="font-display mt-4 text-3xl font-semibold text-[#111827]">Meet {created.hire.name}</h2>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{created.hire.personality?.join(" · ")}</p>
    {created.status === "preparing" ? <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" /><WaitingMessage /></div>
      : created.status === "failed" ? <div className="mt-6"><p role="alert" className="text-sm text-rose-600">{created.error ?? "We could not prepare this onboarding plan."}</p><button onClick={() => void retryPreparation()} className="mt-4 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Try again</button></div>
        : <button onClick={enterOffice} className="button-primary mt-7">Start learning</button>}
  </section>;

  return <form onSubmit={createSubject} className="surface-card p-6 sm:p-8">
    <label className="block text-sm font-semibold text-slate-800">What would you like to teach your new hire?
      <input value={title} onChange={(event) => setTitle(event.target.value)} disabled={loading} required maxLength={120} placeholder="e.g. Cell biology for my exam" className="mt-2 w-full rounded-xl border border-[#E5E7EB] px-4 py-3.5 font-normal outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF] disabled:bg-[#F9FAFB]" />
    </label>
    <label className="mt-5 block text-sm font-semibold text-slate-800">Paste your reference notes <span className="font-normal text-slate-500">(optional)</span>
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={loading} maxLength={12000} rows={5} placeholder="Definitions, examples, and ideas you want to practise..." className="mt-2 w-full resize-none rounded-xl border border-[#E5E7EB] px-4 py-3.5 font-normal outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF] disabled:bg-[#F9FAFB]" />
    </label>
    <div className="mt-5">
      <p className="text-sm font-semibold text-slate-800">Add learning material <span className="font-normal text-slate-500">(optional)</span></p>
      <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-5 text-center text-sm font-medium text-indigo-700 hover:bg-indigo-50"><input key={fileInputKey} type="file" multiple disabled={loading} accept={ACCEPTED_DOCUMENTS} onChange={addFiles} className="sr-only" />Choose up to 4 files · Markdown, text, Word, PowerPoint or PDF</label>
      <p className="mt-2 text-xs leading-5 text-slate-500">Text is used only to prepare this onboarding plan. It is removed once preparation succeeds; failed drafts stay available only so you can retry or delete them. 3 MB per file, 4 MB total.</p>
      {files.length ? <><ul className="mt-3 space-y-2">{files.map((file, index) => <li key={`${file.name}:${file.size}:${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><span className="min-w-0 truncate">{file.name}</span><button type="button" disabled={loading} onClick={() => removeFile(index)} className="shrink-0 font-semibold text-indigo-700">Remove</button></li>)}</ul><label className="mt-5 block text-sm font-semibold text-slate-800">What should your new hire focus on?<textarea value={focus} onChange={(event) => setFocus(event.target.value)} disabled={loading} required maxLength={600} rows={3} placeholder="e.g. Focus on the core concepts, common misconceptions, and useful examples." className="mt-2 w-full resize-none rounded-xl border border-indigo-200 px-4 py-3 font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label></> : null}
    </div>
    <button disabled={!title.trim() || !sessionReady || loading || (files.length > 0 && !focus.trim())} className="button-primary mt-7">{loading ? "Preparing your onboarding plan..." : sessionReady ? "Meet your new hire" : "Opening your onboarding desk..."}</button>
    {loading ? <div className="mt-4 flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />{stage}</div> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p> : null}
  </form>;
}
