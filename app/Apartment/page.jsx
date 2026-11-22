/** @format */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

function Apartment() {
  const [apartmentName, setApartmentName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!location.trim() || !apartmentName.trim()) {
      setError("Please fill in both apartment name and location.");
      return;
    }

    if (apartmentName.trim().length < 3 || location.trim().length < 2) {
      setError("Please enter a valid apartment name and location.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/apartmentDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apartmentName: apartmentName.trim(),
          location: location.trim(),
        }),
      });
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.msg || "Failed to submit data");
      }
      setMessage(responseData.msg);
      setApartmentName("");
      setLocation("");
    } catch (err) {
      setError(err.message || "Failed to submit data");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-sky-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Property Management
            </p>
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              Add New Apartment
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 whitespace-nowrap">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to stays</span>
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium text-slate-800"
              htmlFor="apartmentName">
              Apartment name
            </label>
            <input
              className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3.5 py-2.5 text-base text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              type="text"
              id="apartmentName"
              placeholder="e.g. Westlands Atrium"
              value={apartmentName}
              onChange={(e) => setApartmentName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium text-slate-800"
              htmlFor="location">
              Location
            </label>
            <input
              className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3.5 py-2.5 text-base text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
              type="text"
              id="location"
              placeholder="e.g. Nairobi, Westlands"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60">
            {submitting ? "Saving..." : "Save apartment"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Apartment;
