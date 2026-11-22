/** @format */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import AuthShell from "@/app/Components/AuthShell";
import { saveStoredAuth } from "@/app/lib/authClient";

const Login = () => {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("redirect");
    if (nextPath && nextPath.startsWith("/")) {
      setRedirectPath(nextPath);
    }
    if (params.get("reason") === "timeout") {
      setIsSuccess(false);
      setStatusMessage(
        "Your session ended after 2 minutes of inactivity. Please sign in again."
      );
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSuccess(false);

    if (!userName.trim() || !password) {
      setStatusMessage("Please enter both your username or email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName: userName.trim(), password }),
      });

      const data = await response.json();
      const messageText = Array.isArray(data.msg)
        ? data.msg[0]
        : data.msg || "Unable to sign in.";

      if (response.ok && data.success) {
        saveStoredAuth(data.token, data.userData);
        setIsSuccess(true);
        setStatusMessage(messageText || "Signed in successfully. Redirecting...");
        setUsername("");
        setPassword("");

        const target = redirectPath && redirectPath !== "/host" ? redirectPath : "/";
        setTimeout(() => {
          router.push(target);
        }, 500);
      } else {
        setIsSuccess(false);
        setStatusMessage(messageText);
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsSuccess(false);
      setStatusMessage("Network error while signing in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    router.push("/auth/google");
  };

  const fillGuestDemo = () => {
    setStatusMessage("");
    setUsername("amina@example.com");
    setPassword("guest1234");
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to book stays, settle invoices, unlock check-in guides, write reviews, or message hosts."
      footerLink={{
        prompt: "New to SherryHomes?",
        label: "Create an account",
        href: "/register",
      }}>
      {statusMessage && (
        <div
          role="alert"
          className={`mb-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}>
          {isSuccess ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="userName"
            className="block text-sm font-medium text-slate-800">
            Username or email
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="userName"
              name="userName"
              autoComplete="username"
              placeholder="johndoe or name@example.com"
              value={userName}
              onChange={(e) => setUsername(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-10 pr-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-800">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline underline-offset-4 whitespace-nowrap">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-10 pr-11 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-sky-100 bg-sky-50/70 p-3">
        <span className="text-xs font-medium text-slate-700">
          Quick guest preview
        </span>
        <button
          type="button"
          onClick={fillGuestDemo}
          className="min-h-[34px] rounded-lg border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100/60">
          Fill Guest Demo
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-sky-100" />
        <span className="text-xs font-medium text-slate-500">
          or continue with
        </span>
        <div className="h-px flex-1 bg-sky-100" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
        <FontAwesomeIcon icon={faGoogle} className="h-4 w-4 text-rose-600" />
        <span>Continue with Google</span>
      </button>
    </AuthShell>
  );
};

export default Login;
