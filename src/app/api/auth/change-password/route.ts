import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { getUserFromRequest } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Sesi Anda tidak valid. Silakan masuk kembali.' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Kata sandi saat ini dan kata sandi baru diperlukan.' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Kata sandi baru minimal 8 karakter.' }, { status: 400 })
    }

    const user = await User.findById(tokenUser.userId)
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return NextResponse.json({ error: 'Kata sandi saat ini tidak cocok.' }, { status: 400 })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await user.save()

    return NextResponse.json({ success: true, message: 'Kata sandi berhasil diperbarui.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
