/** @format */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Images,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
  X,
} from "lucide-react";
import { useAuthUser } from "@/app/lib/authClient";
import Avatar from "@/app/Components/Avatar";

const ROOM_TYPE_FILTERS = [
  { id: "all", label: "All suites" },
  { id: "loft", label: "Loft" },
  { id: "suite", label: "Suite" },
  { id: "penthouse", label: "Penthouse" },
  { id: "deluxe", label: "Deluxe" },
  { id: "single", label: "Single" },
  { id: "double", label: "Double" },
];

const CLEANING_FEE = 25;
const SERVICE_FEE = 20;

function formatDateKeyLocal(year, monthZeroIndexed, day) {
  return `${year}-${String(monthZeroIndexed + 1).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
}

export default function ClientStaysPage() {
  const { user, fullName, isAuthenticated } = useAuthUser();

  const [apartments, setApartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [mainImages, setMainImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Client filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [minGuests, setMinGuests] = useState(1);

  // Modals
  const [galleryRoom, setGalleryRoom] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [bookingRoom, setBookingRoom] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [messageTarget, setMessageTarget] = useState(null);

  const fetchAllClientData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [aptRes, roomRes, imgRes, revRes, bkRes] = await Promise.all([
        fetch("/api/getAvailableApartments"),
        fetch("/api/getAvailableRooms"),
        fetch("/api/getMainImages"),
        fetch("/api/reviews"),
        fetch("/api/bookings"),
      ]);

      const [aptData, roomData, imgData, revData, bkData] = await Promise.all([
        aptRes.ok ? aptRes.json() : [],
        roomRes.ok ? roomRes.json() : [],
        imgRes.ok ? imgRes.json() : [],
        revRes.ok ? revRes.json() : [],
        bkRes.ok ? bkRes.json() : [],
      ]);

      setApartments(Array.isArray(aptData) ? aptData : []);
      setRooms(Array.isArray(roomData) ? roomData : []);
      setMainImages(Array.isArray(imgData) ? imgData : []);
      setReviews(Array.isArray(revData) ? revData : []);
      setBookings(Array.isArray(bkData) ? bkData : []);
      setLoadError("");
    } catch (err) {
      console.error("Error loading client stays:", err);
      if (!silent) setLoadError("Unable to load available stays right now.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllClientData();
  }, []);

  const getMainImageForRoom = (roomName) => {
    const found = mainImages.find((img) => img.selectedRoomName === roomName);
    return found ? found.mainImage : null;
  };

  const getRoomRatingStats = (roomName) => {
    const roomReviews = reviews.filter((r) => r.roomName === roomName);
    if (roomReviews.length === 0) {
      return { avg: null, count: 0 };
    }
    const sum = roomReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return {
      avg: (sum / roomReviews.length).toFixed(1),
      count: roomReviews.length,
    };
  };

  const overallRating = useMemo(() => {
    if (reviews.length === 0) return "4.9";
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const openGallery = async (room) => {
    setGalleryRoom(room);
    setGalleryIndex(0);
    const mainImg = getMainImageForRoom(room.roomName);
    setGalleryImages(mainImg ? [mainImg] : []);

    try {
      const res = await fetch("/api/getMinorImages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: room.roomName }),
      });
      if (res.ok) {
        const data = await res.json();
        const extra = Array.isArray(data)
          ? data.flatMap((d) => d.minorImages || [])
          : [];
        const combined = [mainImg, ...extra].filter(Boolean);
        const unique = Array.from(new Set(combined));
        if (unique.length > 0) {
          setGalleryImages(unique);
        }
      }
    } catch (err) {
      console.error("Failed loading gallery:", err);
    }
  };

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return apartments
      .map((apt) => {
        const aptMatches =
          !q ||
          apt.apartmentName?.toLowerCase().includes(q) ||
          apt.location?.toLowerCase().includes(q);

        const aptRooms = rooms.filter((room) => {
          if (room.nameOfApartment !== apt.apartmentName) return false;
          const matchesType =
            roomTypeFilter === "all" ||
            (room.roomType || "").toLowerCase() === roomTypeFilter;
          const matchesGuests =
            Number(room.numberOfGuests || 1) >= minGuests;
          const matchesSearch =
            aptMatches ||
            room.roomName?.toLowerCase().includes(q) ||
            room.roomDescription?.toLowerCase().includes(q);
          return matchesType && matchesGuests && matchesSearch;
        });

        return { apartment: apt, rooms: aptRooms };
      })
      .filter((group) => group.rooms.length > 0);
  }, [apartments, rooms, searchQuery, roomTypeFilter, minGuests]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Landing Hero Showcase */}
      <section className="overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-sm">
        <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:p-10">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                Curated Apartment Living
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12] text-balance">
                Thoughtful apartments with verified availability and instant booking.
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Browse sunlit suites, inspect real-time free and booked days,
                and compare guest ratings openly. Sign in or create a free account
                when you are ready to book, pay, leave a review, or message a host.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#listings"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap">
                <span>Browse available stays</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              {!isAuthenticated ? (
                <Link
                  href="/register"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-sky-200 bg-sky-50/70 px-5 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-100/70 whitespace-nowrap">
                  Create free account
                </Link>
              ) : (
                <Link
                  href="/bookings"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-5 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-100/70 whitespace-nowrap">
                  <CalendarDays className="h-4 w-4" />
                  <span>My Bookings</span>
                </Link>
              )}
            </div>
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden bg-sky-100 lg:col-span-5 lg:aspect-auto lg:min-h-[340px]">
            <img
              src="/images/suite-showcase.jpg"
              alt="Sunlit SherryHomes living suite with courtyard view"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-950/20 lg:to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
              <span className="font-medium drop-shadow">
                Nairobi & Mombasa Residences
              </span>
              <span className="tabular-nums font-semibold drop-shadow">
                From $95 / night
              </span>
            </div>
          </div>
        </div>

        {/* Full-width 4-Column Proof Strip */}
        <div className="grid grid-cols-2 divide-y divide-x divide-sky-100 border-t border-sky-100 bg-sky-50/50 sm:grid-cols-4 sm:divide-y-0">
          <div className="p-4 sm:px-6">
            <p className="text-xs font-medium text-slate-500">Residences</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-slate-900 tabular-nums">
              {apartments.length} Locations
            </p>
          </div>
          <div className="p-4 sm:px-6">
            <p className="text-xs font-medium text-slate-500">Listed Suites</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-slate-900 tabular-nums">
              {rooms.length} Available
            </p>
          </div>
          <div className="p-4 sm:px-6">
            <p className="text-xs font-medium text-slate-500">Guest Rating</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-slate-900 tabular-nums">
              {overallRating} / 5.0
            </p>
          </div>
          <div className="p-4 sm:px-6">
            <p className="text-xs font-medium text-slate-500">Calendar Sync</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-slate-900 tabular-nums">
              Zero Double-Book
            </p>
          </div>
        </div>
      </section>

      {/* Public Browsing Notice for Guests without Account */}
      {!isAuthenticated && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/90 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">
                Browsing in guest preview:
              </span>{" "}
              You can view all apartments, photos, live free/booked calendar days,
              and read reviews without an account. Sign in to confirm bookings,
              submit payments, write ratings, or message hosts.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 whitespace-nowrap">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-sky-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-50 whitespace-nowrap">
              Create account
            </Link>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <section
        id="listings"
        className="mt-8 mb-8 rounded-2xl border border-sky-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, apartment, or suite..."
              aria-label="Search apartments and rooms"
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-sky-50/40 pl-10 pr-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="guestFilter" className="sr-only">
              Minimum guests
            </label>
            <select
              id="guestFilter"
              value={minGuests}
              onChange={(e) => setMinGuests(Number(e.target.value))}
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-sky-50/40 px-3.5 py-2.5 text-base text-slate-900 transition-colors focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:text-sm">
              <option value={1}>Any guest capacity</option>
              <option value={2}>2+ Guests</option>
              <option value={3}>3+ Guests</option>
              <option value={4}>4+ Guests</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setRoomTypeFilter("all");
                setMinGuests(1);
              }}
              className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50">
              Reset filters
            </button>
          </div>
        </div>

        {/* Segmented Room Type Filter */}
        <div
          role="tablist"
          aria-label="Filter by suite type"
          className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {ROOM_TYPE_FILTERS.map((tab) => {
            const active = roomTypeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRoomTypeFilter(tab.id)}
                className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? "bg-sky-600 text-white"
                    : "bg-sky-50 text-slate-700 hover:bg-sky-100"
                }`}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {loadError && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" />
          <span>{loadError}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
              <div className="aspect-[4/3] animate-pulse bg-sky-100" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-sky-100" />
                <div className="h-4 w-full animate-pulse rounded bg-sky-50" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-sky-50" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="rounded-2xl border border-sky-200/80 bg-white p-8 text-center shadow-sm sm:p-12">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            No matching stays found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Try clearing your search filters or exploring a different suite type
            or guest capacity.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setRoomTypeFilter("all");
                setMinGuests(1);
              }}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
              Show all stays
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredSections.map(({ apartment, rooms: aptRooms }) => (
            <section key={apartment._id || apartment.apartmentName}>
              <div className="mb-5 flex flex-col gap-2 border-b border-sky-200/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
                    {apartment.apartmentName}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-sky-700 shrink-0" />
                    <span>{apartment.location}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1">
                    <Avatar
                      src={apartment.hostAvatar}
                      name={apartment.hostName || "Stephen Saidimu"}
                      size="xs"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Hosted by{" "}
                      <strong className="text-slate-900">
                        {apartment.hostName || "Stephen Saidimu"}
                      </strong>
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 tabular-nums">
                    {aptRooms.length}{" "}
                    {aptRooms.length === 1
                      ? "suite available"
                      : "suites available"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {aptRooms.map((room) => {
                  const mainImg = getMainImageForRoom(room.roomName);
                  const stats = getRoomRatingStats(room.roomName);
                  const upcomingBookingsCount = bookings.filter(
                    (b) => b.roomName === room.roomName
                  ).length;

                  return (
                    <article
                      key={room._id || room.roomName}
                      className="flex flex-col overflow-hidden rounded-2xl border border-sky-200/80 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sky-50">
                        {mainImg ? (
                          <img
                            src={mainImg}
                            alt={`${room.roomName} at ${apartment.apartmentName}`}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-50 to-sky-100 text-slate-500">
                            <Building2 className="h-8 w-8 text-sky-400" />
                            <span className="text-xs font-medium">
                              {room.roomName}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openGallery(room)}
                          className="absolute bottom-3 right-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-950/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-slate-950">
                          <Images className="h-3.5 w-3.5" />
                          <span>Photos</span>
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium capitalize text-sky-700">
                                {room.roomType || "Suite"}
                              </p>
                              <h3 className="mt-0.5 text-lg font-semibold text-slate-900">
                                {room.roomName}
                              </h3>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-semibold text-slate-900 tabular-nums">
                                ${room.price}
                              </p>
                              <p className="text-xs text-slate-500">per night</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Users className="h-3.5 w-3.5 text-sky-600" />
                              {room.numberOfGuests} guests
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <BedDouble className="h-3.5 w-3.5 text-sky-600" />
                              {room.numberOfBeds} beds
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                              {stats.avg
                                ? `${stats.avg} (${stats.count})`
                                : "New listing"}
                            </span>
                          </div>

                          <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                            {room.roomDescription}
                          </p>
                        </div>

                        <div className="mt-5 space-y-2 border-t border-sky-100 pt-4">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={() =>
                                setBookingRoom({
                                  ...room,
                                  apartmentName: apartment.apartmentName,
                                })
                              }
                              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap">
                              {isAuthenticated
                                ? "Check calendar & book"
                                : "View calendar & prices"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setReviewTarget({
                                  ...room,
                                  apartmentName: apartment.apartmentName,
                                })
                              }
                              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-sky-50 whitespace-nowrap">
                              <Star className="h-4 w-4 text-amber-500" />
                              <span>Reviews</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-slate-500 tabular-nums">
                              {upcomingBookingsCount === 0
                                ? "All upcoming days open"
                                : `${upcomingBookingsCount} scheduled block${
                                    upcomingBookingsCount === 1 ? "" : "s"
                                  }`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setMessageTarget({
                                  ...room,
                                  apartmentName: apartment.apartmentName,
                                })
                              }
                              className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800 hover:underline underline-offset-4">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>Message host</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Gallery Modal */}
      {galleryRoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${galleryRoom.roomName} photo gallery`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-sky-100 px-5 py-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  {galleryRoom.roomName}
                </h3>
                <p className="text-xs text-slate-500">
                  {galleryImages.length > 0
                    ? `Photo ${galleryIndex + 1} of ${galleryImages.length}`
                    : "No additional photos uploaded"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGalleryRoom(null)}
                aria-label="Close gallery"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-200 text-slate-600 hover:bg-sky-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-[16/10] w-full bg-sky-50">
              {galleryImages[galleryIndex] ? (
                <img
                  src={galleryImages[galleryIndex]}
                  alt={`${galleryRoom.roomName} view ${galleryIndex + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No gallery photos available yet.
                </div>
              )}

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() =>
                      setGalleryIndex((prev) =>
                        prev > 0 ? prev - 1 : galleryImages.length - 1
                      )
                    }
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() =>
                      setGalleryIndex((prev) =>
                        prev < galleryImages.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto border-t border-sky-100 bg-sky-50/40 p-3">
                {galleryImages.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setGalleryIndex(i)}
                    className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === galleryIndex
                        ? "border-sky-600 ring-2 ring-sky-600/20"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}>
                    <img
                      src={src}
                      alt={`${galleryRoom.roomName} thumbnail ${i + 1}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking, Double-Booking Calendar & Payment Modal */}
      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          user={user}
          fullName={fullName}
          isAuthenticated={isAuthenticated}
          onClose={() => setBookingRoom(null)}
          onBooked={() => fetchAllClientData(true)}
        />
      )}

      {/* Ratings & Reviews Modal */}
      {reviewTarget && (
        <ReviewsModal
          room={reviewTarget}
          reviews={reviews.filter((r) => r.roomName === reviewTarget.roomName)}
          user={user}
          fullName={fullName}
          isAuthenticated={isAuthenticated}
          onClose={() => setReviewTarget(null)}
          onReviewCreated={(newRev) => {
            setReviews((prev) => [newRev, ...prev]);
          }}
        />
      )}

      {/* Direct Host Messaging Modal */}
      {messageTarget && (
        <QuickMessageModal
          room={messageTarget}
          user={user}
          fullName={fullName}
          isAuthenticated={isAuthenticated}
          onClose={() => setMessageTarget(null)}
        />
      )}
    </div>
  );
}

function BookingModal({
  room,
  user,
  fullName,
  isAuthenticated,
  onClose,
  onBooked,
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [bookedDayKeys, setBookedDayKeys] = useState(new Set());
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestName, setGuestName] = useState(fullName || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [notes, setNotes] = useState("");

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [mpesaPhone, setMpesaPhone] = useState("+254 712 345 678");

  const [status, setStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);
  const scrollContainerRef = React.useRef(null);

  useEffect(() => {
    if (fullName && !guestName) setGuestName(fullName);
    if (user?.email && !guestEmail) setGuestEmail(user.email);
  }, [fullName, user?.email, guestName, guestEmail]);

  const loadBookedDates = async () => {
    try {
      const res = await fetch("/api/getBookedDates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: room.roomName }),
      });
      if (!res.ok) return;
      const bookings = await res.json();
      const set = new Set();
      (Array.isArray(bookings) ? bookings : []).forEach((bk) => {
        (bk.bookedDates || []).forEach((d) => {
          const key = new Date(d).toISOString().split("T")[0];
          set.add(key);
        });
      });
      setBookedDayKeys(set);
    } catch (err) {
      console.error("Failed to fetch booked dates:", err);
    }
  };

  useEffect(() => {
    loadBookedDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.roomName]);

  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(`${checkIn}T00:00:00Z`);
    const end = new Date(`${checkOut}T00:00:00Z`);
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const subtotal = nightsCount * Number(room.price || 0);
  const totalPrice =
    nightsCount > 0 ? subtotal + CLEANING_FEE + SERVICE_FEE : 0;

  const daysInMonth = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const count = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    return { year, month, count, firstWeekday };
  }, [selectedMonth]);

  const today = new Date();
  const todayKey = formatDateKeyLocal(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Track month booked vs free future days
  const monthStats = useMemo(() => {
    let booked = 0;
    let free = 0;
    for (let d = 1; d <= daysInMonth.count; d++) {
      const k = formatDateKeyLocal(daysInMonth.year, daysInMonth.month, d);
      if (k < todayKey) continue;
      if (bookedDayKeys.has(k)) booked++;
      else free++;
    }
    return { booked, free };
  }, [daysInMonth, bookedDayKeys, todayKey]);

  const rangeCrossesBookedDate = (startKey, endKey) => {
    const cursor = new Date(`${startKey}T00:00:00Z`);
    const end = new Date(`${endKey}T00:00:00Z`);
    while (cursor < end) {
      const k = cursor.toISOString().split("T")[0];
      if (bookedDayKeys.has(k)) return k;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return null;
  };

  const handleDayClick = (dateKey, disabled) => {
    if (disabled) return;
    setConfirmedReceipt(null);
    setStatus({ type: "", text: "" });
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateKey);
      setCheckOut("");
    } else if (dateKey > checkIn) {
      const conflictDay = rangeCrossesBookedDate(checkIn, dateKey);
      if (conflictDay) {
        setStatus({
          type: "error",
          text: `Double-booking prevented: ${conflictDay} inside that range is already reserved. Pick continuous free days.`,
        });
        return;
      }
      setCheckOut(dateKey);
    } else {
      setCheckIn(dateKey);
      setCheckOut("");
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    if (!isAuthenticated) {
      setStatus({
        type: "error",
        text: "Please sign in or create an account to confirm and pay for a booking.",
      });
      return;
    }

    if (!checkIn || !checkOut || nightsCount <= 0) {
      setStatus({
        type: "error",
        text: "Please select valid check-in and check-out dates (at least 1 night).",
      });
      return;
    }

    const conflictDay = rangeCrossesBookedDate(checkIn, checkOut);
    if (conflictDay) {
      setStatus({
        type: "error",
        text: `Double-booking prevented: ${conflictDay} is already booked. Choose open dates.`,
      });
      return;
    }

    if (!guestName.trim()) {
      setStatus({
        type: "error",
        text: "Please enter the primary guest name.",
      });
      return;
    }

    const effectiveEmail = (guestEmail || user?.email || "").trim();
    if (!effectiveEmail || !effectiveEmail.includes("@")) {
      setStatus({
        type: "error",
        text: "Please enter a valid guest email address.",
      });
      return;
    }

    if (
      paymentMethod === "card" &&
      cardNumber.replace(/\s+/g, "").length < 12
    ) {
      setStatus({
        type: "error",
        text: "Please enter a valid card number (at least 12 digits).",
      });
      return;
    }

    if (paymentMethod === "mpesa" && mpesaPhone.trim().length < 9) {
      setStatus({
        type: "error",
        text: "Please enter a valid M-Pesa phone number.",
      });
      return;
    }

    const dates = [];
    const cursor = new Date(`${checkIn}T00:00:00Z`);
    const end = new Date(`${checkOut}T00:00:00Z`);
    while (cursor < end) {
      dates.push(cursor.toISOString());
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const digits = cardNumber.replace(/\D/g, "");
    const phoneDigits = mpesaPhone.replace(/\D/g, "");
    const last4 =
      paymentMethod === "card"
        ? digits.slice(-4) || "4242"
        : paymentMethod === "mpesa"
        ? phoneDigits.slice(-4) || "5678"
        : "";

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInDate: new Date(`${checkIn}T00:00:00Z`).toISOString(),
          checkOutDate: new Date(`${checkOut}T00:00:00Z`).toISOString(),
          roomName: room.roomName,
          apartmentName: room.apartmentName,
          guestName: guestName.trim(),
          guestEmail: effectiveEmail,
          guestAvatar: user?.avatar || "",
          subtotal,
          cleaningFee: CLEANING_FEE,
          serviceFee: SERVICE_FEE,
          totalPrice,
          paymentMethod,
          last4,
          notes: notes.trim(),
          myBookingDates: dates,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmedReceipt({
          roomName: room.roomName,
          apartmentName: room.apartmentName,
          checkIn,
          checkOut,
          nights: nightsCount,
          totalPrice,
          paymentMethod,
          reference: data.payment?.reference || "Confirmed",
        });
        setStatus({
          type: "success",
          text:
            paymentMethod === "property"
              ? `Reservation confirmed for ${nightsCount} night${
                  nightsCount === 1 ? "" : "s"
                } ($${totalPrice} due on arrival).`
              : `Payment received & stay confirmed ($${totalPrice}) for ${nightsCount} night${
                  nightsCount === 1 ? "" : "s"
                }. Keybox & Wi-Fi details unlock once the host approves your payment.`,
        });
        await loadBookedDates();
        if (onBooked) onBooked();
        setCheckIn("");
        setCheckOut("");
        setNotes("");
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setStatus({
          type: "error",
          text: Array.isArray(data.msg)
            ? data.msg[0]
            : data.msg || "Booking failed.",
        });
      }
    } catch (err) {
      console.error("Booking error:", err);
      setStatus({
        type: "error",
        text: "Network error while submitting booking.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Availability and booking for ${room.roomName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="my-auto w-full max-w-2xl rounded-2xl border border-sky-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-sky-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium text-sky-700">
              {room.apartmentName}
            </p>
            <h3 className="font-display text-xl font-semibold text-slate-900">
              {room.roomName} · ${room.price}/night
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking dialog"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-200 text-slate-600 hover:bg-sky-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          ref={scrollContainerRef}
          onSubmit={handleConfirmBooking}
          noValidate
          className="max-h-[80vh] overflow-y-auto space-y-5 p-5 sm:p-6">
          {confirmedReceipt ? (
            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                <div className="space-y-1">
                  <h4 className="font-display text-lg font-semibold text-emerald-950">
                    Stay Confirmed!
                  </h4>
                  <p className="text-sm text-emerald-900">{status.text}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-emerald-200/80 bg-white p-4 text-xs sm:grid-cols-4">
                <div>
                  <span className="block text-slate-500">Reference</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {confirmedReceipt.reference}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500">Check-in</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {confirmedReceipt.checkIn}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500">Check-out</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {confirmedReceipt.checkOut}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500">Total Paid</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    ${confirmedReceipt.totalPrice}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  href="/bookings"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700">
                  Go to My Bookings
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmedReceipt(null)}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-sky-50">
                  Book another date
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          ) : null}

          {!confirmedReceipt && status.text && (
            <div
              role="alert"
              className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
                status.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}>
              {status.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
              )}
              <div>
                <p>{status.text}</p>
              </div>
            </div>
          )}

          {/* Month Calendar */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setSelectedMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 bg-white text-slate-700 hover:bg-sky-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <span className="block text-sm font-semibold text-slate-900">
                  {selectedMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {monthStats.free} free days · {monthStats.booked} booked days
                </span>
              </div>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setSelectedMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 bg-white text-slate-700 hover:bg-sky-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daysInMonth.firstWeekday }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth.count }).map((_, idx) => {
                const day = idx + 1;
                const key = formatDateKeyLocal(
                  daysInMonth.year,
                  daysInMonth.month,
                  day
                );
                const isPast = key < todayKey;
                const isBooked = bookedDayKeys.has(key);
                const disabled = isPast || isBooked;
                const isSelected =
                  key === checkIn ||
                  key === checkOut ||
                  (checkIn && checkOut && key > checkIn && key < checkOut);

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDayClick(key, disabled)}
                    title={
                      isBooked
                        ? "Unavailable (booked)"
                        : isPast
                        ? "Past date"
                        : "Free date — click to select"
                    }
                    className={`min-h-[38px] rounded-lg border text-xs font-medium tabular-nums transition-colors ${
                      isBooked
                        ? "border-rose-200 bg-rose-50 text-rose-500 line-through cursor-not-allowed"
                        : isPast
                        ? "border-transparent text-slate-300 cursor-not-allowed"
                        : isSelected
                        ? "border-sky-600 bg-sky-600 text-white"
                        : "border-sky-100 bg-white text-slate-800 hover:bg-sky-50"
                    }`}>
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" />
                Selected stay
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-sky-200 bg-white" />
                Free day
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-200" />
                Booked (locked)
              </span>
            </div>
          </div>

          {/* Date summary & breakdown */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-sky-100 bg-sky-50/40 px-3.5 py-2.5">
              <span className="block text-[11px] font-medium text-slate-500">
                Check-in
              </span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {checkIn || "Select on calendar"}
              </span>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50/40 px-3.5 py-2.5">
              <span className="block text-[11px] font-medium text-slate-500">
                Check-out
              </span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {checkOut || "Select on calendar"}
              </span>
            </div>
          </div>

          {nightsCount > 0 && (
            <div className="space-y-1.5 rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-sm tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span>
                  ${room.price} × {nightsCount} night
                  {nightsCount === 1 ? "" : "s"}
                </span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cleaning & linen preparation</span>
                <span>${CLEANING_FEE}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform protection fee</span>
                <span>${SERVICE_FEE}</span>
              </div>
              <div className="flex justify-between border-t border-sky-200 pt-2 font-semibold text-slate-900">
                <span>Total due</span>
                <span>${totalPrice}</span>
              </div>
            </div>
          )}

          {!isAuthenticated ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Sign in required to reserve and pay
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Viewing availability and estimating stay pricing is open to
                      everyone. Create an account or sign in to lock your dates
                      and complete payment.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/login"
                      className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700">
                      Sign in to book
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-50">
                      Create free account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="bkGuestName"
                    className="block text-xs font-semibold text-slate-700">
                    Primary guest name
                  </label>
                  <input
                    id="bkGuestName"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="bkGuestEmail"
                    className="block text-xs font-semibold text-slate-700">
                    Guest email
                  </label>
                  <input
                    id="bkGuestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                    required
                  />
                </div>
              </div>

              {/* Payment Method Management */}
              <div className="space-y-3 rounded-xl border border-sky-200 p-4">
                <p className="text-xs font-semibold text-slate-800">
                  Payment method
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      paymentMethod === "card"
                        ? "border-sky-600 bg-sky-50 text-sky-800"
                        : "border-sky-100 bg-white text-slate-700 hover:bg-sky-50/60"
                    }`}>
                    <CreditCard className="h-4 w-4" />
                    <span>Debit / Credit Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mpesa")}
                    className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      paymentMethod === "mpesa"
                        ? "border-sky-600 bg-sky-50 text-sky-800"
                        : "border-sky-100 bg-white text-slate-700 hover:bg-sky-50/60"
                    }`}>
                    <Smartphone className="h-4 w-4" />
                    <span>M-Pesa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("property")}
                    className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      paymentMethod === "property"
                        ? "border-sky-600 bg-sky-50 text-sky-800"
                        : "border-sky-100 bg-white text-slate-700 hover:bg-sky-50/60"
                    }`}>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Pay on Arrival</span>
                  </button>
                </div>

                {paymentMethod === "card" && (
                  <div className="space-y-1">
                    <label
                      htmlFor="cardNum"
                      className="block text-xs font-medium text-slate-600">
                      Card number
                    </label>
                    <input
                      id="cardNum"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 font-mono text-sm text-slate-900"
                    />
                  </div>
                )}

                {paymentMethod === "mpesa" && (
                  <div className="space-y-1">
                    <label
                      htmlFor="mpesaNum"
                      className="block text-xs font-medium text-slate-600">
                      M-Pesa mobile number
                    </label>
                    <input
                      id="mpesaNum"
                      type="tel"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="+254 712 345 678"
                      className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="bkNotes"
                    className="block text-xs font-medium text-slate-600">
                    Arrival note for host (optional)
                  </label>
                  <input
                    id="bkNotes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Estimated arrival time or special request..."
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              {!confirmedReceipt && status.type === "error" && status.text && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                  <span>{status.text}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || nightsCount <= 0}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50 sm:w-auto">
                  {submitting
                    ? "Confirming..."
                    : nightsCount > 0
                    ? paymentMethod === "property"
                      ? `Confirm reservation ($${totalPrice} due later)`
                      : `Pay $${totalPrice} & confirm stay`
                    : "Select dates to book"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function ReviewsModal({
  room,
  reviews,
  user,
  fullName,
  isAuthenticated,
  onClose,
  onReviewCreated,
}) {
  const [guestName, setGuestName] = useState(fullName || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    if (fullName && !guestName) setGuestName(fullName);
  }, [fullName, guestName]);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : null;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    if (!isAuthenticated) {
      setFeedback({
        type: "error",
        text: "Please sign in before posting a rating or review.",
      });
      return;
    }

    if (!guestName.trim() || !comment.trim()) {
      setFeedback({
        type: "error",
        text: "Please enter your name and review comment.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentName: room.apartmentName,
          roomName: room.roomName,
          guestName: guestName.trim(),
          guestAvatar: user?.avatar || "",
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", text: data.msg });
        setComment("");
        if (data.data) {
          onReviewCreated(data.data);
        }
      } else {
        setFeedback({
          type: "error",
          text: data.msg || "Could not submit review.",
        });
      }
    } catch (err) {
      console.error("Review submit error:", err);
      setFeedback({ type: "error", text: "Network error submitting review." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ratings and reviews for ${room.roomName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="my-auto w-full max-w-xl rounded-2xl border border-sky-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-sky-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium text-sky-700">
              {room.apartmentName}
            </p>
            <h3 className="font-display text-xl font-semibold text-slate-900">
              {room.roomName} · Guest Ratings
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
              {avgRating
                ? `${avgRating} average across ${reviews.length} review${
                    reviews.length === 1 ? "" : "s"
                  }`
                : "No guest reviews yet"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reviews dialog"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-200 text-slate-600 hover:bg-sky-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-6">
          {!isAuthenticated ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4">
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Account required to post a review
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Anyone can read guest feedback below. Sign in or create an
                      account to rate this suite.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/login"
                      className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-sky-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-50">
                      Create account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitReview}
              className="space-y-4 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
              <h4 className="text-sm font-semibold text-slate-900">
                Leave a rating
              </h4>

              {feedback.text && (
                <div
                  role="alert"
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    feedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}>
                  {feedback.text}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="mr-2 text-xs font-medium text-slate-600">
                  Your rating:
                </span>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    aria-label={`Rate ${num} out of 5`}
                    className="p-1 transition-transform hover:scale-110">
                    <Star
                      className={`h-5 w-5 ${
                        num <= rating
                          ? "fill-amber-400 text-amber-500"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="min-h-[42px] w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                required
              />

              <textarea
                rows={3}
                placeholder="Share what stood out about this apartment suite..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60">
                {submitting ? "Submitting..." : "Submit review"}
              </button>
            </form>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Recent guest feedback
            </h4>
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">
                No reviews posted for this room yet.
              </p>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="rounded-xl border border-sky-100 bg-white p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Avatar
                        src={rev.guestAvatar}
                        name={rev.guestName}
                        size="xs"
                      />
                      <span>{rev.guestName}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      {rev.rating}.0
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {rev.comment}
                  </p>
                  <p className="text-xs text-slate-400">
                    {rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString()
                      : "Recently"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickMessageModal({
  room,
  user,
  fullName,
  isAuthenticated,
  onClose,
}) {
  const [text, setText] = useState("");
  const [subject, setSubject] = useState(`Inquiry about ${room.roomName}`);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    setFeedback({ type: "", text: "" });
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentName: room.apartmentName,
          roomName: room.roomName,
          guestName: fullName || user?.username || "Guest",
          guestEmail: user?.email || `${user?.username || "guest"}@sherryhomes.local`,
          guestAvatar: user?.avatar || "",
          senderRole: "guest",
          senderName: fullName || user?.username || "Guest",
          subject: subject.trim(),
          text: text.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: "Message sent to the host! Continue the conversation in Messages.",
        });
        setText("");
      } else {
        setFeedback({
          type: "error",
          text: data.msg || "Could not send message.",
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error sending message." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Message host about ${room.roomName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-sky-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-sky-700">
              {room.apartmentName}
            </p>
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Message Host · {room.roomName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close message dialog"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-slate-600 hover:bg-sky-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-4 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
            <div className="flex items-start gap-2.5">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              <p className="text-sm text-slate-700">
                Sign in or create an account to send direct messages to the host
                and keep track of replies.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700">
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-50">
                Create account
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {feedback.text && (
              <div
                role="alert"
                className={`rounded-xl border px-3.5 py-2.5 text-xs ${
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
                }`}>
                <p>{feedback.text}</p>
                {feedback.type === "success" && (
                  <Link
                    href="/messages"
                    className="mt-1 inline-block font-semibold underline underline-offset-4">
                    Open Messages Inbox
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Message
              </label>
              <textarea
                rows={4}
                placeholder="Ask about check-in times, Wi-Fi speed, parking, or long-stay discounts..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Close
              </button>
              <button
                type="submit"
                disabled={sending}
                className="min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                {sending ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}