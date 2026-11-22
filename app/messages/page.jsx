/** @format */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  MessageSquare,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useAuthUser } from "@/app/lib/authClient";
import Avatar from "@/app/Components/Avatar";

export default function ClientMessagesPage() {
  const { user, fullName, isAuthenticated, hydrated } = useAuthUser();
  const [threads, setThreads] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newModal, setNewModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newText, setNewText] = useState("");

  const loadThreads = useCallback(
    async (silent = false) => {
      if (!user) return;
      try {
        if (!silent) setLoading(true);
        const query = user.email
          ? `?guestEmail=${encodeURIComponent(user.email)}`
          : "";
        const [msgRes, roomRes] = await Promise.all([
          fetch(`/api/messages${query}`),
          fetch("/api/getAvailableRooms"),
        ]);
        const [msgData, roomData] = await Promise.all([
          msgRes.ok ? msgRes.json() : [],
          roomRes.ok ? roomRes.json() : [],
        ]);
        const list = Array.isArray(msgData) ? msgData : [];
        setThreads(list);
        const roomList = Array.isArray(roomData) ? roomData : [];
        setRooms(roomList);
        if (!newRoomName && roomList[0]) {
          setNewRoomName(roomList[0].roomName);
        }
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0]._id);
        }
      } catch (err) {
        console.error("Failed loading messages:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user, newRoomName, selectedId]
  );

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      loadThreads();
      const timer = setInterval(() => loadThreads(true), 5000);
      return () => clearInterval(timer);
    } else if (hydrated) {
      setLoading(false);
    }
  }, [hydrated, isAuthenticated, loadThreads]);

  const activeThread = threads.find((t) => t._id === selectedId) || null;

  const handleSelectThread = async (thread) => {
    setSelectedId(thread._id);
    if (thread.unreadForGuest) {
      try {
        await fetch("/api/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: thread._id, role: "guest" }),
        });
        setThreads((prev) =>
          prev.map((t) =>
            t._id === thread._id ? { ...t, unreadForGuest: false } : t
          )
        );
      } catch {
        // Ignore
      }
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeThread._id,
          senderRole: "guest",
          senderName: fullName || user?.username || "Guest",
          guestEmail: user?.email || activeThread.guestEmail,
          guestAvatar: user?.avatar || "",
          text: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setReplyText("");
        setThreads((prev) =>
          prev.map((t) => (t._id === data.data._id ? data.data : t))
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async (e) => {
    e.preventDefault();
    if (!newRoomName || !newText.trim()) return;
    const roomObj = rooms.find((r) => r.roomName === newRoomName);
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentName: roomObj?.nameOfApartment || "SherryHomes Residence",
          roomName: newRoomName,
          guestName: fullName || user?.username || "Guest",
          guestEmail:
            user?.email || `${user?.username || "guest"}@sherryhomes.local`,
          guestAvatar: user?.avatar || "",
          senderRole: "guest",
          senderName: fullName || user?.username || "Guest",
          subject: newSubject.trim() || `Inquiry about ${newRoomName}`,
          text: newText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setNewModal(false);
        setNewSubject("");
        setNewText("");
        await loadThreads(true);
        setSelectedId(data.data._id);
      }
    } finally {
      setSending(false);
    }
  };

  if (hydrated && !isAuthenticated) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-sky-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <Lock className="mx-auto h-8 w-8 text-sky-600" />
          <h1 className="mt-3 font-display text-2xl font-semibold text-slate-900">
            Sign in to message apartment hosts
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            In-app communication with hosts regarding check-in, keybox, Wi-Fi,
            and bookings is unlocked once you sign in.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?redirect=/messages"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50">
              Create free account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            In-App Communication
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Messages
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Direct conversations with verified property hosts about your stays
            and upcoming check-ins.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewModal(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 self-start sm:self-auto whitespace-nowrap">
          <Plus className="h-4 w-4" />
          <span>New message</span>
        </button>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl border border-sky-200 bg-white" />
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-sky-200 bg-white p-10 text-center shadow-sm">
          <MessageSquare className="mx-auto h-8 w-8 text-sky-500" />
          <h2 className="mt-3 font-display text-xl font-semibold text-slate-900">
            No conversations yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Send a question about any apartment or upcoming reservation directly
            to the host team.
          </p>
          <button
            type="button"
            onClick={() => setNewModal(true)}
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            Message a host
          </button>
        </div>
      ) : (
        <div className="grid min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-sm lg:grid-cols-12">
          <div
            className={`border-b border-sky-100 lg:col-span-4 lg:border-b-0 lg:border-r ${
              activeThread ? "hidden lg:block" : "block"
            }`}>
            <div className="border-b border-sky-100 bg-sky-50/50 px-4 py-3 text-xs font-semibold text-slate-600">
              Conversations ({threads.length})
            </div>
            <div className="divide-y divide-sky-100">
              {threads.map((t) => {
                const lastMsg = t.messages?.[t.messages.length - 1];
                const isSelected = t._id === selectedId;
                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => handleSelectThread(t)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                      isSelected ? "bg-sky-50" : "hover:bg-sky-50/40"
                    }`}>
                    <Avatar
                      src={t.hostAvatar || "/images/avatars/host-stephen.jpg"}
                      name={t.hostName || "Stephen Saidimu"}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {t.roomName}
                        </p>
                        {t.unreadForGuest && (
                          <span className="text-[11px] font-semibold text-sky-700 shrink-0">
                            New reply
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-sky-700 truncate">
                        {t.apartmentName}
                      </p>
                      {lastMsg && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {lastMsg.senderName}: {lastMsg.text}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`flex flex-col lg:col-span-8 ${
              activeThread ? "flex" : "hidden lg:flex"
            }`}>
            {activeThread ? (
              <>
                <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/40 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      aria-label="Back to conversations"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 bg-white text-slate-700 lg:hidden">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <Avatar
                      src={
                        activeThread.hostAvatar ||
                        "/images/avatars/host-stephen.jpg"
                      }
                      name={activeThread.hostName || "Stephen Saidimu"}
                      size="sm"
                    />
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        {activeThread.roomName} · {activeThread.subject}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Host: {activeThread.hostName || "Stephen Saidimu"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-5 max-h-[420px]">
                  {(activeThread.messages || []).map((m) => {
                    const isMe = m.senderRole === "guest";
                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}>
                        <div
                          className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${
                            isMe ? "flex-row-reverse" : "flex-row"
                          }`}>
                          <Avatar
                            src={
                              isMe
                                ? user?.avatar || activeThread.guestAvatar
                                : activeThread.hostAvatar ||
                                  "/images/avatars/host-stephen.jpg"
                            }
                            name={m.senderName}
                            size="xs"
                          />
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm ${
                              isMe
                                ? "bg-sky-600 text-white"
                                : "border border-sky-100 bg-sky-50 text-slate-900"
                            }`}>
                            <p className="leading-relaxed">{m.text}</p>
                          </div>
                        </div>
                        <span className="mt-1 text-[11px] text-slate-400">
                          {m.senderName} ·{" "}
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleSendReply}
                  className="flex items-center gap-2 border-t border-sky-100 p-4">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply to the host..."
                    className="min-h-[44px] flex-1 rounded-xl border border-sky-200 px-3.5 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
                Select a conversation to view messages.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {newModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-sky-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-slate-900">
                New Message to Host
              </h3>
              <button
                type="button"
                onClick={() => setNewModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleStartConversation} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Suite
                </label>
                <select
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                  required>
                  {rooms.map((r) => (
                    <option key={r._id || r.roomName} value={r.roomName}>
                      {r.roomName} ({r.nameOfApartment})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Subject
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Check-in timing or amenities"
                  className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Write your question for the host..."
                  className="w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewModal(false)}
                  className="min-h-[42px] rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
