/** @format */
"use client";

import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-10 w-[84px]",
  md: "h-12 w-[100px] sm:h-14 sm:w-[116px]",
  lg: "h-16 w-[132px]",
};

export default function BrandLogo({
  size = "md",
  className = "",
}: BrandLogoProps) {
  const dims = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${dims} ${className}`}>
      <img
        src="/assets/aistudio/image_2781b1e4.png"
        alt="SherryHomes — Real Estate & Property Management"
        className="h-full w-full scale-[1.95] object-contain object-center mix-blend-multiply select-none"
      />
    </span>
  );
}
