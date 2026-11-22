/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import MinorImage from "../../models/minorImageModel";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { roomName } = await req.json();
    const connected = await connectDB();
    if (!connected) {
      const items = getStore().minorImages.filter(
        (m) => m.selectedRoomName === roomName
      );
      return NextResponse.json(items);
    }

    const minorImages = await MinorImage.find({
      selectedRoomName: roomName,
    });
    return NextResponse.json(minorImages || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json([]);
  }
}
