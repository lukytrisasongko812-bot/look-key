import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const { email, newPassword } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 })
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Kata sandi baru wajib diisi (minimal 8 karakter).' },
        { status: 400 }
      )
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Kata sandi akun Anda berhasil diperbarui di MongoDB!',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reset failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
