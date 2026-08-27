import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const tokenUser = getUserFromRequest(request)

    const users = await User.find({}, '-passwordHash -twoFactorCode').sort({ createdAt: -1 })
    return NextResponse.json(users)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching users'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
