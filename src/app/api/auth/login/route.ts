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
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
