import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { LoginHistoryModel } from '@/models/LoginHistory'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const { email } = await request.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid company email is required' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    let user = await User.findOne({ email: cleanEmail })

    if (!user) {
      // Auto-provision user for corporate SSO
      const nameParts = cleanEmail.split('@')[0].split('.')
      const formattedName = nameParts
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')

      const initialPasswordHash = await bcrypt.hash(
        Math.random().toString(36).substring(2, 15) + 'Aa1!',
        10
      )
      user = await User.create({
        employeeName: formattedName || 'Corporate Employee',
        email: cleanEmail,
        passwordHash: initialPasswordHash,
        position: 'Legal Officer',
        division: 'Direktorat Umum',
        role: 'Legal Officer',
      })
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    await LoginHistoryModel.create({
      userId: user._id,
      email: user.email,
      device: 'SSO Corporate Session',
      ip,
      status: 'Success',
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
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SSO Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
