/** @format */

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import MainLayout from "./MainLayout/MainLayout";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SherryHomes — Curated Apartment Stays & Hosting",
  description:
    "Browse curated apartment suites, check real-time availability calendars, manage payments, message hosts directly, and oversee future bookings.",
  icons: {
    icon: "/assets/aistudio/image_2781b1e4.png",
    apple: "/assets/aistudio/image_2781b1e4.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-[#F4F8FC] text-slate-900 font-sans antialiased">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
