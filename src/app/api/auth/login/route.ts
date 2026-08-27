import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { LoginHistoryModel } from '@/models/LoginHistory'
import { signToken } from '@/lib/auth'
import { seedDatabase } from '@/lib/seed'
import { sendOtpEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const userCount = await User.countDocuments()
    if (userCount === 0) {
      await seedDatabase()
    }

    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan kata sandi wajib diisi.' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: cleanEmail })
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'Browser / Desktop'

    if (!user) {
      await LoginHistoryModel.create({
        email: cleanEmail,
        device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Chrome / Windows',
        ip,
        status: 'Blocked (unrecognized)',
      })
      return NextResponse.json({ error: 'Email atau kata sandi tidak cocok.' }, { status: 401 })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      await LoginHistoryModel.create({
        userId: user._id,
        email: user.email,
        device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Chrome / Windows',
        ip,
        status: 'Blocked (unrecognized)',
      })
      return NextResponse.json({ error: 'Email atau kata sandi tidak cocok.' }, { status: 401 })
    }

    // Real Two-Factor Authentication (OTP)
    if (user.twoFactorEnabled) {
      const realOtpCode = Math.floor(100000 + Math.random() * 900000).toString()
      user.twoFactorCode = realOtpCode
      user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      await user.save()

      // Send real email from official@risetrack.id
      const emailResult = await sendOtpEmail({
        to: user.email,
        userName: user.employeeName,
        otpCode: realOtpCode,
        expiresInMinutes: 5,
      })

      return NextResponse.json({
        require2FA: true,
        userId: user._id.toString(),
        message: 'Kode OTP 6-digit telah dikirimkan ke email terdaftar.',
        emailSent: emailResult.success,
        emailProvider: emailResult.provider,
      })
    }

    // Direct Login if 2FA disabled
    await LoginHistoryModel.create({
      userId: user._id,
      email: user.email,
      device: userAgent.includes('Mobile') ? 'RISE Mobile / iOS' : 'Chrome / macOS',
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
