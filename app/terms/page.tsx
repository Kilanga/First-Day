import Link from "next/link";
export const metadata = { title: "Terms of use | First Day" };
export default function TermsPage() {
  return <main className="min-h-screen bg-[#faf9f7] px-5 py-14 sm:px-8"><article className="mx-auto max-w-3xl rounded-2xl border border-indigo-100 bg-white p-7 shadow-sm sm:p-10">
    <Link href="/" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">← Back to First Day</Link><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Terms of use</h1><p className="mt-3 text-sm text-slate-500">Last updated: July 15, 2026</p>
    <div className="mt-8 space-y-7 text-sm leading-6 text-slate-700">
      <section><h2 className="text-lg font-semibold text-slate-900">The service</h2><p className="mt-2">First Day is an AI-assisted learning tool. Its replies, assessments, and reports are generated content intended to support learning. They are not professional, legal, medical, financial, security, or employment advice.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-900">Your content</h2><p className="mt-2">You remain responsible for the titles, notes, messages, and documents you provide. You confirm that you have the rights and permissions needed to use and submit them, and that doing so does not violate confidentiality, privacy, intellectual-property, contractual, or other obligations.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-900">Acceptable use</h2><p className="mt-2">Do not use the service to upload unlawful material, personal or confidential data without authority, malware, or material designed to disrupt the service. Do not attempt to bypass usage limits, access another person&apos;s learning desk, or share a learning link where its contents must remain private.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-900">Shared learnings</h2><p className="mt-2">Shared links are not access-controlled. Anyone with a valid link can open the reusable template. Disable or rotate a link if it was sent to the wrong person or no longer needs to be available.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-900">Availability</h2><p className="mt-2">The service is provided as available and may change, be limited, or be discontinued. Keep any important source material outside First Day; deleting your browser data or your learning desk can prevent access to your learning history.</p></section>
    </div>
  </article></main>;
}
