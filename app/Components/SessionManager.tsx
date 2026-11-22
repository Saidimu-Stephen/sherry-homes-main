/** @format */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import {
  clearLastActivity,
  clearStoredAuth,
  clearStudioAuth,
  getLastActivity,
  INACTIVITY_TIMEOUT_MS,
  INACTIVITY_WARNING_MS,
  LAST_ACTIVITY_KEY,
  touchSessionActivity,
  useAuthUser,
  useStudioAuth,
} from "@/app/lib/authClient";

export default function SessionManager() {
  const router = useRouter();
  const {
    isAuthenticated,
    hasNextAuthSession,
    hydrated: authHydrated,
    logout,
  } = useAuthUser();
  const {
    isStudioUnlocked,
    hydrated: studioHydrated,
    lockStudio,
  } = useStudioAuth();

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastWriteRef = useRef<number>(0);
  const loggingOutRef = useRef<boolean>(false);
  const warningActiveRef = useRef<boolean>(false);

  const hasSession = isAuthenticated || isStudioUnlocked;
  const ready = authHydrated && studioHydrated;

  const endSessionNow = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    warningActiveRef.current = false;
    setSecondsLeft(null);

    try {
      lockStudio();
      clearStudioAuth();
      clearStoredAuth();
      clearLastActivity();

      if (hasNextAuthSession) {
        const redirected = await logout("/login?reason=timeout");
        if (!redirected) {
          router.push("/login?reason=timeout");
        }
      } else {
        await logout("/login?reason=timeout");
        router.push("/login?reason=timeout");
      }
    } finally {
      setTimeout(() => {
        loggingOutRef.current = false;
      }, 1500);
    }
  }, [hasNextAuthSession, lockStudio, logout, router]);

  const handleStaySignedIn = useCallback(() => {
    touchSessionActivity();
    lastWriteRef.current = Date.now();
    warningActiveRef.current = false;
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (!hasSession) {
      warningActiveRef.current = false;
      setSecondsLeft(null);
      return;
    }

    const existingLast = getLastActivity();
    if (!existingLast) {
      touchSessionActivity();
      lastWriteRef.current = Date.now();
    } else if (Date.now() - existingLast >= INACTIVITY_TIMEOUT_MS) {
      endSessionNow();
      return;
    }

    const recordActivity = (event?: Event) => {
      if (loggingOutRef.current) return;
      // Once the final countdown modal is visible, require an intentional click/keypress rather than passive mouse movement
      if (warningActiveRef.current && event?.type === "mousemove") {
        return;
      }
      const now = Date.now();
      if (now - lastWriteRef.current < 2000) return;
      lastWriteRef.current = now;
      touchSessionActivity();
      if (warningActiveRef.current) {
        warningActiveRef.current = false;
        setSecondsLeft(null);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const last = getLastActivity();
        if (last && Date.now() - last >= INACTIVITY_TIMEOUT_MS) {
          endSessionNow();
        }
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        lastWriteRef.current = Number(e.newValue) || Date.now();
        if (warningActiveRef.current) {
          warningActiveRef.current = false;
          setSecondsLeft(null);
        }
      }
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, recordActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);

    const interval = setInterval(() => {
      const last = getLastActivity() || Date.now();
      const elapsed = Date.now() - last;
      const remaining = INACTIVITY_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        endSessionNow();
      } else if (remaining <= INACTIVITY_WARNING_MS) {
        warningActiveRef.current = true;
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else if (warningActiveRef.current) {
        warningActiveRef.current = false;
        setSecondsLeft(null);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, recordActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
    };
  }, [ready, hasSession, endSessionNow]);

  if (!hasSession || secondsLeft === null) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-sky-200 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="session-timeout-title"
              className="font-display text-lg font-semibold text-slate-900">
              Session expiring due to inactivity
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              For your security, your session will automatically log out in{" "}
              <span className="font-semibold text-sky-800 tabular-nums">
                {secondsLeft}s
              </span>{" "}
              (2-minute idle limit).
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={endSessionNow}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
            <LogOut className="h-3.5 w-3.5" />
            <span>Log out now</span>
          </button>
          <button
            type="button"
            onClick={handleStaySignedIn}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Stay signed in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
