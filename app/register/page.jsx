/** @format */
"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import GoogleRegister from "@/app/Components/GoogleRegister";
import AuthShell from "@/app/Components/AuthShell";
import Avatar from "@/app/Components/Avatar";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [messageContent, setMessageContent] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstNameRef = useRef(null);
  const router = useRouter();

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessageContent([]);
    setIsSuccess(false);

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !gender ||
      !password
    ) {
      setMessageContent(["Please complete all required fields."]);
      return;
    }

    if (username.trim().length < 4) {
      setMessageContent(["Username must be at least 4 characters long."]);
      return;
    }

    if (password.length < 8) {
      setMessageContent(["Password must be at least 8 characters long."]);
      return;
    }

    if (password !== confirmPassword) {
      setMessageContent(["Passwords do not match."]);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          gender,
          avatar,
          password,
        }),
      });

      const { msg, success } = await res.json();
      const messages = Array.isArray(msg) ? msg : msg ? [msg] : [];
      setMessageContent(messages);
      setIsSuccess(Boolean(success));

      if (res.ok && success) {
        setFirstName("");
        setLastName("");
        setUsername("");
        setEmail("");
        setPhoneNumber("");
        setGender("");
        setAvatar("");
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          router.push("/login");
        }, 800);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setIsSuccess(false);
      setMessageContent(["Network error while creating account."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join SherryHomes to book stays, track payments, receive keybox & Wi-Fi guides, review, and message hosts."
      footerLink={{
        prompt: "Already have an account?",
        label: "Sign in",
        href: "/login",
      }}>
      {messageContent.length > 0 && (
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
          <div className="space-y-0.5">
            {messageContent.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Profile Picture for Host & Guest Transparency */}
        <div className="flex items-center gap-4 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
          <Avatar
            src={avatar}
            name={`${firstName} ${lastName}`.trim() || "Guest"}
            size="lg"
          />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-800">
              Profile photo (for host & guest transparency)
            </p>
            <p className="text-[11px] text-slate-500">
              Hosts see your profile photo when confirming check-in details.
            </p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-50">
              <Camera className="h-3.5 w-3.5" />
              <span>{avatar ? "Change photo" : "Upload photo"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-slate-800">
              First name
            </label>
            <input
              onChange={(e) => setFirstName(e.target.value)}
              value={firstName}
              type="text"
              id="firstName"
              placeholder="John"
              ref={firstNameRef}
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-slate-800">
              Last name
            </label>
            <input
              onChange={(e) => setLastName(e.target.value)}
              value={lastName}
              type="text"
              id="lastName"
              placeholder="Doe"
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-slate-800">
            Username
          </label>
          <input
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            type="text"
            id="username"
            autoComplete="username"
            placeholder="johndoe123"
            className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-800">
            Email address
          </label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            id="email"
            autoComplete="email"
            placeholder="name@example.com"
            className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-slate-800">
              Phone number
            </label>
            <input
              onChange={(e) => setPhoneNumber(e.target.value)}
              value={phoneNumber}
              type="tel"
              id="phoneNumber"
              autoComplete="tel"
              placeholder="+254 712 345 678"
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-slate-800">
              Gender
            </label>
            <select
              onChange={(e) => setGender(e.target.value)}
              value={gender}
              id="gender"
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-800">
            Password
          </label>
          <div className="relative">
            <input
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              value={password}
              id="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-3.5 pr-11 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-800">
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-800">
            Confirm password
          </label>
          <div className="relative">
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-3.5 pr-11 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-sky-100" />
        <span className="text-xs font-medium text-slate-500">
          or continue with
        </span>
        <div className="h-px flex-1 bg-sky-100" />
      </div>

      <GoogleRegister />
    </AuthShell>
  );
}
