import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDriveUserById, saveDriveUser } from '@/lib/drive-store'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' }, { status: 400 })
    }

    const user = await getDriveUserById(tokenUser.userId)
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      return NextResponse.json({ error: 'Kata sandi saat ini tidak sesuai.' }, { status: 400 })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await saveDriveUser(user)

    return NextResponse.json({ success: true, message: 'Kata sandi berhasil diperbarui.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Change password error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
