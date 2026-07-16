"use client";

export type Report = { strengths: string[]; gaps: Array<{ concept: string; whatWasMissing: string; tryNextTime: string }>; suggestedNextSession: string };

export default function GapReport({ report }: { report: Report }) {
  return <div className="space-y-9">
    <section><h2 className="font-display text-3xl font-semibold text-[#111827]">What landed well</h2><ul className="mt-5 space-y-3">{report.strengths.map((strength) => <li key={strength} className="rounded-2xl border border-[#F3F4F6] border-l-[3px] border-l-emerald-500 bg-white px-5 py-4 text-sm leading-6 text-[#374151] shadow-sm">{strength}</li>)}</ul></section>
    <section><h2 className="font-display text-3xl font-semibold text-[#111827]">Ideas to sharpen</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{report.gaps.map((gap) => <article key={gap.concept} className="rounded-2xl border border-[#F3F4F6] border-l-[3px] border-l-amber-400 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"><h3 className="font-semibold text-[#111827]">{gap.concept}</h3><p className="mt-3 text-sm leading-6 text-[#374151]">{gap.whatWasMissing}</p><p className="mt-4 border-t border-[#F3F4F6] pt-4 text-sm font-medium leading-6 text-[#4F46E5]">Next time: {gap.tryNextTime}</p></article>)}</div></section>
    <section className="rounded-2xl border border-[#E0E7FF] bg-[#EEF2FF] p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4F46E5]">Next session</p><p className="mt-2 text-sm leading-6 text-[#374151]">{report.suggestedNextSession}</p></section>
  </div>;
}
