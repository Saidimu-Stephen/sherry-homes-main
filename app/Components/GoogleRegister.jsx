/** @format */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

function GoogleRegister() {
  const router = useRouter();

  const handleGoogleLogin = () => {
    router.push("/auth/google");
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
      <FontAwesomeIcon icon={faGoogle} className="h-4 w-4 text-rose-600" />
      <span>Continue with Google</span>
    </button>
  );
}

export default GoogleRegister;
