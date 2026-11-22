/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import User from "@/app/models/users";
import Booking from "@/app/models/bookedDates";
import Conversation from "@/app/models/message";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const { email, username, avatar, firstName, lastName } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanUsername = (username || "").trim();

    if (!cleanEmail && !cleanUsername) {
      return NextResponse.json(
        { success: false, msg: "User email or username is required." },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const target = store.users.find(
        (u) =>
          (cleanEmail && u.email.toLowerCase() === cleanEmail) ||
          (cleanUsername && u.username.toLowerCase() === cleanUsername.toLowerCase())
      );
      if (!target) {
        return NextResponse.json(
          { success: false, msg: "Profile not found." },
          { status: 404 }
        );
      }
      if (avatar !== undefined) target.avatar = avatar;
      if (firstName?.trim()) target.firstName = firstName.trim();
      if (lastName?.trim()) target.lastName = lastName.trim();

      if (avatar !== undefined && target.email) {
        store.bookings.forEach((b) => {
          if ((b.guestEmail || "").toLowerCase() === target.email.toLowerCase()) {
            b.guestAvatar = avatar;
          }
        });
        store.messages.forEach((m) => {
          if ((m.guestEmail || "").toLowerCase() === target.email.toLowerCase()) {
            m.guestAvatar = avatar;
          }
        });
      }

      const { password: _p, ...safe } = target;
      return NextResponse.json({
        success: true,
        msg: "Profile updated.",
        data: safe,
      });
    }

    const user = await User.findOne(
      cleanEmail ? { email: cleanEmail } : { username: cleanUsername }
    );
    if (!user) {
      return NextResponse.json(
        { success: false, msg: "Profile not found." },
        { status: 404 }
      );
    }

    if (avatar !== undefined) user.avatar = avatar;
    if (firstName?.trim()) user.firstName = firstName.trim();
    if (lastName?.trim()) user.lastName = lastName.trim();
    await user.save();

    if (avatar !== undefined && user.email) {
      await Promise.all([
        Booking.updateMany(
          { guestEmail: user.email.toLowerCase() },
          { guestAvatar: avatar }
        ),
        Conversation.updateMany(
          { guestEmail: user.email.toLowerCase() },
          { guestAvatar: avatar }
        ),
      ]);
    }

    const safe = user.toObject();
    delete safe.password;

    return NextResponse.json({
      success: true,
      msg: "Profile updated.",
      data: safe,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, msg: "Unable to update profile." },
      { status: 500 }
    );
  }
}
