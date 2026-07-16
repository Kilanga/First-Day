"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { HireView } from "./HireCard";
import { ensureMentorSession } from "@/lib/mentorClient";

export type ChatMessage = { id: string; role: "mentor" | "hire"; content: string; feedback?: { summary: string; nextStep?: string } };
type Props = {
  subjectId?: string;
  hire: HireView;
  initialQuestion?: string;
  initialSessionId?: string;
  initialMessages?: ChatMessage[];
  onHireUpdate: (hire: HireView, xpDelta: number, tierUp: boolean, sessionId: string, breakthrough: boolean, agendaComplete: boolean) => void;
};

export default function ChatWindow({ subjectId, hire, initialQuestion, initialSessionId, initialMessages, onHireUpdate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialQuestion ? [{ id: "first-question", role: "hire", content: initialQuestion }] : []);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [error, setError] = useState<string>();
  const [lastFailedMessage, setLastFailedMessage] = useState<string>();
  const [teachingChecks, setTeachingChecks] = useState<Record<string, boolean>>({});
  const subjectRef = useRef(subjectId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subjectRef.current !== subjectId) {
      subjectRef.current = subjectId;
      setSessionId(initialSessionId);
      setMessages(initialMessages?.length ? initialMessages : initialQuestion ? [{ id: "first-question", role: "hire", content: initialQuestion }] : []);
      setError(undefined); setLastFailedMessage(undefined);
      return;
    }
    if (initialMessages?.length) {
      setMessages((current) => current.length <= 1 ? initialMessages : current);
      setSessionId((current) => current ?? initialSessionId);
    }
  }, [subjectId, initialSessionId, initialMessages, initialQuestion]);
  useEffect(() => {
    if (!subjectId) return;
    try { setTeachingChecks(JSON.parse(localStorage.getItem(`first-day-teaching-checks:${subjectId}`) ?? "{}") as Record<string, boolean>); }
    catch { setTeachingChecks({}); }
  }, [subjectId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, thinking]);

  function toggleTeachingCheck(key: string) {
    setTeachingChecks((current) => {
      const next = { ...current, [key]: !current[key] };
      if (subjectId) localStorage.setItem(`first-day-teaching-checks:${subjectId}`, JSON.stringify(next));
      return next;
    });
  }
  async function deliver(message: string, appendMessage: boolean) {
    if (!message || thinking) return;
    setError(undefined); setLastFailedMessage(undefined); setThinking(true);
    setThinkingLabel(`${hire.name} is reading your explanation...`);
    if (appendMessage) setMessages((current) => [...current, { id: crypto.randomUUID(), role: "mentor", content: message }]);
    const reviewTimer = window.setTimeout(() => setThinkingLabel("Reviewing the important details..."), 900);
    const replyTimer = window.setTimeout(() => setThinkingLabel(`${hire.name} is preparing the next question...`), 2600);
    try {
      if (!subjectId) throw new Error("Open a learning subject to start a live conversation.");
      await ensureMentorSession();
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, sessionId, message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 429 ? "The learning space is closed for today — come back tomorrow." : data.error ?? "Unable to send the message.");
      setSessionId(data.sessionId);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "hire", content: data.hireReply, feedback: data.teachingNote }]);
      onHireUpdate(data.hire, data.xpDelta, data.tierUp, data.sessionId, Boolean(data.breakthrough), Boolean(data.agendaComplete));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the message.");
      setLastFailedMessage(message);
    } finally {
      window.clearTimeout(reviewTimer); window.clearTimeout(replyTimer); setThinking(false);
    }
  }
  function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setDraft("");
    void deliver(message, true);
  }

  const initials = hire.name.slice(0, 2).toUpperCase();
  return <section aria-label="Mentor conversation" className="surface-card flex min-h-[520px] flex-col">
    <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><p className="text-sm font-medium text-slate-500">Mentor conversation</p><p className="mt-1 text-xs text-slate-400">Explain in your own words. Your learning partner will ask the next question.</p></div>
    <div role="log" aria-live="polite" aria-relevant="additions text" className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
      {messages.length === 0 ? <p className="pt-20 text-center text-sm text-slate-400">Your learning partner is ready when you are.</p> : null}
      {messages.map((message) => <div key={message.id} className="message-in space-y-2"><div className={`flex gap-3 ${message.role === "mentor" ? "justify-end" : "justify-start"}`}>{message.role === "hire" ? <div aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div> : null}<div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${message.role === "mentor" ? "rounded-br-md bg-[#4F46E5] text-white" : "rounded-bl-md border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151]"}`}>{message.content}</div></div>{message.feedback ? <div className="ml-11 max-w-[84%] rounded-xl border border-indigo-100 bg-[#EEF2FF] px-4 py-3 sm:max-w-[80%]"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">For your next session</p><p className="mt-1 text-sm text-slate-700">{message.feedback.summary}</p>{message.feedback.nextStep ? <p className="mt-2 text-xs leading-5 text-indigo-800">{message.feedback.nextStep}</p> : null}</div> : null}</div>)}
      {thinking ? <div aria-live="polite" className="flex items-center gap-3"><div aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div><div className="rounded-2xl rounded-bl-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]"><span className="typing-dot">●</span><span className="typing-dot">●</span><span className="typing-dot">●</span> {thinkingLabel}</div></div> : null}
      <div ref={messagesEndRef} />
    </div>
    <form onSubmit={send} className="border-t border-[#F3F4F6] p-4"><div className="flex gap-3"><label className="sr-only" htmlFor="mentor-explanation">Explain your answer</label><textarea id="mentor-explanation" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={6000} rows={2} disabled={thinking} aria-describedby="mentor-explanation-help mentor-explanation-count" placeholder="Explain it to your new hire..." className="min-h-[52px] flex-1 resize-none rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF] disabled:bg-[#F9FAFB]" /><button type="submit" disabled={!draft.trim() || thinking} className="rounded-full bg-[#4F46E5] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">Send</button></div><div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-slate-400"><p id="mentor-explanation-help">Press Ctrl/Cmd + Enter to send</p><p id="mentor-explanation-count">{draft.length.toLocaleString()} / 6,000</p></div><div className="mt-3 rounded-xl border border-indigo-100 bg-[#EEF2FF] px-3 py-3 text-xs leading-5 text-slate-700"><p className="font-semibold text-indigo-900">A quick way to shape your explanation</p><div className="mt-2 grid gap-1 sm:grid-cols-2">{[["definition", "Plain-language definition"], ["why", "Why it matters"], ["example", "Concrete example"], ["edge", "Useful edge case"]].map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={Boolean(teachingChecks[key])} onChange={() => toggleTeachingCheck(key)} className="accent-indigo-600" />{label}</label>)}</div><p className="mt-3 text-slate-500">Aim for the next useful point, not a perfect lecture. This checklist stays only in this browser.</p></div>{error ? <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700"><span>{error}</span>{lastFailedMessage ? <button type="button" onClick={() => void deliver(lastFailedMessage, false)} disabled={thinking} className="font-semibold underline underline-offset-2 hover:text-rose-900 disabled:opacity-50">Try again</button> : null}</div> : null}</form>
  </section>;
}
