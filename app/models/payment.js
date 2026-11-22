/** @format */

import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
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
    subtotal: {
      type: Number,
      default: 0,
    },
    cleaningFee: {
      type: Number,
      default: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["card", "mpesa", "property"],
      default: "card",
    },
    last4: {
      type: String,
      default: "",
    },
    reference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "refunded"],
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
  },
  { timestamps: true }
);

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
