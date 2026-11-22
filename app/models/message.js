/** @format */

import mongoose from "mongoose";

const messageItemSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["guest", "host"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    apartmentName: {
      type: String,
      required: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    guestEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    guestAvatar: {
      type: String,
      default: "",
    },
    hostName: {
      type: String,
      default: "Stephen Saidimu",
    },
    hostAvatar: {
      type: String,
      default: "/images/avatars/host-stephen.jpg",
    },
    subject: {
      type: String,
      default: "Stay inquiry",
    },
    unreadForHost: {
      type: Boolean,
      default: true,
    },
    unreadForGuest: {
      type: Boolean,
      default: false,
    },
    messages: [messageItemSchema],
  },
  { timestamps: true }
);

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);

export default Conversation;
