import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const { employeeName, email, password, position, division } = await request.json()

    if (!employeeName || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const existing = await User.findOne({ email: cleanEmail })
    if (existing) {
      return NextResponse.json({ error: 'Account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      employeeName,
      email: cleanEmail,
      passwordHash,
      position: position || 'Legal Officer',
      division: division || 'Direktorat Umum',
      role: 'User',
    })

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeName: user.employeeName,
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        employeeName: user.employeeName,
        email: user.email,
        position: user.position,
        division: user.division,
        role: user.role,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
