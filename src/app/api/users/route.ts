import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDriveUsers, getDriveUserByEmail, saveDriveUser, StoredUser } from '@/lib/drive-store'
import { sendInviteEmail } from '@/lib/email'
import { getUserFromRequest } from '@/lib/auth'
import { isSystemAdmin, isBoardOfDirectors } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Tidak terotentikasi.' }, { status: 401 })
    }
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
    if (!tokenUser) {
      return NextResponse.json({ error: 'Tidak terotentikasi.' }, { status: 401 })
    }
    if (!isSystemAdmin(tokenUser.role) && !isBoardOfDirectors(tokenUser.role)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Administrator atau Direksi yang dapat menambahkan pengguna baru.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { employeeName, email, position, division, role, phone, password } = body

    if (!employeeName || !email) {
      return NextResponse.json({ error: 'Nama dan email pengguna wajib diisi.' }, { status: 400 })
    }

    const existing = await getDriveUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Email pengguna sudah terdaftar.' }, { status: 400 })
    }

    const tempPassword = password && password.trim() ? password.trim() : `Ride@${Math.random().toString(36).slice(2, 8).toUpperCase()}!`
    const passwordHash = await bcrypt.hash(tempPassword, 10)
    const now = new Date().toISOString()
    const id = 'usr_' + Math.random().toString(36).substring(2, 9)

    const newUser: StoredUser = {
      _id: id,
      id,
      employeeName: employeeName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      position: position ? position.trim() : 'Staff Anggota',
      division: division ? division.trim() : 'Direktorat Operasi',
      role: role || 'User',
      phone: phone ? phone.trim() : '',
      twoFactorEnabled: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    await saveDriveUser(newUser)

    // Send invitation email with credentials card
    const inviterName = tokenUser?.employeeName || 'Administrator RIDE'
    await sendInviteEmail({
      to: email.toLowerCase().trim(),
      userName: employeeName,
      role: newUser.role,
      division: newUser.division,
      position: newUser.position,
      temporaryPassword: tempPassword,
      invitedByName: inviterName,
    }).catch((err) => console.error('[Invite Email Error]', err))

    return NextResponse.json(
      {
        id: newUser._id,
        employeeName: newUser.employeeName,
        email: newUser.email,
        position: newUser.position,
        division: newUser.division,
        role: newUser.role,
        phone: newUser.phone,
        twoFactorEnabled: newUser.twoFactorEnabled,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'User creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
