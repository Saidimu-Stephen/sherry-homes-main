/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import User from "@/app/models/users";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function verifySuperAdmin(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return null;
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );
    if (
      decoded?.role === "super_admin" ||
      decoded?.email?.toLowerCase() === "stevensaidimu@gmail.com"
    ) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const admin = verifySuperAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, msg: "Super Admin authorization required." },
        { status: 403 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const staff = getStore()
        .users.filter((u) => ["super_admin", "manager", "host"].includes(u.role))
        .map((u) => ({
          _id: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.username,
          email: u.email,
          phoneNumber: u.phoneNumber,
          gender: u.gender,
          role: u.role,
          avatar: u.avatar || "",
          createdBy: u.createdBy || "",
          date: u.date,
        }));
      return NextResponse.json(staff);
    }

    const staff = await User.find({
      role: { $in: ["super_admin", "manager", "host"] },
    })
      .select("-password")
      .sort({ role: -1, date: -1 });
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Get managers error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = verifySuperAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, msg: "Only the Super Admin can create managers." },
        { status: 403 }
      );
    }

    const {
      firstName,
      lastName,
      username,
      email,
      phoneNumber = "+254 700 000 000",
      gender = "female",
      password,
      avatar = "",
    } = await req.json();

    const cleanUsername = (username || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !cleanUsername ||
      !cleanEmail ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          msg: "First name, last name, username, email, and password are required.",
        },
        { status: 400 }
      );
    }

    if (cleanUsername.length < 4) {
      return NextResponse.json(
        {
          success: false,
          msg: "Manager username must be at least 4 characters.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          msg: "Manager password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedAvatar =
      avatar?.trim() ||
      (gender === "male"
        ? "/images/avatars/host-stephen.jpg"
        : "/images/avatars/manager-grace.jpg");

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const dup = store.users.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail ||
          u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (dup) {
        return NextResponse.json(
          {
            success: false,
            msg: "A user with that email or username already exists.",
          },
          { status: 409 }
        );
      }

      const created = {
        _id: `usr-mgr-${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phoneNumber: phoneNumber.trim(),
        gender: gender === "male" ? "male" : "female",
        role: "manager",
        avatar: resolvedAvatar,
        createdBy: admin.email || "stevensaidimu@gmail.com",
        password: hashedPassword,
        date: new Date().toISOString(),
      };
      store.users.push(created);
      const { password: _removed, ...safeManager } = created;
      return NextResponse.json({
        success: true,
        msg: `Manager ${cleanUsername} created and can now access Host Studio.`,
        data: safeManager,
      });
    }

    const existing = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          msg: "A user with that email or username already exists.",
        },
        { status: 409 }
      );
    }

    const created = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phoneNumber: phoneNumber.trim(),
      gender: gender === "male" ? "male" : "female",
      role: "manager",
      avatar: resolvedAvatar,
      createdBy: admin.email || "stevensaidimu@gmail.com",
      password: hashedPassword,
    });

    const safeManager = created.toObject();
    delete safeManager.password;

    return NextResponse.json({
      success: true,
      msg: `Manager ${cleanUsername} created and can now access Host Studio.`,
      data: safeManager,
    });
  } catch (error) {
    console.error("Create manager error:", error);
    return NextResponse.json(
      { success: false, msg: "Unable to create manager account." },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const admin = verifySuperAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, msg: "Only the Super Admin can delete managers." },
        { status: 403 }
      );
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { success: false, msg: "Manager ID is required." },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const target = store.users.find((u) => u._id === id);
      if (!target) {
        return NextResponse.json(
          { success: false, msg: "Manager not found." },
          { status: 404 }
        );
      }
      if (target.role === "super_admin") {
        return NextResponse.json(
          { success: false, msg: "Super Admin account cannot be deleted." },
          { status: 400 }
        );
      }
      store.users = store.users.filter((u) => u._id !== id);
      return NextResponse.json({
        success: true,
        msg: "Manager access removed.",
      });
    }

    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json(
        { success: false, msg: "Manager not found." },
        { status: 404 }
      );
    }
    if (target.role === "super_admin") {
      return NextResponse.json(
        { success: false, msg: "Super Admin account cannot be deleted." },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      msg: "Manager access removed.",
    });
  } catch (error) {
    console.error("Delete manager error:", error);
    return NextResponse.json(
      { success: false, msg: "Unable to remove manager." },
      { status: 500 }
    );
  }
}
