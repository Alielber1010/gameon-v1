// db/mongodb.ts
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

// Define the interface for the cached object
interface MongooseCache {
  conn: any;
  promise: any;
}

// Cast global to include the mongoose property
let globalWithMongoose = global as typeof globalThis & {
  mongoose: MongooseCache;
};

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export const clientPromise = connectDB().then(conn => conn.connection.getClient());
