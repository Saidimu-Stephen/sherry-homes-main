/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import MinorImage from "../../models/minorImageModel";
import MainImage from "@/app/models/mainImageModel";

export async function POST(req) {
  try {
    const { selectedRoomName } = await req.json();
    const connected = await connectDB();

    if (!connected) {
      const store = getStore();
      const mainImage = store.mainImages.filter(
        (m) => m.selectedRoomName === selectedRoomName
      );
      const minorImages = store.minorImages.filter(
        (m) => m.selectedRoomName === selectedRoomName
      );

      if (mainImage.length === 0 && minorImages.length === 0) {
        return NextResponse.json({
          mainImage: null,
          minorImages: null,
          message: "No Images found in the database",
        });
      }
      return NextResponse.json({ mainImage, minorImages });
    }

    const mainImage = await MainImage.find({ selectedRoomName });
    const minorImages = await MinorImage.find({ selectedRoomName });

    if (mainImage.length === 0 && minorImages.length === 0) {
      return NextResponse.json({
        mainImage: null,
        minorImages: null,
        message: "No Images found in the database",
      });
    }
    return NextResponse.json({ mainImage, minorImages });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({
        messages: Object.values(error.errors).map((e) => e.message),
      });
    }
    return NextResponse.json({ messages: ["Internal Server Error."] });
  }
}