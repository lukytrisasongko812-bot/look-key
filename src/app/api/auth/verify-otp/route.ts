import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import { getDriveUserById, getDriveUserByEmail, saveDriveUser } from '@/lib/drive-store'
import { signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, code, ticket, twoFactorTicket } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Kode OTP wajib diisi.' }, { status: 400 })
    }

    const cleanInputCode = code.trim().replace(/\D/g, '')
    const activeTicket = ticket || twoFactorTicket
    const jwtSecret = process.env.JWT_SECRET || 'rise_corporate_secure_secret_key_2026'

    let targetUserId = userId
    let targetEmail = email
    let isCodeValid = false

    // 1. Verify via Cryptographic JWT Ticket (Stateless across all serverless instances)
    if (activeTicket) {
      try {
        const decoded = jwt.verify(activeTicket, jwtSecret) as {
          userId?: string
          email?: string
          otpHash?: string
          purpose?: string
        }

        if (decoded && decoded.purpose === '2fa_otp' && decoded.otpHash) {
          const inputHash = crypto.createHmac('sha256', jwtSecret).update(cleanInputCode).digest('hex')
          if (inputHash === decoded.otpHash) {
            isCodeValid = true
            if (decoded.userId) targetUserId = decoded.userId
            if (decoded.email) targetEmail = decoded.email
          }
        }
      } catch (err) {
        console.warn('[Ticket Verify Warning]', err)
      }
    }

    // 2. Fetch User Record
    const user = targetUserId
      ? await getDriveUserById(targetUserId)
      : targetEmail
      ? await getDriveUserByEmail(targetEmail)
      : null

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    // 3. In-memory check if ticket was not provided or invalid
    if (!isCodeValid) {
      const secretCode = user.twoFactorSecret ? user.twoFactorSecret.trim() : ''
      const isExpired = user.twoFactorExpires ? new Date(user.twoFactorExpires) < new Date() : true

      if (Boolean(secretCode) && cleanInputCode === secretCode && !isExpired) {
        isCodeValid = true
      }
    }

    if (!isCodeValid) {
      return NextResponse.json({ error: 'Kode OTP tidak valid atau telah kadaluarsa.' }, { status: 400 })
    }

    // Clear OTP secret after successful verification
    user.twoFactorSecret = undefined
    user.twoFactorExpires = null
    await saveDriveUser(user)

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
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OTP verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
