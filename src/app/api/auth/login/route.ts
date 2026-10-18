import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDriveUserByEmail, saveDriveUser } from '@/lib/drive-store'
import { sendOtpEmail } from '@/lib/email'
import { signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const user = await getDriveUserByEmail(cleanEmail)
    if (!user) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak sesuai.' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak sesuai.' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda sedang dinonaktifkan oleh Administrator.' },
        { status: 403 }
      )
    }

    // 2FA OTP Flow
    if (user.twoFactorEnabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const now = Date.now()

      user.twoFactorSecret = otpCode
      user.twoFactorExpires = new Date(now + 10 * 60 * 1000).toISOString()
      await saveDriveUser(user)

      const jwtSecret = process.env.JWT_SECRET || 'rise_corporate_secure_secret_key_2026'
      const crypto = await import('crypto')
      const jwt = await import('jsonwebtoken')
      const otpHash = crypto.createHmac('sha256', jwtSecret).update(otpCode).digest('hex')

      const twoFactorTicket = jwt.default.sign(
        {
          userId: user._id,
          email: user.email,
          otpHash,
          purpose: '2fa_otp',
        },
        jwtSecret,
        { expiresIn: '10m' }
      )

      const emailResult = await sendOtpEmail({
        to: user.email,
        userName: user.employeeName,
        otpCode,
        expiresInMinutes: 10,
      })

      return NextResponse.json({
        requires2FA: true,
        require2FA: true,
        userId: user._id,
        email: user.email,
        twoFactorTicket,
        message: 'Kode OTP 6-digit telah dikirimkan ke email terdaftar.',
        emailSent: emailResult.success,
        emailProvider: emailResult.provider,
      })
    }

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      employeeName: user.employeeName,
      division: user.division,
    })

    const response = NextResponse.json({
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
        coverUrl: user.coverUrl,
        mood: user.mood,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })

    response.cookies.set('ride_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
