import type { Metadata } from "next";
import "./globals.css";
import LegalFooter from "@/components/LegalFooter";

export const metadata: Metadata = {
  title: "First Day",
  description: "Teach a new hire by explaining what you know."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="flex min-h-screen flex-col">{children}<LegalFooter /></body></html>;
}
