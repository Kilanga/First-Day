import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#faf9f7] px-5 py-7 text-center text-xs text-slate-500 sm:px-8">
      <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        <Link href="/privacy" className="hover:text-indigo-700">Privacy</Link>
        <Link href="/terms" className="hover:text-indigo-700">Terms of use</Link>
        <Link href="/legal" className="hover:text-indigo-700">Legal notice</Link>
      </nav>
    </footer>
  );
}
