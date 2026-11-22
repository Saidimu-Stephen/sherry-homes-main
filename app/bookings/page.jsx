/** @format */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  KeyRound,
  Lock,
  MessageSquare,
  Smartphone,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { useAuthUser } from "@/app/lib/authClient";
import Avatar from "@/app/Components/Avatar";

export default function ClientBookingsPage() {
  const { user, isAuthenticated, hydrated } = useAuthUser();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [payTarget, setPayTarget] = useState(null);
  const [payMethod, setPayMethod] = useState("card");
  const [payDetail, setPayDetail] = useState("4242 4242 4242 4242");
  const [paying, setPaying] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const emailParam = user?.email
        ? `?guestEmail=${encodeURIComponent(user.email)}&includeAccess=true`
        : "?includeAccess=true";
      const payParam = user?.email
        ? `?guestEmail=${encodeURIComponent(user.email)}`
        : "";
      const [bkRes, payRes] = await Promise.all([
        fetch(`/api/bookings${emailParam}`),
        fetch(`/api/payments${payParam}`),
      ]);
      const [bkData, payData] = await Promise.all([
        bkRes.ok ? bkRes.json() : [],
        payRes.ok ? payRes.json() : [],
      ]);
      const filtered = (Array.isArray(bkData) ? bkData : []).filter(
        (b) => !b.isBlocked
      );
      setBookings(filtered);
      setPayments(Array.isArray(payData) ? payData : []);
    } catch (err) {
      console.error("Failed loading bookings:", err);
      setMessage({ type: "error", text: "Unable to load your bookings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      loadBookings();
    } else if (hydrated) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated, user?.email]);

  const handleCancel = async (id) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: data.msg });
        await loadBookings();
      } else {
        setMessage({ type: "error", text: data.msg || "Cancellation failed." });
      }
    } catch (err) {
      console.error("Cancel booking error:", err);
      setMessage({ type: "error", text: "Network error cancelling booking." });
    }
  };

  const handleCompletePayment = async (e) => {
    e.preventDefault();
    if (!payTarget) return;
    setPaying(true);
    try {
      const digits = payDetail.replace(/\D/g, "");
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: payTarget._id,
          action: "mark_paid",
          method: payMethod,
          last4: digits.slice(-4) || "4242",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Payment recorded for ${payTarget.roomName}. Once verified by the host, your keybox & Wi-Fi credentials will appear here.`,
        });
        setPayTarget(null);
        await loadBookings();
      } else {
        setMessage({
          type: "error",
          text: data.msg || "Unable to complete payment.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error processing payment." });
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPaymentForBooking = (bookingId) =>
    payments.find((p) => p.bookingId === bookingId);

  if (hydrated && !isAuthenticated) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-sky-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <Lock className="mx-auto h-8 w-8 text-sky-600" />
          <h1 className="mt-3 font-display text-2xl font-semibold text-slate-900">
            Sign in to view your bookings & check-in access
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Viewing available apartments is open to everyone, while personal
            reservations, receipts, keybox details, and Wi-Fi access require an
            account.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?redirect=/bookings"
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Client Portal
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            My Bookings & Stay Access
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track upcoming dates, complete payment, and receive your verified
            house keybox & Wi-Fi details once host-approved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 self-start sm:self-auto whitespace-nowrap">
          Browse more stays
        </Link>
      </div>

      {message.text && (
        <div
          role="alert"
          className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-36 animate-pulse rounded-2xl border border-sky-100 bg-white"
            />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-sky-200 bg-white p-10 text-center shadow-sm">
          <CalendarDays className="mx-auto h-8 w-8 text-sky-500" />
          <h2 className="mt-3 font-display text-xl font-semibold text-slate-900">
            No bookings for {user?.email || "this account"} yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Explore available apartments and select free dates on the calendar to
            create your reservation.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            Explore stays
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {bookings.map((bk) => {
            const payment = getPaymentForBooking(bk._id);
            const payStatus = payment?.status || bk.paymentStatus || "paid";
            const isApproved = Boolean(bk.hostApproved || payment?.hostApproved);
            const access = bk.accessDetails;

            return (
              <article
                key={bk._id}
                className="flex flex-col justify-between rounded-2xl border border-sky-200/80 bg-white p-5 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-sky-700">
                        {bk.apartmentName || "SherryHomes Residence"}
                      </p>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {bk.roomName}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-900 tabular-nums">
                        ${bk.totalPrice || payment?.amount || 0}
                      </p>
                      <p
                        className={`text-xs font-semibold capitalize ${
                          payStatus === "paid" && isApproved
                            ? "text-emerald-700"
                            : payStatus === "paid"
                            ? "text-sky-700"
                            : payStatus === "refunded"
                            ? "text-rose-700"
                            : "text-amber-700"
                        }`}>
                        {payStatus === "paid" && isApproved
                          ? "Paid · Access Approved"
                          : payStatus === "paid"
                          ? "Paid · Awaiting Host Approval"
                          : payStatus === "refunded"
                          ? "Refunded"
                          : "Payment pending"}
                      </p>
                    </div>
                  </div>

                  {/* Verified Host Transparency */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2">
                    <Avatar
                      src={bk.hostAvatar}
                      name={bk.hostName || "Stephen Saidimu"}
                      size="xs"
                    />
                    <div className="text-xs text-slate-600">
                      Host:{" "}
                      <span className="font-semibold text-slate-900">
                        {bk.hostName || "Stephen Saidimu"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 tabular-nums">
                    <span>
                      {formatDate(bk.checkInDate)} – {formatDate(bk.checkOutDate)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {bk.nights || bk.bookedDates?.length || 1} nights
                    </span>
                    {payment?.reference && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{payment.reference}</span>
                      </>
                    )}
                  </div>

                  {/* House Keybox + Check-in Instructions + Wi-Fi once approved */}
                  {payStatus === "paid" && isApproved && access ? (
                    <div className="space-y-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-900">
                          <KeyRound className="h-4 w-4 text-emerald-700" />
                          House Keybox & Check-in Instructions
                        </span>
                        <span className="rounded-md bg-white px-2 py-0.5 font-mono font-semibold text-emerald-800 border border-emerald-200">
                          Code: {access.keyboxCode}
                        </span>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        {access.keyboxInstructions}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-emerald-200/70 pt-2 text-slate-800">
                        <span className="inline-flex items-center gap-1.5">
                          <Wifi className="h-3.5 w-3.5 text-sky-700" />
                          <span>
                            Wi-Fi: <strong className="font-mono">{access.wifiName}</strong>
                          </span>
                        </span>
                        <span>
                          Password: <strong className="font-mono">{access.wifiPassword}</strong>
                        </span>
                      </div>
                    </div>
                  ) : payStatus === "paid" && !isApproved ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/80 p-3.5 text-xs text-sky-900">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                      <div>
                        <p className="font-semibold">
                          Payment received — waiting for host verification
                        </p>
                        <p className="mt-0.5 text-slate-600">
                          As soon as the host verifies your payment in Studio,
                          your keybox code, entry instructions, and Wi-Fi
                          credentials will unlock here automatically.
                        </p>
                      </div>
                    </div>
                  ) : payStatus === "pending" ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <p>
                        Complete payment below so the host can verify and release
                        your keybox details and Wi-Fi password.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sky-100 pt-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href="/messages"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline underline-offset-4">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Message host</span>
                    </Link>
                    {payStatus === "pending" && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayTarget(bk);
                          setPayMethod("card");
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Pay now</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCancel(bk._id)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Payment Settlement Modal */}
      {payTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-sky-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-sky-700">
                  Settle Booking Invoice
                </p>
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  {payTarget.roomName} · ${payTarget.totalPrice}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCompletePayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPayMethod("card");
                    setPayDetail("4242 4242 4242 4242");
                  }}
                  className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold ${
                    payMethod === "card"
                      ? "border-sky-600 bg-sky-50 text-sky-800"
                      : "border-sky-200 text-slate-700"
                  }`}>
                  <CreditCard className="h-4 w-4" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayMethod("mpesa");
                    setPayDetail("+254 712 345 678");
                  }}
                  className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold ${
                    payMethod === "mpesa"
                      ? "border-sky-600 bg-sky-50 text-sky-800"
                      : "border-sky-200 text-slate-700"
                  }`}>
                  <Smartphone className="h-4 w-4" />
                  <span>M-Pesa</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {payMethod === "card" ? "Card number" : "M-Pesa number"}
                </label>
                <input
                  type="text"
                  value={payDetail}
                  onChange={(e) => setPayDetail(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayTarget(null)}
                  className="min-h-[42px] rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                  {paying ? "Processing..." : `Pay $${payTarget.totalPrice}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
