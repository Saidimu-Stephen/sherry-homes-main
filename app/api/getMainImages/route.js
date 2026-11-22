/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import MainImage from "../../models/mainImageModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const connected = await connectDB();
    if (!connected) {
      return NextResponse.json(getStore().mainImages);
    }

    const mainImage = await MainImage.find({});
    return NextResponse.json(mainImage);
  } catch (error) {
    console.error(error);
    return NextResponse.json(getStore().mainImages);
  }
}
