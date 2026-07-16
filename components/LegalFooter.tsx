import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="border-t border-[#F3F4F6] bg-white px-5 py-7 text-center text-xs text-[#6B7280] sm:px-8">
      <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        <Link href="/privacy" className="hover:text-indigo-700">Privacy</Link>
        <Link href="/terms" className="hover:text-indigo-700">Terms of use</Link>
        <Link href="/legal" className="hover:text-indigo-700">Legal notice</Link>
      </nav>
    </footer>
  );
}
