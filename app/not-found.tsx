import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-16 text-center sm:px-8">
      <section className="w-full max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">First Day · Office directory</p>
        <p className="mt-8 text-sm font-semibold text-indigo-600">404</p>
        <h1 className="font-display mt-3 text-4xl font-semibold leading-tight text-[#111827] sm:text-6xl">
          Your colleague isn&apos;t here.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#374151] sm:text-lg">
          They may be looking for the right meeting room — or this page has moved somewhere else in the office.
        </p>

        <div className="mx-auto mt-8 w-fit -rotate-2 rounded-2xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
          “Did I take a wrong turn?”
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="button-primary">
            Back to welcome
          </Link>
          <Link href="/desk" className="button-secondary">
            Open onboarding desk
          </Link>
        </div>
      </section>
    </main>
  );
}
