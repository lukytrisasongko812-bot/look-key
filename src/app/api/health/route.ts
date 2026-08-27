import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'

export async function GET() {
  try {
    const mongoose = await connectToDatabase()
    const isConnected = mongoose.connection.readyState === 1
    return NextResponse.json({
      status: isConnected ? 'healthy' : 'degraded',
      database: isConnected ? 'connected' : 'disconnected',
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection error'
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: message,
      },
      { status: 500 }
    )
  }
}
