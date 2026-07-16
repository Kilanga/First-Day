import Link from "next/link";
import DemoSubjectButton from "./DemoSubjectButton";
import EdtechIcon from "./EdtechIcon";
import type { CSSProperties } from "react";

export default function WelcomePage() {
  return <main className="min-h-screen bg-white px-5 py-16 sm:px-8 sm:py-24">
    <div className="mx-auto max-w-5xl text-center">
      <div className="relative mx-auto max-w-4xl">
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
          <span className="float-chip absolute left-[-8%] top-24 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#374151] shadow-sm" style={{ "--chip-rotate": "-3deg" } as CSSProperties}>wait — can I try one?</span>
          <span className="float-chip absolute right-[-11%] top-36 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#374151] shadow-sm" style={{ animationDelay: "1s", "--chip-rotate": "3deg" } as CSSProperties}>oh, that finally clicked.</span>
          <span className="float-chip absolute bottom-16 right-[-4%] rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#374151] shadow-sm" style={{ animationDelay: "1.5s", "--chip-rotate": "-2deg" } as CSSProperties}>can I say it back?</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4F46E5]">First Day</p>
        <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#111827] sm:text-7xl">Learn anything more deeply by teaching it.</h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#374151] sm:text-lg sm:leading-8">Mentor your AI new hire on their first day. Their curious questions turn what you know into understanding, one idea at a time.</p>
        <div className="mx-auto mt-10 flex max-w-md flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
          <DemoSubjectButton />
          <Link href="/desk" className="button-secondary">Open your onboarding desk</Link>
        </div>
      </div>

      <section className="mx-auto mt-20 grid max-w-4xl gap-8 text-left sm:grid-cols-3">
        <div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]"><EdtechIcon name="spark" className="h-5 w-5" /></span><h2 className="font-display mt-4 text-2xl font-semibold text-[#111827]">Explain</h2><p className="mt-2 text-sm leading-6 text-[#6B7280]">Put an idea into your own words, with the detail and examples that make it clear.</p></div>
        <div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF7ED] text-[#F97316]"><EdtechIcon name="message" className="h-5 w-5" /></span><h2 className="font-display mt-4 text-2xl font-semibold text-[#111827]">They question</h2><p className="mt-2 text-sm leading-6 text-[#6B7280]">Your colleague asks the next useful question, just like a thoughtful new hire would.</p></div>
        <div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ECFDF5] text-[#10B981]"><EdtechIcon name="growth" className="h-5 w-5" /></span><h2 className="font-display mt-4 text-2xl font-semibold text-[#111827]">Watch them grow</h2><p className="mt-2 text-sm leading-6 text-[#6B7280]">See what is taking shape through their own words, field notes, and office plan.</p></div>
      </section>
    </div>
  </main>;
}
