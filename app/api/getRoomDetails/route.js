/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import Room from "../../models/roomDetails";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { Apartment_Name } = await req.json();
    const connected = await connectDB();
    if (!connected) {
      const rooms = getStore().rooms.filter(
        (r) => r.nameOfApartment === Apartment_Name
      );
      return NextResponse.json(rooms);
    }

    const rooms = await Room.find({ nameOfApartment: Apartment_Name });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error(error);
    return NextResponse.json([]);
  }
}
