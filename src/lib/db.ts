import mongoose from 'mongoose'

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://totorubianto17_db_user:q8W1lVxCy8FbMiaR@lucky.sdnic42.mongodb.net/?appName=lucky'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseCache: MongooseCache | undefined
}

let cached = globalThis.mongooseCache

if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached && cached.conn) {
    return cached.conn
  }

  if (!cached) {
    cached = globalThis.mongooseCache = { conn: null, promise: null }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error('MongoDB connection error:', e)
    throw e
  }

  return cached.conn
}
