/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import ApartmentDetails from "../../models/apartment";
import { NextResponse } from "next/server";

function toPublicApartment(apt) {
  return {
    _id: apt._id,
    apartmentName: apt.apartmentName,
    location: apt.location,
    hostName: apt.hostName || "Stephen Saidimu",
    hostAvatar: apt.hostAvatar || "/images/avatars/host-stephen.jpg",
    createdAt: apt.createdAt,
  };
}

export async function GET() {
  try {
    const connected = await connectDB();
    if (!connected) {
      return NextResponse.json(getStore().apartments.map(toPublicApartment));
    }

    const apartments = await ApartmentDetails.find({});
    return NextResponse.json(apartments.map(toPublicApartment));
  } catch (error) {
    console.error(error);
    return NextResponse.json(getStore().apartments.map(toPublicApartment));
  }
}
