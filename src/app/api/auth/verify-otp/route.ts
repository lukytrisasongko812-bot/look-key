import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { LoginHistoryModel } from '@/models/LoginHistory'
import { signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const { userId, email, code } = await request.json()

    if ((!userId && !email) || !code) {
      return NextResponse.json({ error: 'User ID atau Email dan kode OTP diperlukan.' }, { status: 400 })
    }

    let user = null
    if (userId) {
      user = await User.findById(userId).catch(() => null)
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase().trim() })
    }

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    if (!user.twoFactorCode || !user.twoFactorExpires) {
      return NextResponse.json({ error: 'Tidak ada permintaan OTP aktif untuk akun ini. Silakan login kembali.' }, { status: 400 })
    }

    const now = new Date()
    if (now > user.twoFactorExpires) {
      user.twoFactorCode = null
      user.twoFactorExpires = null
      await user.save()
      return NextResponse.json({ error: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.' }, { status: 400 })
    }

    const cleanInputCode = String(code).replace(/\D/g, '').trim()
    const cleanStoredCode = String(user.twoFactorCode).replace(/\D/g, '').trim()

    if (cleanStoredCode !== cleanInputCode) {
      return NextResponse.json({
        error: 'Kode OTP tidak cocok. Pastikan Anda memasukkan kode dari email terbaru.',
      }, { status: 400 })
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
