/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import Room from "../../models/roomDetails";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const connected = await connectDB();
    if (!connected) {
      return NextResponse.json(getStore().rooms);
    }

    const rooms = await Room.find({});
    return NextResponse.json(rooms);
  } catch (error) {
    console.error(error);
    return NextResponse.json(getStore().rooms);
  }
}
