/** @format */

import crypto from "crypto";
import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import User from "@/app/models/users";
import { resetTokens } from "@/app/lib/resetTokens";

export async function POST(req) {
  try {
    const { email } = await req.json();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json(
        { success: false, msg: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    let userExists = false;

    if (connected) {
      const user = await User.findOne({ email: normalizedEmail });
      userExists = Boolean(user);
    } else {
      const user = getStore().users.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      userExists = Boolean(user);
    }

    if (!userExists) {
      return NextResponse.json(
        {
          success: false,
          msg: "No account was found with that email address.",
        },
        { status: 404 }
      );
    }

    const code = String(crypto.randomInt(100000, 999999));
    resetTokens.set(normalizedEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return NextResponse.json({
      success: true,
      msg: "A 6-digit verification code has been generated for your account.",
      previewCode: code,
      offlineMode: !connected,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, msg: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
