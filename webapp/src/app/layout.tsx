import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const data = IBM_Plex_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "PD-DGA Risk Monitor -- Prototype PKM",
  description:
    "Unified Trend & Correlation Analytics untuk PD + DGA: DGA Rule Engine (IEEE C57.104-2019) + Composite Risk Score (Isolation Forest). Sisi DGA riil & tervalidasi, sisi PD masih simulasi menunggu mapping data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${display.variable} ${body.variable} ${data.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <header className="border-b border-border/60 sticky top-0 z-10 bg-background/90 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-fault-normal/60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-fault-normal" />
                </span>
                <span className="font-display font-semibold tracking-tight text-[15px]">
                  PD-DGA RISK MONITOR
                </span>
                <span className="hidden sm:inline text-muted-foreground text-xs font-data">
                  / unified trend &amp; correlation analytics
                </span>
              </Link>
              <nav className="flex items-center gap-1 text-sm font-medium">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/coba"
                  className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Coba Sendiri
                </Link>
                <Link
                  href="/metodologi"
                  className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Metodologi
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</main>
          <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground font-data">
            DATA DGA: PT PETROLAB SERVICES (RIIL) &middot; DATA PD: SIMULASI -- lihat catatan transparansi di Dashboard
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
