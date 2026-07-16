import type { Metadata } from "next";
import "./globals.css";
import LegalFooter from "@/components/LegalFooter";

export const metadata: Metadata = {
  title: "First Day",
  description: "Learn by explaining what you know to a curious learner."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="flex min-h-screen flex-col"><div className="flex flex-1 flex-col">{children}</div><LegalFooter /></body></html>;
}
