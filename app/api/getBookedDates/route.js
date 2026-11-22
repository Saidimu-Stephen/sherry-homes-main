/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import Booking from "../../models/bookedDates";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { roomName } = await req.json();
    const connected = await connectDB();
    if (!connected) {
      const bookings = roomName
        ? getStore().bookings.filter((b) => b.roomName === roomName)
        : getStore().bookings;
      return NextResponse.json(bookings);
    }

    const query = roomName ? { roomName } : {};
    const bookings = await Booking.find(query);
    return NextResponse.json(bookings || []);
  } catch (error) {
    console.error("getBookedDates error:", error);
    return NextResponse.json(getStore().bookings);
  }
}
