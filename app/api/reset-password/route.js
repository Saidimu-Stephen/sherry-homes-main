/** @format */

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import User from "@/app/models/users";
import { resetTokens, passwordOverrides } from "@/app/lib/resetTokens";

export async function POST(req) {
  try {
    const { email, code, newPassword } = await req.json();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !code || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          msg: "Email, verification code, and new password are required.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          msg: "Password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    const record = resetTokens.get(normalizedEmail);
    if (!record) {
      return NextResponse.json(
        {
          success: false,
          msg: "No active reset request found. Request a new code.",
        },
        { status: 400 }
      );
    }

    if (Date.now() > record.expiresAt) {
      resetTokens.delete(normalizedEmail);
      return NextResponse.json(
        {
          success: false,
          msg: "Verification code expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    if (record.code !== String(code).trim()) {
      return NextResponse.json(
        { success: false, msg: "Invalid verification code." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const connected = await connectDB();

    if (connected) {
      const updated = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { password: hashedPassword },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json(
          { success: false, msg: "Account not found." },
          { status: 404 }
        );
      }
    } else {
      const storeUser = getStore().users.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      if (storeUser) {
        storeUser.password = hashedPassword;
      }
      passwordOverrides.set(normalizedEmail, hashedPassword);
    }

    resetTokens.delete(normalizedEmail);

    return NextResponse.json({
      success: true,
      msg: "Your password has been updated. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, msg: "Unable to reset password." },
      { status: 500 }
    );
  }
}
