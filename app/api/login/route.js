/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import { passwordOverrides } from "@/app/lib/resetTokens";
import User from "@/app/models/users";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Handles POST request to sign in either as general user or Host Studio member.
 */
export async function POST(req) {
  try {
    const { userName, password, studioOnly = false } = await req.json();
    const identifier = (userName || "").trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { msg: ["Username/email and password are required."], success: false },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    let user = null;

    if (!connected) {
      const lower = identifier.toLowerCase();
      user = getStore().users.find(
        (u) =>
          u.username.toLowerCase() === lower || u.email.toLowerCase() === lower
      );
    } else {
      const regex = new RegExp(`^${escapeRegex(identifier)}$`, "i");
      user = await User.findOne({
        $or: [{ username: regex }, { email: identifier.toLowerCase() }],
      });
    }

    if (!user) {
      return NextResponse.json(
        { msg: ["Invalid login credentials."], success: false },
        { status: 401 }
      );
    }

    const overrideHash = passwordOverrides.get(user.email?.toLowerCase());
    const hashToCompare = overrideHash || user.password;

    const validPassword = await bcrypt.compare(password, hashToCompare);
    if (!validPassword) {
      return NextResponse.json(
        { msg: ["Invalid login credentials."], success: false },
        { status: 401 }
      );
    }

    const role = user.role || "guest";
    if (
      studioOnly &&
      !["super_admin", "manager", "host"].includes(role)
    ) {
      return NextResponse.json(
        {
          msg: [
            "Access denied: Only Super Admin or authorized Studio Managers can open Host Studio.",
          ],
          success: false,
        },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.username,
        role,
      },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "12h" }
    );

    return NextResponse.json({
      msg: ["Signed in successfully."],
      success: true,
      token,
      userData: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { msg: ["Unable to perform login."], success: false },
      { status: 500 }
    );
  }
}
