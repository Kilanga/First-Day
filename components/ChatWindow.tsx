"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { HireView } from "./HireCard";

export type ChatMessage = { id: string; role: "mentor" | "hire"; content: string; feedback?: { summary: string; nextStep?: string } };
type Props = {
  subjectId?: string;
  mentorId?: string;
  hire: HireView;
  initialQuestion?: string;
  initialSessionId?: string;
  initialMessages?: ChatMessage[];
  onHireUpdate: (hire: HireView, xpDelta: number, tierUp: boolean, sessionId: string, breakthrough: boolean, agendaComplete: boolean) => void;
};

function feedbackFromResponse(data: { verdict: { scores: { accuracy: number; completeness: number; clarity: number; example: number }; missing_piece: string }; xpDelta: number }) {
  const scores = data.verdict.scores;
  const impact = Math.round(((scores.accuracy + scores.completeness + scores.clarity + scores.example) / 11) * 10);
  const summary = impact >= 8 ? "Your explanation gave your hire a strong foundation." : impact >= 5 ? "Your hire has the main idea, with one useful point to reinforce." : "This topic needs another clear pass together.";
  return { summary, nextStep: data.verdict.missing_piece ? `A useful point to return to: ${data.verdict.missing_piece}` : undefined };
}

export default function ChatWindow({ subjectId, mentorId, hire, initialQuestion, initialSessionId, initialMessages, onHireUpdate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialQuestion ? [{ id: "first-question", role: "hire", content: initialQuestion }] : []);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [error, setError] = useState<string>();
  const subjectRef = useRef(subjectId);

  useEffect(() => {
    if (subjectRef.current !== subjectId) {
      subjectRef.current = subjectId;
      setSessionId(initialSessionId);
      setMessages(initialMessages?.length ? initialMessages : initialQuestion ? [{ id: "first-question", role: "hire", content: initialQuestion }] : []);
      return;
    }
    if (initialMessages?.length) {
      setMessages((current) => current.length <= 1 ? initialMessages : current);
      setSessionId((current) => current ?? initialSessionId);
    }
  }, [subjectId, initialSessionId, initialMessages, initialQuestion]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || thinking) return;
    setDraft(""); setError(""); setThinking(true); setThinkingLabel(`${hire.name} is reading your explanation…`);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "mentor", content: message }]);
    const reviewTimer = window.setTimeout(() => setThinkingLabel("Reviewing the important details…"), 900);
    const replyTimer = window.setTimeout(() => setThinkingLabel(`${hire.name} is preparing the next question…`), 2600);
    try {
      if (!subjectId || !mentorId) throw new Error("Open Office with a subject and mentor ID to start a live conversation.");
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentorId, subjectId, sessionId, message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 429 ? "The office is closed for today — come back tomorrow." : data.error ?? "Unable to send the message.");
      setSessionId(data.sessionId);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "hire", content: data.hireReply, feedback: feedbackFromResponse(data) }]);
      onHireUpdate(data.hire, data.xpDelta, data.tierUp, data.sessionId, Boolean(data.breakthrough), Boolean(data.agendaComplete));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the message.");
    } finally { window.clearTimeout(reviewTimer); window.clearTimeout(replyTimer); setThinking(false); }
  }

  const initials = hire.name.slice(0, 2).toUpperCase();
  return <section className="flex min-h-[580px] flex-col rounded-2xl border border-indigo-100 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-6 py-5"><p className="text-sm font-medium text-slate-500">Mentor conversation</p><p className="mt-1 text-xs text-slate-400">Explain in your own words. Your colleague will ask the next question.</p></div>
    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
      {messages.length === 0 ? <p className="pt-20 text-center text-sm text-slate-400">Your new hire is ready when you are.</p> : null}
      {messages.map((message) => <div key={message.id} className="space-y-2">
        <div className={`flex gap-3 ${message.role === "mentor" ? "justify-end" : "justify-start"}`}>
        {message.role === "hire" ? <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div> : null}
        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "mentor" ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md bg-slate-100 text-slate-700"}`}>{message.content}</div>
        </div>
        {message.feedback ? <div className="ml-11 max-w-[80%] rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">For your next one-on-one</p><p className="mt-1 text-sm text-slate-700">{message.feedback.summary}</p>{message.feedback.nextStep ? <p className="mt-2 text-xs leading-5 text-indigo-800">{message.feedback.nextStep}</p> : null}</div> : null}
      </div>)}
      {thinking ? <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</div><div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-500"><span className="typing-dot">●</span><span className="typing-dot">●</span><span className="typing-dot">●</span> {thinkingLabel}</div></div> : null}
    </div>
    <form onSubmit={send} className="border-t border-slate-100 p-4"><div className="flex gap-3"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={6000} rows={2} placeholder="Explain it to your new hire…" className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /><button disabled={!draft.trim() || thinking} className="rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">Send</button></div>{error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}</form>
  </section>;
}
