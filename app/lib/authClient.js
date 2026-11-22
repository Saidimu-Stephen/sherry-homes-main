/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

const AUTH_EVENT = "sherry-auth-change";
const STUDIO_EVENT = "sherry-studio-auth-change";
export const LAST_ACTIVITY_KEY = "sherry_last_activity";
export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
export const INACTIVITY_WARNING_MS = 30 * 1000; // Show warning in final 30 seconds

export function getLastActivity() {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    const ts = raw ? Number(raw) : 0;
    return Number.isFinite(ts) && ts > 0 ? ts : 0;
  } catch {
    return 0;
  }
}

export function touchSessionActivity() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLastActivity() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Ignore
  }
}

export function isSessionIdleExpired() {
  if (typeof window === "undefined") return false;
  const last = getLastActivity();
  if (!last) return false;
  return Date.now() - last >= INACTIVITY_TIMEOUT_MS;
}

export function readStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("userData");
    if (!token || !raw) return null;

    if (isSessionIdleExpired()) {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("refreshed");
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed?.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("refreshed");
      return null;
    }
    return parsed?.userData || null;
  } catch {
    return null;
  }
}

export function saveStoredAuth(token, userData) {
  if (typeof window === "undefined") return;
  const expiryTime = Date.now() + 1000 * 60 * 60 * 12; // 12 hours max cap
  localStorage.setItem(
    "userData",
    JSON.stringify({ userData, expiry: expiryTime })
  );
  localStorage.setItem("token", JSON.stringify(token));
  localStorage.setItem("refreshed", "true");
  touchSessionActivity();
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function updateStoredUser(partial) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.userData) {
      parsed.userData = { ...parsed.userData, ...partial };
      localStorage.setItem("userData", JSON.stringify(parsed));
      touchSessionActivity();
      window.dispatchEvent(new Event(AUTH_EVENT));
    }
  } catch {
    // Ignore
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  localStorage.removeItem("refreshed");
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function readStudioAuth() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("studioAuth");
    if (!raw) return null;

    if (isSessionIdleExpired()) {
      localStorage.removeItem("studioAuth");
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed?.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem("studioAuth");
      return null;
    }
    if (!parsed?.token || !parsed?.userData) return null;
    return { token: parsed.token, userData: parsed.userData };
  } catch {
    return null;
  }
}

export function saveStudioAuth(token, userData) {
  if (typeof window === "undefined") return;
  const expiryTime = Date.now() + 1000 * 60 * 60 * 12;
  localStorage.setItem(
    "studioAuth",
    JSON.stringify({ token, userData, expiry: expiryTime })
  );
  touchSessionActivity();
  window.dispatchEvent(new Event(STUDIO_EVENT));
}

export function updateStudioUser(partial) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("studioAuth");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.userData) {
      parsed.userData = { ...parsed.userData, ...partial };
      localStorage.setItem("studioAuth", JSON.stringify(parsed));
      touchSessionActivity();
      window.dispatchEvent(new Event(STUDIO_EVENT));
    }
  } catch {
    // Ignore
  }
}

export function clearStudioAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("studioAuth");
  window.dispatchEvent(new Event(STUDIO_EVENT));
}

export function useAuthUser() {
  const { data: session, status } = useSession();
  const [localUser, setLocalUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const syncLocal = useCallback(() => {
    setLocalUser(readStoredUser());
    setHydrated(true);
  }, []);

  useEffect(() => {
    syncLocal();
    const onAuthChange = () => syncLocal();
    window.addEventListener(AUTH_EVENT, onAuthChange);
    window.addEventListener("storage", onAuthChange);
    return () => {
      window.removeEventListener(AUTH_EVENT, onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, [syncLocal]);

  const user = session?.user
    ? {
        id: session.user.id || session.user.email || "google-user",
        firstName: session.user.name?.split(" ")[0] || "Account",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        name: session.user.name || "",
        email: session.user.email || "",
        username: session.user.email?.split("@")[0] || "guest",
        role: localUser?.role || "guest",
        avatar: localUser?.avatar || session.user.image || "",
      }
    : localUser;

  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.name ||
      user.username ||
      "Account"
    : "";

  const logout = useCallback(
    async (redirectUrl = "/login") => {
      clearStoredAuth();
      clearStudioAuth();
      clearLastActivity();
      setLocalUser(null);
      if (session) {
        await signOut({ callbackUrl: redirectUrl });
        return true;
      }
      return false;
    },
    [session]
  );

  return {
    user,
    fullName,
    hasNextAuthSession: Boolean(session),
    isAuthenticated: Boolean(user),
    hydrated: hydrated && status !== "loading",
    logout,
  };
}

export function useStudioAuth() {
  const [studio, setStudio] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const syncStudio = useCallback(() => {
    setStudio(readStudioAuth());
    setHydrated(true);
  }, []);

  useEffect(() => {
    syncStudio();
    const onChange = () => syncStudio();
    window.addEventListener(STUDIO_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(STUDIO_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [syncStudio]);

  const lockStudio = useCallback(() => {
    clearStudioAuth();
    setStudio(null);
  }, []);

  return {
    studioToken: studio?.token || "",
    studioUser: studio?.userData || null,
    isStudioUnlocked: Boolean(studio?.token && studio?.userData),
    isSuperAdmin:
      studio?.userData?.role === "super_admin" ||
      studio?.userData?.email?.toLowerCase() === "stevensaidimu@gmail.com",
    hydrated,
    lockStudio,
  };
}
