type Report = { strengths: string[]; gaps: Array<{ concept: string; whatWasMissing: string; tryNextTime: string }>; suggestedNextSession: string };

export default function GapReport({ report }: { report: Report }) {
  return <div className="space-y-9">
    <section><h2 className="text-lg font-semibold text-slate-900">What landed well</h2><ul className="mt-4 space-y-3">{report.strengths.map((strength) => <li key={strength} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm leading-6 text-slate-700">{strength}</li>)}</ul></section>
    <section><h2 className="text-lg font-semibold text-slate-900">Ideas to sharpen</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{report.gaps.map((gap) => <article key={gap.concept} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">{gap.concept}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{gap.whatWasMissing}</p><p className="mt-4 border-t border-slate-100 pt-4 text-sm font-medium leading-6 text-indigo-700">Next time: {gap.tryNextTime}</p></article>)}</div></section>
    <section className="rounded-2xl bg-slate-900 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Next session</p><p className="mt-2 text-sm leading-6 text-slate-100">{report.suggestedNextSession}</p></section>
  </div>;
}
