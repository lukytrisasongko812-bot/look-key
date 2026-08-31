import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDriveUsers, getDriveUserByEmail, saveDriveUser, StoredUser } from '@/lib/drive-store'
import { sendNotificationEmail } from '@/lib/email'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const users = await getDriveUsers()
    return NextResponse.json(users)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    const body = await request.json()
    const { employeeName, email, position, division, role, phone } = body

    if (!employeeName || !email) {
      return NextResponse.json({ error: 'Nama dan email pengguna wajib diisi.' }, { status: 400 })
    }

    const existing = await getDriveUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Email pengguna sudah terdaftar.' }, { status: 400 })
    }

    const defaultPasswordHash = await bcrypt.hash('Ride@2026', 10)
    const now = new Date().toISOString()
    const id = 'usr_' + Math.random().toString(36).substring(2, 9)

    const newUser: StoredUser = {
      _id: id,
      id,
      employeeName,
      email: email.toLowerCase().trim(),
      passwordHash: defaultPasswordHash,
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

    // Send invitation email via Resend
    const inviterName = tokenUser?.employeeName || 'Administrator RIDE'
    await sendNotificationEmail({
      to: email.toLowerCase().trim(),
      userName: employeeName,
      title: 'Undangan Bergabung ke Portal RIDE Platform',
      description: `Halo ${employeeName}, Anda telah diundang oleh ${inviterName} untuk bergabung ke sistem RIDE dengan peran: ${newUser.role}. Kata sandi awal Anda: "Ride@2026". Silakan masuk dan perbarui kata sandi Anda.`,
    }).catch((err) => console.error('[Invite Email Error]', err))

    return NextResponse.json(
      {
        id: newUser._id,
        employeeName: newUser.employeeName,
        email: newUser.email,
        position: newUser.position,
        division: newUser.division,
        role: newUser.role,
        twoFactorEnabled: newUser.twoFactorEnabled,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'User creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
