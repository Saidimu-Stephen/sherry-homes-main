/** @format */

import mongoose, { Schema } from "mongoose";

const apartmentSchema = new Schema(
  {
    apartmentName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      required: true,
    },
    keyboxCode: {
      type: String,
      trim: true,
      default: "4829#",
    },
    keyboxInstructions: {
      type: String,
      trim: true,
      default:
        "Smart lockbox mounted beside the main apartment entrance door. Enter the code followed by # to collect your access keycard.",
    },
    wifiName: {
      type: String,
      trim: true,
      default: "SherryHomes-Fiber-5G",
    },
    wifiPassword: {
      type: String,
      trim: true,
      default: "WelcomeStay2026",
    },
    hostName: {
      type: String,
      trim: true,
      default: "Stephen Saidimu",
    },
    hostEmail: {
      type: String,
      trim: true,
      default: "stevensaidimu@gmail.com",
    },
    hostAvatar: {
      type: String,
      default: "/images/avatars/host-stephen.jpg",
    },
  },
  { timestamps: true } // Adding timestamps option
);

// Define compound unique index on apartmentName and location fields with a custom error message
apartmentSchema.index(
  { apartmentName: 1, location: 1 },
  {
    unique: true,
    message: "Apartment with the same name and location already exists.",
  }
);

const apartmentDetails =
  mongoose.models.Apartment || mongoose.model("Apartment", apartmentSchema);

export default apartmentDetails;
