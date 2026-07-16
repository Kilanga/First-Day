import Link from "next/link";
const publisher = process.env.NEXT_PUBLIC_LEGAL_PUBLISHER_NAME;
const contact = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL;
const host = process.env.NEXT_PUBLIC_LEGAL_HOST_NAME ?? "Vercel Inc.";
export const metadata = { title: "Legal notice | First Day" };
export default function LegalPage() {
  return <main className="min-h-screen bg-white px-5 py-14 sm:px-8"><article className="surface-card mx-auto max-w-3xl p-7 sm:p-10">
    <Link href="/" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">← Back to First Day</Link><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">First Day</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Legal notice</h1>
    <div className="mt-8 space-y-7 text-sm leading-6 text-slate-700">
      <section><h2 className="text-lg font-semibold text-slate-900">Publisher</h2>{publisher && contact ? <p className="mt-2">{publisher}<br /><a className="font-medium text-indigo-700 underline" href={`mailto:${contact}`}>{contact}</a></p> : <p className="mt-2 text-amber-800">Publisher name and legal contact must be configured before this site is made publicly available.</p>}</section>
      <section><h2 className="text-lg font-semibold text-slate-900">Hosting</h2><p className="mt-2">This application is hosted by {host}. Database services are provided through Neon.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-900">Intellectual property</h2><p className="mt-2">The First Day application, its design, and its code are protected by applicable intellectual-property law. Content uploaded by users remains their responsibility and is governed by the Terms of use.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-900">Contact</h2><p className="mt-2">Use the publisher contact above for legal, privacy, or content concerns.</p></section>
    </div>
  </article></main>;
}
