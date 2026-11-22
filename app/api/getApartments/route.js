/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import apartmentDetails from "../../models/apartment";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const connected = await connectDB();
    if (!connected) {
      return NextResponse.json(getStore().apartments);
    }

    const apartments = await apartmentDetails.find({});
    return NextResponse.json(apartments);
  } catch (error) {
    console.error(error);
    return NextResponse.json(getStore().apartments);
  }
}
