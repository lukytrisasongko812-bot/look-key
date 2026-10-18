import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDriveUserByEmail, saveDriveUser, StoredUser } from '@/lib/drive-store'
import { signToken, getUserFromRequest } from '@/lib/auth'
import { isSystemAdmin } from '@/lib/roles'
import { sendInviteEmail } from '@/lib/email'
import { UserRole } from '@/context/AppContext'

export const dynamic = 'force-dynamic'

const SELF_REGISTER_ALLOWED_ROLES: UserRole[] = [
  'User',
  'Requester',
  'Reviewer',
  'Legal Officer',
]

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

    const caller = getUserFromRequest(request)
    const callerIsAdmin = caller && isSystemAdmin(caller.role)

    // Prevent unauthenticated privilege escalation to System Administrator or Board of Directors
    const safeRole: UserRole =
      callerIsAdmin && role
        ? (role as UserRole)
        : role && SELF_REGISTER_ALLOWED_ROLES.includes(role as UserRole)
        ? (role as UserRole)
        : 'User'

    const passwordHash = await bcrypt.hash(password, 10)
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
      role: safeRole,
      phone: phone ? phone.trim() : '',
      twoFactorEnabled: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    await saveDriveUser(newUser)

    // Send confirmation welcome email
    await sendInviteEmail({
      to: newUser.email,
      userName: newUser.employeeName,
      role: newUser.role,
      division: newUser.division,
      position: newUser.position,
      invitedByName: 'Registrasi Mandiri Portal RIDE',
    }).catch((err) => console.error('[Register Welcome Email Error]', err))

    const token = signToken({
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
      employeeName: newUser.employeeName,
      division: newUser.division,
    })

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser._id,
        employeeName: newUser.employeeName,
        email: newUser.email,
        position: newUser.position,
        division: newUser.division,
        role: newUser.role,
        phone: newUser.phone,
        twoFactorEnabled: newUser.twoFactorEnabled,
      },
    }, { status: 201 })

    response.cookies.set('ride_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
