"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

function mentorId() {
  const key = "first-day-mentor-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

type CreatedSubject = { subjectId: string; firstQuestion: string; hire: { name: string; personality?: string[] } };
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
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string>();

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
    setStage(files.length ? "Reading your documentation…" : "Mapping the essentials…");
    const trapTimer = window.setTimeout(() => setStage("Finding the questions a new hire would ask…"), 900);
    const hireTimer = window.setTimeout(() => setStage("Your new hire is getting ready…"), 2000);
    try {
      const id = mentorId();
      const payload = new FormData();
      payload.set("mentorId", id);
      payload.set("title", title);
      if (notes.trim()) payload.set("notes", notes);
      if (focus.trim()) payload.set("focus", focus);
      files.forEach((file) => payload.append("files", file));
      const response = await fetch(`/api/subjects?${new URLSearchParams({ mentorId: id, title })}`, { method: "POST", body: payload });
      const raw = await response.text();
      let data: CreatedSubject & { error?: string };
      try { data = JSON.parse(raw) as CreatedSubject & { error?: string }; } catch { throw new Error("The document service is temporarily unavailable. Please try again."); }
      if (!response.ok) throw new Error(data.error ?? "Unable to create your subject.");
      setCreated(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create your subject.");
    } finally {
      window.clearTimeout(trapTimer);
      window.clearTimeout(hireTimer);
      setLoading(false);
      setStage("");
    }
  }

  function enterOffice() {
    if (!created) return;
    router.push(`/office?${new URLSearchParams({ subjectId: created.subjectId, mentorId: mentorId(), title, hireName: created.hire.name, firstQuestion: created.firstQuestion })}`);
  }

  if (created) return <section className="rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold text-indigo-600">Your new hire arrives</p><div className="mx-auto mt-5 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">{created.hire.name.slice(0, 2).toUpperCase()}</div><h2 className="mt-4 text-2xl font-semibold text-slate-900">Meet {created.hire.name}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{created.hire.personality?.join(" · ")}</p><button onClick={enterOffice} className="mt-7 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Enter the office</button></section>;

  return <form onSubmit={createSubject} className="rounded-2xl border border-indigo-100 bg-white p-7 shadow-sm"><label className="block text-sm font-semibold text-slate-800">What would you like to teach?<input value={title} onChange={(event) => setTitle(event.target.value)} disabled={loading} required maxLength={120} placeholder="e.g. Financial forecasting" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50" /></label><label className="mt-5 block text-sm font-semibold text-slate-800">Paste your study notes <span className="font-normal text-slate-400">(optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={loading} maxLength={12000} rows={5} placeholder="Terms, examples, and the tricky parts you want to practise…" className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50" /></label><div className="mt-5"><p className="text-sm font-semibold text-slate-800">Add technical documentation <span className="font-normal text-slate-400">(optional)</span></p><label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-5 text-center text-sm font-medium text-indigo-700 hover:bg-indigo-50"><input key={fileInputKey} type="file" multiple disabled={loading} accept={ACCEPTED_DOCUMENTS} onChange={addFiles} className="sr-only" />Choose up to 4 files · Markdown, text, Word, PowerPoint or PDF</label><p className="mt-2 text-xs leading-5 text-slate-400">Files are read only to create this subject. 3 MB per file, 4 MB total. Scanned PDFs need selectable text.</p>{files.length ? <><ul className="mt-3 space-y-2">{files.map((file, index) => <li key={`${file.name}:${file.size}:${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><span className="min-w-0 truncate">{file.name}</span><button type="button" disabled={loading} onClick={() => removeFile(index)} className="shrink-0 font-semibold text-indigo-700 hover:text-indigo-900">Remove</button></li>)}</ul><label className="mt-5 block text-sm font-semibold text-slate-800">What should your new hire learn from these documents?<textarea value={focus} onChange={(event) => setFocus(event.target.value)} disabled={loading} required maxLength={600} rows={3} placeholder="e.g. Focus on the reality-shifting core loop, player goals, and common design mistakes." className="mt-2 w-full resize-none rounded-xl border border-indigo-200 px-4 py-3 font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50" /></label><p className="mt-2 text-xs leading-5 text-slate-500">This objective guides which parts of the documents your new hire practises.</p></> : null}</div><button disabled={!title.trim() || loading || (files.length > 0 && !focus.trim())} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Preparing your hire…" : "Meet your new hire"}</button>{loading ? <div className="mt-4 flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />{stage}</div> : null}{error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}</form>;
}
