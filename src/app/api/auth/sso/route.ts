import { NextRequest, NextResponse } from 'next/server'
import { getDriveUserByEmail } from '@/lib/drive-store'
import { signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email SSO wajib diisi.' }, { status: 400 })
    }

    const user = await getDriveUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'Akun Google Workspace perusahaan belum terdaftar dalam sistem RIDE.' },
        { status: 403 }
      )
    }

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
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SSO Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
