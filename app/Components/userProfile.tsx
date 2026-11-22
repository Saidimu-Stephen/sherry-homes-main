/** @format */
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  ChevronDown,
  CalendarDays,
  MessageSquare,
  Building2,
  Camera,
  Lock,
} from "lucide-react";
import { updateStoredUser, useAuthUser } from "@/app/lib/authClient";
import Avatar from "@/app/Components/Avatar";

interface UserProfileProps {
  onProfileClick: () => void;
}

function UserProfile({ onProfileClick }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const { user, fullName, hydrated, logout } = useAuthUser();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    const redirectedByNextAuth = await logout();
    if (!redirectedByNextAuth) {
      router.push("/login");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      const dataUrl = reader.result;
      setSavingPhoto(true);
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            username: user.username,
            avatar: dataUrl,
          }),
        });
        if (res.ok) {
          updateStoredUser({ avatar: dataUrl });
        } else {
          updateStoredUser({ avatar: dataUrl });
        }
      } catch {
        updateStoredUser({ avatar: dataUrl });
      } finally {
        setSavingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!hydrated || !user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
        Sign in
      </Link>
    );
  }

  const displayName = user.firstName || user.username || user.name || "Account";
  const roleLabel =
    user.role === "super_admin"
      ? "Super Admin"
      : user.role === "manager"
      ? "Studio Manager"
      : user.role === "host"
      ? "Host Account"
      : "Guest Account";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          onProfileClick();
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 py-1.5 text-sm font-medium text-slate-800 whitespace-nowrap shrink-0 transition-colors hover:bg-sky-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
        <Avatar src={user.avatar} name={fullName || displayName} size="xs" />
        <span className="max-w-[110px] truncate">{displayName}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-sky-200 bg-white p-3 shadow-lg z-50">
          <div className="flex items-start gap-3 border-b border-sky-100 px-1.5 pb-3">
            <div className="relative shrink-0">
              <Avatar src={user.avatar} name={fullName} size="md" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={savingPhoto}
                title="Update profile picture"
                aria-label="Update profile picture"
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-sm hover:bg-sky-50">
                <Camera className="h-3 w-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {fullName}
              </p>
              {user.email && (
                <p className="mt-0.5 text-xs text-slate-500 truncate">
                  {user.email}
                </p>
              )}
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-sky-700">
                  {roleLabel}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-sky-700 hover:underline">
                  {savingPhoto ? "Saving..." : "Change photo"}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-0.5">
            <Link
              href="/bookings"
              onClick={() => setIsOpen(false)}
              className="flex min-h-[38px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-sky-50">
              <CalendarDays className="h-4 w-4 text-sky-700" />
              <span>My Bookings</span>
            </Link>
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="flex min-h-[38px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-sky-50">
              <MessageSquare className="h-4 w-4 text-sky-700" />
              <span>Messages</span>
            </Link>
            <Link
              href="/host"
              onClick={() => setIsOpen(false)}
              className="flex min-h-[38px] items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-sky-50">
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-700" />
                <span>Host Studio</span>
              </span>
              <Lock className="h-3.5 w-3.5 text-sky-600" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full min-h-[38px] items-center gap-2 rounded-lg border-t border-sky-100 px-2.5 pt-2 pb-1.5 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
