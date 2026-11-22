/** @format */

import mongoose from "mongoose";
import { ensureMongoSeeded } from "./seedMongo";

mongoose.set("bufferCommands", false);

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await ensureMongoSeeded();
      return true;
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn(
        "[AI Studio] MONGODB_URI not set — database offline, using local seeded store"
      );
      return false;
    }
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log("db connected");
    }
    if (mongoose.connection.readyState === 1) {
      await ensureMongoSeeded();
      return true;
    }
    return false;
  } catch (error) {
    console.warn(
      "MongoDB not connected — using local seeded store:",
      error.message
    );
    return false;
  }
};

export default connectDB;
