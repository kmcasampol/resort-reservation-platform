import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Solara Azure Resort — Luxury Villas & Coastal Sanctuary",
  description:
    "Reserve handcrafted private beachfront villas, bamboo cottages, and ocean suites at Solara Azure Resort. School Project powered by Next.js & SQLite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      // Next.js 16 no longer overrides `scroll-behavior` during navigation.
      // This attribute restores instant scroll-to-top on route changes while
      // keeping smooth scrolling for the in-page #accommodations anchors.
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
