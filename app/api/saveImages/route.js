/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import MainImage from "@/app/models/mainImageModel";
import MinorImage from "../../models/minorImageModel";

export async function POST(req) {
  try {
    const { selectedRoomName, mainImage, minorImages } = await req.json();
    if (!selectedRoomName || !mainImage) {
      return NextResponse.json(
        { messages: ["Room name and main image are required."] },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const existingMain = store.mainImages.find(
        (m) => m.selectedRoomName === selectedRoomName
      );
      if (existingMain) {
        existingMain.mainImage = mainImage;
      } else {
        store.mainImages.push({
          _id: `img-main-${Date.now()}`,
          selectedRoomName,
          mainImage,
        });
      }

      const gallery = Array.isArray(minorImages) && minorImages.length > 0
        ? minorImages
        : [mainImage];

      const existingMinor = store.minorImages.find(
        (m) => m.selectedRoomName === selectedRoomName
      );
      if (existingMinor) {
        existingMinor.minorImages = gallery;
      } else {
        store.minorImages.push({
          _id: `img-minor-${Date.now()}`,
          selectedRoomName,
          minorImages: gallery,
        });
      }

      return NextResponse.json({ messages: ["Images saved successfully."] });
    }

    await MainImage.findOneAndUpdate(
      { selectedRoomName },
      { selectedRoomName, mainImage },
      { upsert: true, new: true }
    );

    const gallery = Array.isArray(minorImages) && minorImages.length > 0
      ? minorImages
      : [mainImage];

    await MinorImage.findOneAndUpdate(
      { selectedRoomName },
      { selectedRoomName, minorImages: gallery },
      { upsert: true, new: true }
    );

    return NextResponse.json({ messages: ["Images saved successfully."] });
  } catch (error) {
    console.error("Error:", error.message);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({
        messages: Object.values(error.errors).map((e) => e.message),
      });
    }
    return NextResponse.json(
      { messages: ["Unable to save images."] },
      { status: 500 }
    );
  }
}
