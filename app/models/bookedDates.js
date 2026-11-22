/** @format */

import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    apartmentName: {
      type: String,
      default: "",
    },
    guestName: {
      type: String,
      default: "Guest",
    },
    guestEmail: {
      type: String,
      default: "",
    },
    guestAvatar: {
      type: String,
      default: "",
    },
    nights: {
      type: Number,
      default: 1,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "refunded", "blocked"],
      default: "paid",
    },
    hostApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "mpesa", "property", "host_block"],
      default: "card",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    bookedDates: [
      {
        type: Date,
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
