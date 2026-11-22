/** @format */
"use client";

import React from "react";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name?: string) {
  const parts = (name || "User").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Avatar({
  src,
  name = "User",
  size = "sm",
  className = "",
}: AvatarProps) {
  const dim = SIZE_MAP[size] || SIZE_MAP.sm;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${dim} rounded-full object-cover border border-sky-200 bg-sky-50 shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={`${dim} inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-100 font-semibold text-sky-800 shrink-0 ${className}`}>
      {getInitials(name)}
    </span>
  );
}
