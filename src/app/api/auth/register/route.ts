import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDriveUserByEmail, saveDriveUser, StoredUser } from '@/lib/drive-store'
import { signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { employeeName, email, password, position, division, role, phone } = await request.json()

    if (!employeeName || !email || !password) {
      return NextResponse.json({ error: 'Nama lengkap, email, dan kata sandi wajib diisi.' }, { status: 400 })
    }

    const existing = await getDriveUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar dalam sistem.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()
    const id = 'usr_' + Math.random().toString(36).substring(2, 9)

    const newUser: StoredUser = {
      _id: id,
      id,
      employeeName,
      email: email.toLowerCase().trim(),
      passwordHash,
      position: position || 'Staff Anggota',
      division: division || 'Direktorat Operasi',
      role: role || 'Requester',
      phone: phone || '',
      twoFactorEnabled: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    await saveDriveUser(newUser)

    const token = signToken({
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
      employeeName: newUser.employeeName,
      division: newUser.division,
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser._id,
        employeeName: newUser.employeeName,
        email: newUser.email,
        position: newUser.position,
        division: newUser.division,
        role: newUser.role,
        twoFactorEnabled: newUser.twoFactorEnabled,
      },
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
