import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDriveUserByEmail, saveDriveUser } from '@/lib/drive-store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email dan kata sandi baru wajib diisi.' },
        { status: 400 }
      )
    }

    const user = await getDriveUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'Email pengguna tidak terdaftar dalam sistem.' },
        { status: 404 }
      )
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await saveDriveUser(user)

    return NextResponse.json({
      success: true,
      message: 'Kata sandi akun Anda berhasil diperbarui. Silakan login kembali.',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reset password failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
