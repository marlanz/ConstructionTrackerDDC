import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI environment variable is not set. Please define it in .env.local",
  );
}

/**
 * Global cache to prevent creating a new Mongoose connection on every
 * hot-reload in Next.js development mode. In production, module caching
 * ensures this module is only evaluated once.
 */
declare global {
  var __mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global.__mongoose ?? { conn: null, promise: null };

if (!global.__mongoose) {
  global.__mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      // Buffers commands until the connection is ready.
      // Required in serverless environments to avoid race conditions.
      bufferCommands: true,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
