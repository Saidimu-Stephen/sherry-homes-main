/** @format */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import AuthShell from "@/app/Components/AuthShell";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSuccess(false);

    if (!email.trim()) {
      setStatusMessage("Please enter your account email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setStatusMessage(data.msg);
        if (data.previewCode) {
          setPreviewCode(data.previewCode);
        }
        setStep(2);
      } else {
        setIsSuccess(false);
        setStatusMessage(data.msg || "Could not send verification code.");
      }
    } catch (error) {
      console.error("Forgot password request error:", error);
      setIsSuccess(false);
      setStatusMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSuccess(false);

    if (!code.trim() || !newPassword || !confirmPassword) {
      setStatusMessage("Please fill in the verification code and new password.");
      return;
    }

    if (newPassword.length < 8) {
      setStatusMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setIsCompleted(true);
        setStatusMessage(data.msg);
      } else {
        setIsSuccess(false);
        setStatusMessage(data.msg || "Unable to reset password.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setIsSuccess(false);
      setStatusMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={
        isCompleted
          ? "Password updated"
          : step === 1
          ? "Reset your password"
          : "Enter verification code"
      }
      subtitle={
        isCompleted
          ? "Your account credentials are up to date."
          : step === 1
          ? "Enter the email linked to your SherryHomes account to receive a 6-digit verification code."
          : `Enter the 6-digit code generated for ${email} and choose a new password.`
      }
      footerLink={{
        prompt: "Remembered your password?",
        label: "Back to Sign in",
        href: "/login",
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
          <div className="space-y-1">
            <p>{statusMessage}</p>
            {previewCode && step === 2 && !isCompleted && (
              <p className="font-mono text-xs font-semibold text-emerald-800">
                Verification code: {previewCode}
              </p>
            )}
          </div>
        </div>
      )}

      {isCompleted ? (
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
            Continue to Sign in
          </Link>
        </div>
      ) : step === 1 ? (
        <form onSubmit={handleRequestCode} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="resetEmail"
              className="block text-sm font-medium text-slate-800">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="resetEmail"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-10 pr-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating code...</span>
              </>
            ) : (
              <span>Send reset code</span>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="resetCode"
              className="block text-sm font-medium text-slate-800">
              6-digit verification code
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="resetCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-10 pr-3.5 py-2.5 font-mono text-base tracking-widest text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-800">
              New password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-10 pr-11 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-800">
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-slate-800">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-10 pr-11 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-800">
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setStatusMessage("");
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-sky-50">
              <ArrowLeft className="h-4 w-4" />
              <span>Change email</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update password</span>
              )}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
