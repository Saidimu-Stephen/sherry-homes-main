/** @format */

import React from "react";
import Link from "next/link";
import BrandLogo from "../Components/BrandLogo";

function Footer() {
  return (
    <footer className="border-t border-sky-200/80 bg-white text-slate-600">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <Link href="/" aria-label="SherryHomes Home" className="inline-block">
            <BrandLogo size="md" />
          </Link>
          <p className="mt-1.5 text-xs text-slate-500">
            © {new Date().getFullYear()} SherryHomes. Curated stays and verified apartments.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="hover:text-sky-700 transition-colors">
            Explore Stays
          </Link>
          <Link href="/bookings" className="hover:text-sky-700 transition-colors">
            My Bookings
          </Link>
          <Link href="/messages" className="hover:text-sky-700 transition-colors">
            Messages
          </Link>
          <Link href="/login" className="hover:text-sky-700 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-sky-700 transition-colors">
            Create account
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
