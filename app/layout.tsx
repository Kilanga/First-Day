import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Day",
  description: "Teach a new hire by explaining what you know."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
