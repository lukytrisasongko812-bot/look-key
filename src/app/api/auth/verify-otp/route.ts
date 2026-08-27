import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { LoginHistoryModel } from '@/models/LoginHistory'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const { userId, code } = await request.json()

    if (!userId || !code) {
      return NextResponse.json({ error: 'User ID dan kode OTP diperlukan.' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    if (!user.twoFactorCode || !user.twoFactorExpires) {
      return NextResponse.json({ error: 'Tidak ada permintaan OTP aktif untuk akun ini.' }, { status: 400 })
    }

    if (new Date() > user.twoFactorExpires) {
      user.twoFactorCode = null
      user.twoFactorExpires = null
      await user.save()
      return NextResponse.json({ error: 'Kode OTP telah kedaluwarsa. Silakan login kembali.' }, { status: 400 })
    }

    if (user.twoFactorCode !== code.trim()) {
      return NextResponse.json({ error: 'Kode OTP salah. Silakan coba lagi.' }, { status: 400 })
    }

    // OTP matched! Clear code and record successful login
    user.twoFactorCode = null
    user.twoFactorExpires = null
    await user.save()

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'Browser / Desktop'

    await LoginHistoryModel.create({
      userId: user._id,
      email: user.email,
      device: userAgent.includes('Mobile') ? 'RISE Mobile / iOS' : 'Chrome / Windows',
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
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
