/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore, toDateKey } from "@/app/lib/store";
import Booking from "../../models/bookedDates";
import Payment from "../../models/payment";
import ApartmentDetails from "../../models/apartment";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

function buildRequestedDayKeys(checkInDate, checkOutDate, myBookingDates) {
  if (Array.isArray(myBookingDates) && myBookingDates.length > 0) {
    return Array.from(
      new Set(myBookingDates.map((d) => toDateKey(d)).filter(Boolean))
    );
  }
  const startKey = toDateKey(checkInDate);
  const endKey = toDateKey(checkOutDate);
  if (!startKey || !endKey) return [];
  const cursor = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);
  const keys = [];
  while (cursor < end) {
    keys.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function enrichBookingsWithAccess(bookings, apartments, includeAccess) {
  const aptMap = new Map();
  (apartments || []).forEach((a) => {
    if (a.apartmentName) aptMap.set(a.apartmentName, a);
  });

  return bookings.map((raw) => {
    const b = typeof raw.toObject === "function" ? raw.toObject() : { ...raw };
    const apt = aptMap.get(b.apartmentName);
    const isUnlocked =
      includeAccess &&
      !b.isBlocked &&
      b.paymentStatus === "paid" &&
      Boolean(b.hostApproved);

    return {
      ...b,
      hostName: apt?.hostName || "Stephen Saidimu",
      hostAvatar: apt?.hostAvatar || "/images/avatars/host-stephen.jpg",
      ...(isUnlocked && apt
        ? {
            accessDetails: {
              keyboxCode: apt.keyboxCode || "4829#",
              keyboxInstructions:
                apt.keyboxInstructions ||
                "Smart lockbox beside entrance door. Enter code + # to retrieve keycard.",
              wifiName: apt.wifiName || "SherryHomes-Fiber-5G",
              wifiPassword: apt.wifiPassword || "WelcomeStay2026",
              approvedBy: b.approvedBy || apt.hostName || "Stephen Saidimu",
            },
          }
        : {}),
    };
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get("roomName");
    const guestEmail = searchParams.get("guestEmail");
    const includeAccess = searchParams.get("includeAccess") === "true";

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      let list = store.bookings;
      if (roomName) {
        list = list.filter((b) => b.roomName === roomName);
      }
      if (guestEmail) {
        const lower = guestEmail.toLowerCase();
        list = list.filter(
          (b) => (b.guestEmail || "").toLowerCase() === lower
        );
      }
      return NextResponse.json(
        enrichBookingsWithAccess(list, store.apartments, includeAccess)
      );
    }

    const query = {};
    if (roomName) query.roomName = roomName;
    if (guestEmail) query.guestEmail = guestEmail.toLowerCase();

    const [bookings, apartments] = await Promise.all([
      Booking.find(query).sort({ checkInDate: 1 }),
      includeAccess ? ApartmentDetails.find({}) : ApartmentDetails.find({}, "apartmentName hostName hostAvatar"),
    ]);

    return NextResponse.json(
      enrichBookingsWithAccess(bookings, apartments, includeAccess)
    );
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(getStore().bookings);
  }
}

export async function POST(req) {
  try {
    const {
      checkInDate,
      checkOutDate,
      roomName,
      apartmentName = "",
      guestName = "Guest",
      guestEmail = "",
      guestAvatar = "",
      totalPrice = 0,
      subtotal = 0,
      cleaningFee = 0,
      serviceFee = 0,
      paymentMethod = "card",
      last4 = "",
      isBlocked = false,
      notes = "",
      myBookingDates,
    } = await req.json();

    if (!checkInDate || !checkOutDate || !roomName) {
      return NextResponse.json(
        {
          msg: ["Check-in, check-out, and suite selection are required."],
          success: false,
        },
        { status: 400 }
      );
    }

    const dayKeys = buildRequestedDayKeys(
      checkInDate,
      checkOutDate,
      myBookingDates
    );

    if (dayKeys.length === 0) {
      return NextResponse.json(
        {
          msg: ["Check-out date must be at least 1 night after check-in."],
          success: false,
        },
        { status: 400 }
      );
    }

    const isoDates = dayKeys.map((k) => new Date(`${k}T00:00:00.000Z`).toISOString());
    const newDaySet = new Set(dayKeys);
    const nights = dayKeys.length;

    const paymentStatus = isBlocked
      ? "blocked"
      : paymentMethod === "property"
      ? "pending"
      : "paid";

    const connected = await connectDB();

    if (!connected) {
      const store = getStore();
      const conflictBooking = store.bookings
        .filter((b) => b.roomName === roomName)
        .find((b) =>
          (b.bookedDates || []).some((d) => newDaySet.has(toDateKey(d)))
        );

      if (conflictBooking) {
        return NextResponse.json(
          {
            msg: [
              `Double booking prevented: ${roomName} is already reserved during ${dayKeys[0]} – ${toDateKey(
                checkOutDate
              )}.`,
            ],
            success: false,
          },
          { status: 409 }
        );
      }

      const bookingId = `bk-${Date.now()}`;
      const created = {
        _id: bookingId,
        checkInDate: isoDates[0],
        checkOutDate: new Date(`${toDateKey(checkOutDate)}T00:00:00.000Z`).toISOString(),
        roomName,
        apartmentName,
        guestName: isBlocked ? "Host Maintenance Block" : guestName || "Guest",
        guestEmail: (guestEmail || "").toLowerCase(),
        guestAvatar: guestAvatar || "/images/avatars/guest-amina.jpg",
        nights,
        totalPrice: isBlocked ? 0 : Number(totalPrice) || 0,
        paymentStatus,
        hostApproved: false,
        approvedBy: "",
        paymentMethod: isBlocked ? "host_block" : paymentMethod,
        isBlocked: Boolean(isBlocked),
        notes,
        bookedDates: isoDates,
        createdAt: new Date().toISOString(),
      };
      store.bookings.unshift(created);

      let paymentRecord = null;
      if (!isBlocked) {
        paymentRecord = {
          _id: `pay-${Date.now()}`,
          bookingId,
          roomName,
          apartmentName,
          guestName: guestName || "Guest",
          guestEmail: (guestEmail || "").toLowerCase(),
          guestAvatar: guestAvatar || "/images/avatars/guest-amina.jpg",
          nights,
          subtotal: Number(subtotal) || Number(totalPrice) || 0,
          cleaningFee: Number(cleaningFee) || 0,
          serviceFee: Number(serviceFee) || 0,
          amount: Number(totalPrice) || 0,
          method: paymentMethod,
          last4: last4 || (paymentMethod === "card" ? "4242" : ""),
          reference: `SH-PAY-${Math.floor(1000 + Math.random() * 9000)}`,
          status: paymentStatus,
          hostApproved: false,
          approvedBy: "",
          createdAt: new Date().toISOString(),
        };
        store.payments.unshift(paymentRecord);
      }

      return NextResponse.json({
        msg: [
          isBlocked
            ? "Dates blocked on calendar."
            : "Booking confirmed! Keybox & Wi-Fi unlock once the host verifies payment.",
        ],
        success: true,
        data: created,
        payment: paymentRecord,
      });
    }

    const existingBookings = await Booking.find({ roomName });
    const hasConflict = existingBookings.some((b) =>
      (b.bookedDates || []).some((d) => newDaySet.has(toDateKey(d)))
    );

    if (hasConflict) {
      return NextResponse.json(
        {
          msg: [
            `Double booking prevented: ${roomName} already has an overlapping reservation.`,
          ],
          success: false,
        },
        { status: 409 }
      );
    }

    const created = await Booking.create({
      checkInDate: isoDates[0],
      checkOutDate: new Date(`${toDateKey(checkOutDate)}T00:00:00.000Z`).toISOString(),
      roomName,
      apartmentName,
      guestName: isBlocked ? "Host Maintenance Block" : guestName || "Guest",
      guestEmail: (guestEmail || "").toLowerCase(),
      guestAvatar: guestAvatar || "/images/avatars/guest-amina.jpg",
      nights,
      totalPrice: isBlocked ? 0 : Number(totalPrice) || 0,
      paymentStatus,
      hostApproved: false,
      approvedBy: "",
      paymentMethod: isBlocked ? "host_block" : paymentMethod,
      isBlocked: Boolean(isBlocked),
      notes,
      bookedDates: isoDates,
    });

    let paymentRecord = null;
    if (!isBlocked) {
      paymentRecord = await Payment.create({
        bookingId: String(created._id),
        roomName,
        apartmentName,
        guestName: guestName || "Guest",
        guestEmail: (guestEmail || "").toLowerCase(),
        guestAvatar: guestAvatar || "/images/avatars/guest-amina.jpg",
        nights,
        subtotal: Number(subtotal) || Number(totalPrice) || 0,
        cleaningFee: Number(cleaningFee) || 0,
        serviceFee: Number(serviceFee) || 0,
        amount: Number(totalPrice) || 0,
        method: paymentMethod,
        last4: last4 || (paymentMethod === "card" ? "4242" : ""),
        reference: `SH-PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        status: paymentStatus,
        hostApproved: false,
        approvedBy: "",
      });
    }

    return NextResponse.json({
      msg: [
        isBlocked
          ? "Dates blocked on calendar."
          : "Booking confirmed! Keybox & Wi-Fi unlock once the host verifies payment.",
      ],
      success: true,
      data: created,
      payment: paymentRecord,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errorList = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { msg: errorList, success: false },
        { status: 400 }
      );
    }
    console.error("POST bookings error:", error);
    return NextResponse.json(
      { msg: ["Unable to complete booking."], success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { msg: "Booking ID is required.", success: false },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const target = store.bookings.find((b) => b._id === id);
      if (!target) {
        return NextResponse.json(
          { msg: "Booking not found.", success: false },
          { status: 404 }
        );
      }
      store.bookings = store.bookings.filter((b) => b._id !== id);
      store.payments = store.payments.map((p) =>
        p.bookingId === id && p.status === "paid"
          ? { ...p, status: "refunded", hostApproved: false }
          : p
      );
      return NextResponse.json({
        msg: target.isBlocked
          ? "Blocked dates released back to free inventory."
          : "Booking cancelled and dates released.",
        success: true,
      });
    }

    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { msg: "Booking not found.", success: false },
        { status: 404 }
      );
    }

    await Payment.updateMany(
      { bookingId: String(id), status: "paid" },
      { status: "refunded", hostApproved: false }
    );

    return NextResponse.json({
      msg: deleted.isBlocked
        ? "Blocked dates released back to free inventory."
        : "Booking cancelled and dates released.",
      success: true,
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json(
      { msg: "Unable to cancel booking.", success: false },
      { status: 500 }
    );
  }
}
