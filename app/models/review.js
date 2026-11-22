/** @format */

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    apartmentName: {
      type: String,
      required: true,
      trim: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    guestAvatar: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Review =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
