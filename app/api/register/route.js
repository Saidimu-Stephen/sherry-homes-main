/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import User from "@/app/models/users";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Handles POST request to register a guest account (with optional profile picture).
 */
export async function POST(req) {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      phoneNumber,
      gender,
      password,
      avatar = "",
    } = await req.json();

    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedUsername = (username || "").trim();

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !normalizedUsername ||
      !normalizedEmail ||
      !phoneNumber?.trim() ||
      !gender ||
      !password
    ) {
      return NextResponse.json(
        { msg: ["Please complete all required fields."], success: false },
        { status: 400 }
      );
    }

    if (normalizedUsername.length < 4) {
      return NextResponse.json(
        { msg: ["Username must be at least 4 characters long."], success: false },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { msg: ["Password must be at least 8 characters long."], success: false },
        { status: 400 }
      );
    }

    const defaultAvatar =
      gender === "female"
        ? "/images/avatars/guest-amina.jpg"
        : "/images/avatars/guest-daniel.jpg";
    const resolvedAvatar = avatar?.trim() || defaultAvatar;

    const hashedPassword = await bcrypt.hash(password, 10);
    const connected = await connectDB();

    if (!connected) {
      const store = getStore();
      const duplicate = store.users.find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail ||
          u.username.toLowerCase() === normalizedUsername.toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          {
            msg: [
              duplicate.email.toLowerCase() === normalizedEmail
                ? "An account with this email already exists."
                : "That username is already taken.",
            ],
            success: false,
          },
          { status: 409 }
        );
      }

      store.users.push({
        _id: `usr-${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        phoneNumber: phoneNumber.trim(),
        gender,
        role: "guest",
        avatar: resolvedAvatar,
        createdBy: "",
        password: hashedPassword,
        date: new Date().toISOString(),
      });

      return NextResponse.json({
        msg: ["Account created successfully! Redirecting to sign in..."],
        success: true,
      });
    }

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existing) {
      return NextResponse.json(
        {
          msg: [
            existing.email === normalizedEmail
              ? "An account with this email already exists."
              : "That username is already taken.",
          ],
          success: false,
        },
        { status: 409 }
      );
    }

    await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      phoneNumber: phoneNumber.trim(),
      gender,
      role: "guest",
      avatar: resolvedAvatar,
      password: hashedPassword,
    });

    return NextResponse.json({
      msg: ["Account created successfully! Redirecting to sign in..."],
      success: true,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errorList = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { msg: errorList, success: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { msg: ["Unable to register account right now."], success: false },
      { status: 500 }
    );
  }
}
