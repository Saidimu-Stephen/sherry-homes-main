/** @format */

import mongoose from "mongoose";
import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import Room from "../../models/roomDetails";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { updatedFormData } = await req.json();
    if (!updatedFormData || !updatedFormData.roomName || !updatedFormData.nameOfApartment) {
      return NextResponse.json(
        { msg: "Room name and apartment are required.", success: false },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const duplicate = store.rooms.some(
        (r) => r.roomName.toLowerCase() === updatedFormData.roomName.trim().toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          { msg: "Room already existing", success: false },
          { status: 409 }
        );
      }

      const newRoom = {
        _id: `room-${Date.now()}`,
        roomName: updatedFormData.roomName.trim(),
        roomType: updatedFormData.roomType || "suite",
        numberOfGuests: String(updatedFormData.numberOfGuests || "2"),
        numberOfBeds: String(updatedFormData.numberOfBeds || "1"),
        roomDescription: updatedFormData.roomDescription || "",
        price: String(updatedFormData.price || "100"),
        nameOfApartment: updatedFormData.nameOfApartment,
      };
      store.rooms.unshift(newRoom);

      return NextResponse.json({
        msg: "Room created successfully",
        data: newRoom,
        success: true,
      });
    }

    const newRoom = await Room.create(updatedFormData);
    return NextResponse.json({
      msg: "Room created successfully",
      data: newRoom,
      success: true,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errorList = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { msg: "Validation Error", errors: errorList, success: false },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { msg: "Room already existing", success: false },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { msg: "An unexpected error occurred.", success: false },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { id, updates } = await req.json();
    if (!id || !updates) {
      return NextResponse.json(
        { msg: "Room ID and updates are required.", success: false },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const target = store.rooms.find((r) => r._id === id);
      if (!target) {
        return NextResponse.json(
          { msg: "Room not found.", success: false },
          { status: 404 }
        );
      }
      const previousName = target.roomName;
      Object.assign(target, updates);

      if (updates.roomName && updates.roomName !== previousName) {
        store.mainImages.forEach((img) => {
          if (img.selectedRoomName === previousName) {
            img.selectedRoomName = updates.roomName;
          }
        });
        store.minorImages.forEach((img) => {
          if (img.selectedRoomName === previousName) {
            img.selectedRoomName = updates.roomName;
          }
        });
      }

      return NextResponse.json({
        msg: "Room updated successfully",
        data: target,
        success: true,
      });
    }

    const updated = await Room.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return NextResponse.json(
        { msg: "Room not found.", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      msg: "Room updated successfully",
      data: updated,
      success: true,
    });
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { msg: "Unable to update room.", success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { msg: "Room ID is required.", success: false },
        { status: 400 }
      );
    }

    const connected = await connectDB();
    if (!connected) {
      const store = getStore();
      const target = store.rooms.find((r) => r._id === id);
      if (!target) {
        return NextResponse.json(
          { msg: "Room not found.", success: false },
          { status: 404 }
        );
      }
      store.rooms = store.rooms.filter((r) => r._id !== id);
      store.mainImages = store.mainImages.filter(
        (m) => m.selectedRoomName !== target.roomName
      );
      store.minorImages = store.minorImages.filter(
        (m) => m.selectedRoomName !== target.roomName
      );
      return NextResponse.json({
        msg: "Room deleted successfully",
        success: true,
      });
    }

    const deleted = await Room.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { msg: "Room not found.", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      msg: "Room deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { msg: "Unable to delete room.", success: false },
      { status: 500 }
    );
  }
}
