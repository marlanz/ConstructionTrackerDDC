import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env or .env.local");
}

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Cache the connection on the global object in ALL environments:
// - In development, this survives Fast Refresh/HMR module reloads.
// - In production (serverless), this survives across warm invocations
//   within the same container, avoiding a full reconnect on every
//   request. Each container has its own isolated `global`, so this
//   never leaks a connection across unrelated users/instances — it only
//   avoids reconnecting redundantly within the same one.
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

const clientPromise = global._mongoClientPromise;

export default clientPromise;
