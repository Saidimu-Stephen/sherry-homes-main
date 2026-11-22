/** @format */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import AuthShell from "@/app/Components/AuthShell";
import { touchSessionActivity } from "@/app/lib/authClient";

export default function GoogleAuthPage() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errorParam, setErrorParam] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/api/auth/callback/google");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setErrorParam(err);
    }
    setCallbackUrl(`${window.location.origin}/api/auth/callback/google`);

    fetch("/api/auth/google")
      .then((res) => res.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
      })
      .catch(() => {
        setConfigured(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleStartGoogleSignIn = async () => {
    setRedirecting(true);
    touchSessionActivity();
    await signIn("google", { callbackUrl: "/" });
  };

  const handleCopyCallback = async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AuthShell
      title="Continue with Google"
      subtitle="Connect your Google account for one-tap access to SherryHomes."
      footerLink={{
        prompt: "Prefer email and password?",
        label: "Back to Sign in",
        href: "/login",
      }}>
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <p className="text-sm">Checking Google sign-in availability...</p>
        </div>
      ) : configured ? (
        <div className="space-y-5">
          {errorParam && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
              <span>
                Google sign-in returned an error ({errorParam}). Please try
                again.
              </span>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-semibold">Google OAuth is ready</p>
              <p className="mt-0.5 text-emerald-800">
                You will be redirected securely to Google to choose your account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartGoogleSignIn}
            disabled={redirecting}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
            {redirecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faGoogle} className="h-4 w-4" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <div className="space-y-1.5 border-t border-sky-100 pt-4">
            <p className="text-xs font-semibold text-slate-700">
              Authorized Redirect URI (Google Cloud Console)
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-2">
              <code className="flex-1 truncate font-mono text-xs text-slate-700">
                {callbackUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyCallback}
                aria-label="Copy redirect URI"
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-sky-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50">
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold">Google OAuth credentials needed</p>
              <p className="mt-1 text-amber-900">
                The route{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
                  /api/auth/signin/google
                </code>{" "}
                is wired. Add{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
                  GOOGLE_CLIENT_ID
                </code>{" "}
                and{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
                  GOOGLE_CLIENT_SECRET
                </code>{" "}
                to <code className="font-mono text-xs">.env.local</code> to enable
                live Google sign-in.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">
              Authorized Redirect URI for Google Cloud Console
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-2">
              <code className="flex-1 truncate font-mono text-xs text-slate-700">
                {callbackUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyCallback}
                aria-label="Copy redirect URI"
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-sky-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50">
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Sign in</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-sky-50">
              <span>Register with Email</span>
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
