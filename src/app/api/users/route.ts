import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { getUserFromRequest } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { sendInviteEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const users = await User.find({}, '-passwordHash -twoFactorCode').sort({ createdAt: -1 })
    return NextResponse.json(users)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching users'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Akses ditolak. Sesi tidak sah.' }, { status: 401 })
    }

    if (tokenUser.role !== 'Administrator' && tokenUser.role !== 'Director / BOD') {
      return NextResponse.json({ error: 'Hanya Administrator yang memiliki izin mengundang pengguna baru.' }, { status: 403 })
    }

    const { employeeName, email, position, division, role, password } = await request.json()

    if (!employeeName || !email) {
      return NextResponse.json({ error: 'Nama dan email wajib diisi.' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const existing = await User.findOne({ email: cleanEmail })
    if (existing) {
      return NextResponse.json({ error: 'Pengguna dengan email ini sudah terdaftar.' }, { status: 409 })
    }

    const tempPassword = password || 'Password123!'
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const newUser = await User.create({
      employeeName,
      email: cleanEmail,
      passwordHash,
      position: position || 'Legal Officer',
      division: division || 'Direktorat Umum',
      role: role || 'User',
      twoFactorEnabled: true,
    })

    // Send invitation email via Resend
    await sendInviteEmail({
      to: cleanEmail,
      userName: employeeName,
      invitedByName: tokenUser.employeeName || 'Administrator RISE',
      role: role || 'User',
      temporaryPassword: tempPassword,
    })

    return NextResponse.json({
      success: true,
      message: `Undangan berhasil dikirimkan ke ${cleanEmail}.`,
      user: {
        id: newUser._id,
        employeeName: newUser.employeeName,
        email: newUser.email,
        position: newUser.position,
        division: newUser.division,
        role: newUser.role,
        twoFactorEnabled: newUser.twoFactorEnabled,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengundang pengguna'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
