/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import ApartmentDetails from "../../models/apartment";
import Room from "../../models/roomDetails";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const {
      apartmentName,
      location,
      keyboxCode = "4829#",
      keyboxInstructions = "Smart lockbox beside main door. Enter code + # to collect keycard.",
      wifiName = "SherryHomes-Fiber-5G",
      wifiPassword = "WelcomeStay2026",
      hostName = "Stephen Saidimu",
      hostEmail = "stevensaidimu@gmail.com",
      hostAvatar = "/images/avatars/host-stephen.jpg",
    } = await req.json();

    const cleanName = (apartmentName || "").trim();
    const cleanLocation = (location || "").trim();

    if (!cleanName || !cleanLocation) {
      return NextResponse.json(
        { msg: "Apartment name and location are required.", success: false },
        { status: 400 }
      );
    }

    const payload = {
      apartmentName: cleanName,
      location: cleanLocation,
      keyboxCode: (keyboxCode || "4829#").trim(),
      keyboxInstructions: (keyboxInstructions || "").trim(),
      wifiName: (wifiName || "").trim(),
      wifiPassword: (wifiPassword || "").trim(),
      hostName: (hostName || "Stephen Saidimu").trim(),
      hostEmail: (hostEmail || "stevensaidimu@gmail.com").trim().toLowerCase(),
      hostAvatar: hostAvatar || "/images/avatars/host-stephen.jpg",
    };

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const duplicate = store.apartments.some(
        (a) =>
          a.apartmentName.toLowerCase() === cleanName.toLowerCase() &&
          a.location.toLowerCase() === cleanLocation.toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          {
            msg: "Apartment with the same name and location already exists.",
            success: false,
          },
          { status: 409 }
        );
      }

      const created = {
        _id: `apt-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      store.apartments.unshift(created);
      return NextResponse.json({
        msg: "Apartment details & access credentials saved successfully",
        success: true,
        data: created,
      });
    }

    const created = await ApartmentDetails.create(payload);

    return NextResponse.json({
      msg: "Apartment details & access credentials saved successfully",
      success: true,
      data: created,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errorList = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { msg: errorList.join(", "), success: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { msg: "Unable to save apartment details", success: false },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const {
      id,
      apartmentName,
      location,
      keyboxCode,
      keyboxInstructions,
      wifiName,
      wifiPassword,
      hostName,
      hostAvatar,
    } = await req.json();
    const cleanName = (apartmentName || "").trim();
    const cleanLocation = (location || "").trim();

    if (!id || !cleanName || !cleanLocation) {
      return NextResponse.json(
        { msg: "ID, apartment name, and location are required.", success: false },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const target = store.apartments.find((a) => a._id === id);
      if (!target) {
        return NextResponse.json(
          { msg: "Apartment not found.", success: false },
          { status: 404 }
        );
      }
      const previousName = target.apartmentName;
      target.apartmentName = cleanName;
      target.location = cleanLocation;
      if (keyboxCode !== undefined) target.keyboxCode = keyboxCode.trim();
      if (keyboxInstructions !== undefined)
        target.keyboxInstructions = keyboxInstructions.trim();
      if (wifiName !== undefined) target.wifiName = wifiName.trim();
      if (wifiPassword !== undefined) target.wifiPassword = wifiPassword.trim();
      if (hostName !== undefined) target.hostName = hostName.trim();
      if (hostAvatar !== undefined) target.hostAvatar = hostAvatar;

      store.rooms.forEach((room) => {
        if (room.nameOfApartment === previousName) {
          room.nameOfApartment = cleanName;
        }
      });

      return NextResponse.json({
        msg: "Apartment, keybox & Wi-Fi information updated",
        success: true,
        data: target,
      });
    }

    const existing = await ApartmentDetails.findById(id);
    if (!existing) {
      return NextResponse.json(
        { msg: "Apartment not found.", success: false },
        { status: 404 }
      );
    }
    const previousName = existing.apartmentName;
    existing.apartmentName = cleanName;
    existing.location = cleanLocation;
    if (keyboxCode !== undefined) existing.keyboxCode = keyboxCode.trim();
    if (keyboxInstructions !== undefined)
      existing.keyboxInstructions = keyboxInstructions.trim();
    if (wifiName !== undefined) existing.wifiName = wifiName.trim();
    if (wifiPassword !== undefined) existing.wifiPassword = wifiPassword.trim();
    if (hostName !== undefined) existing.hostName = hostName.trim();
    if (hostAvatar !== undefined) existing.hostAvatar = hostAvatar;
    await existing.save();

    if (previousName !== cleanName) {
      await Room.updateMany(
        { nameOfApartment: previousName },
        { $set: { nameOfApartment: cleanName } }
      );
    }

    return NextResponse.json({
      msg: "Apartment, keybox & Wi-Fi information updated",
      success: true,
      data: existing,
    });
  } catch (error) {
    console.error("Update apartment error:", error);
    return NextResponse.json(
      { msg: "Unable to update apartment", success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { msg: "Apartment ID is required.", success: false },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const target = store.apartments.find((a) => a._id === id);
      if (!target) {
        return NextResponse.json(
          { msg: "Apartment not found.", success: false },
          { status: 404 }
        );
      }
      store.apartments = store.apartments.filter((a) => a._id !== id);
      store.rooms = store.rooms.filter(
        (r) => r.nameOfApartment !== target.apartmentName
      );
      return NextResponse.json({
        msg: "Apartment deleted successfully",
        success: true,
      });
    }

    const deleted = await ApartmentDetails.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { msg: "Apartment not found.", success: false },
        { status: 404 }
      );
    }
    await Room.deleteMany({ nameOfApartment: deleted.apartmentName });

    return NextResponse.json({
      msg: "Apartment deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Delete apartment error:", error);
    return NextResponse.json(
      { msg: "Unable to delete apartment", success: false },
      { status: 500 }
    );
  }
}
