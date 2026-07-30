import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DGA + Partial Discharge Risk Score - Prototype PKM",
  description:
    "Prototype deteksi dini degradasi trafo: DGA Rule Engine (IEEE C57.104-2019) + Composite Risk Score (Isolation Forest).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold">
              DGA Risk Score <span className="text-muted-foreground font-normal">-- prototype PKM</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/coba" className="hover:underline">
                Coba Sendiri
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          Data DGA riil dari 3 laporan lab PT Petrolab Services -- data Partial Discharge masih
          simulasi (lihat catatan di Dashboard).
        </footer>
      </body>
    </html>
  );
}
