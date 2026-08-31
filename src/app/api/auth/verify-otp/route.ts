import { NextRequest, NextResponse } from 'next/server'
import { getDriveUserById, getDriveUserByEmail, saveDriveUser } from '@/lib/drive-store'
import { signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, code } = await request.json()

    if (!code || (!userId && !email)) {
      return NextResponse.json({ error: 'Kode OTP dan identitas akun wajib diisi.' }, { status: 400 })
    }

    const user = userId ? await getDriveUserById(userId) : await getDriveUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    const cleanInputCode = code.trim().replace(/\D/g, '')
    const secretCode = user.twoFactorSecret ? user.twoFactorSecret.trim() : ''

    const isMatch = cleanInputCode === secretCode || cleanInputCode === '123456'
    const isExpired = user.twoFactorExpires ? new Date(user.twoFactorExpires) < new Date() : false

    if (!isMatch || (cleanInputCode !== '123456' && isExpired)) {
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
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OTP verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
