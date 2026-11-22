/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import Review from "@/app/models/review";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get("roomName");
    const apartmentName = searchParams.get("apartmentName");

    const connected = await connectDB();
    if (!connected) {
      let reviews = getStore().reviews;
      if (roomName) {
        reviews = reviews.filter((r) => r.roomName === roomName);
      }
      if (apartmentName) {
        reviews = reviews.filter((r) => r.apartmentName === apartmentName);
      }
      return NextResponse.json(reviews);
    }

    const query = {};
    if (roomName) query.roomName = roomName;
    if (apartmentName) query.apartmentName = apartmentName;

    const reviews = await Review.find(query).sort({ createdAt: -1 });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(getStore().reviews);
  }
}

export async function POST(req) {
  try {
    const { apartmentName, roomName, guestName, guestAvatar = "", rating, comment } =
      await req.json();

    const numericRating = Number(rating);
    if (
      !apartmentName ||
      !roomName ||
      !guestName?.trim() ||
      !comment?.trim() ||
      Number.isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          msg: "Apartment, room, name, rating (1-5), and review comment are required.",
        },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const created = {
        _id: `rev-${Date.now()}`,
        apartmentName: apartmentName.trim(),
        roomName: roomName.trim(),
        guestName: guestName.trim(),
        guestAvatar: guestAvatar || "/images/avatars/guest-amina.jpg",
        rating: numericRating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };
      getStore().reviews.unshift(created);
      return NextResponse.json({
        success: true,
        msg: "Thank you for sharing your rating!",
        data: created,
      });
    }

    const created = await Review.create({
      apartmentName: apartmentName.trim(),
      roomName: roomName.trim(),
      guestName: guestName.trim(),
      guestAvatar: guestAvatar || "/images/avatars/guest-amina.jpg",
      rating: numericRating,
      comment: comment.trim(),
    });

    return NextResponse.json({
      success: true,
      msg: "Thank you for sharing your rating!",
      data: created,
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { success: false, msg: "Unable to submit review." },
      { status: 500 }
    );
  }
}
