/** @format */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import UserProfileWrapper from "../Components/UserProfileWrapper";
import BrandLogo from "../Components/BrandLogo";

const NAV_LINKS = [
  { href: "/", label: "Explore Stays" },
  { href: "/bookings", label: "My Bookings" },
  { href: "/messages", label: "Messages" },
];

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-sky-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:gap-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="SherryHomes Home"
          className="inline-flex items-center shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
          <BrandLogo size="md" />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap shrink-0 transition-colors hover:text-sky-700 ${
                  isActive
                    ? "text-sky-700 underline underline-offset-8 decoration-2"
                    : ""
                }`}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <UserProfileWrapper />
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={
              isOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={isOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-sky-200 text-slate-700 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 lg:hidden">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav
          aria-label="Mobile"
          className="border-t border-sky-100 bg-white px-4 py-3 lg:hidden">
          <ul className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sky-50 text-sky-800"
                        : "text-slate-700 hover:bg-sky-50/70"
                    }`}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/register"
                className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50/70">
                Create account
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export default Header;