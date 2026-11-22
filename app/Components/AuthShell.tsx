/** @format */
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import suiteShowcase from "@/src/assets/images/sherryhomes_suite_showcase_1795027664296.jpg";
import BrandLogo from "@/app/Components/BrandLogo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerLink?: {
    prompt: string;
    label: string;
    href: string;
  };
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footerLink,
}: AuthShellProps) {
  return (
    <section className="flex-grow bg-[#F4F8FC]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 lg:grid-cols-12">
        <div className="relative hidden overflow-hidden bg-slate-900 lg:col-span-6 lg:block">
          <Image
            src={suiteShowcase}
            alt="Sunlit SherryHomes boutique apartment living suite overlooking a garden courtyard"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            referrerPolicy="no-referrer"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-sky-950/35 to-slate-950/10" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white xl:p-12">
            <div>
              <Link
                href="/"
                aria-label="SherryHomes Home"
                className="inline-flex items-center rounded-xl bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                <BrandLogo size="md" />
              </Link>
            </div>
            <div className="max-w-md space-y-3">
              <p className="text-xs font-semibold tracking-wider uppercase text-sky-200">
                Curated Apartment Living
              </p>
              <h2 className="font-display text-3xl font-semibold leading-snug text-white text-balance">
                Calm, sunlit residences ready when you arrive.
              </h2>
              <p className="text-sm leading-relaxed text-sky-100/90">
                Reserve verified dates without double-booking, settle payments,
                message hosts directly, or manage upcoming bookings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center px-4 py-8 sm:px-8 lg:col-span-6 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-sky-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-4 lg:hidden">
                <BrandLogo size="sm" />
              </div>
              <div className="mb-6 space-y-1.5">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl text-balance">
                  {title}
                </h1>
                <p className="text-sm leading-relaxed text-slate-600">
                  {subtitle}
                </p>
              </div>

              {children}

              {footerLink && (
                <p className="mt-6 border-t border-sky-100 pt-5 text-center text-sm text-slate-600">
                  {footerLink.prompt}{" "}
                  <Link
                    href={footerLink.href}
                    className="font-semibold text-sky-700 hover:text-sky-800 hover:underline underline-offset-4">
                    {footerLink.label}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
