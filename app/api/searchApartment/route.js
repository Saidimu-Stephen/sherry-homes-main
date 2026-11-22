/** @format */

import apartmentDetails from "@/app/models/apartment";
import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";

export async function POST(req) {
  try {
    const { searchText } = await req.json();
    const query = (searchText || "").trim();

    const connected = await connectDB();
    if (!connected) {
      const searchedApartment = getStore().apartments.find(
        (a) => a.apartmentName.toLowerCase() === query.toLowerCase()
      );
      if (!searchedApartment) {
        return NextResponse.json({
          message: ["Apartment cannot be found in the database"],
        });
      }
      return NextResponse.json({
        message: ["Search successful"],
        data: searchedApartment,
      });
    }

    const searchedApartment = await apartmentDetails.findOne({
      apartmentName: new RegExp(`^${query}$`, "i"),
    });

    if (!searchedApartment) {
      return NextResponse.json({
        message: ["Apartment cannot be found in the database"],
      });
    }

    return NextResponse.json({
      message: ["Search successful"],
      data: searchedApartment,
    });
  } catch (error) {
    console.error("Error searching for apartments:", error);
    return NextResponse.json(
      { message: ["Unable to search apartments"] },
      { status: 500 }
    );
  }
}
