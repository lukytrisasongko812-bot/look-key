import { NextRequest, NextResponse } from 'next/server'
import { getDriveUserById, saveDriveUser } from '@/lib/drive-store'
import { getUserFromRequest, signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 })
    }

    let user = await getDriveUserById(tokenUser.userId)
    if (!user && tokenUser.email) {
      user = await getDriveUserById(tokenUser.email)
    }

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      employeeName: user.employeeName,
      division: user.division,
    })

    const response = NextResponse.json({
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
        mood: user.mood,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })

    response.cookies.set('ride_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 })
    }

    const body = await request.json()
    const { employeeName, position, division, phone, twoFactorEnabled, avatarUrl, coverUrl, mood } = body

    let user = await getDriveUserById(tokenUser.userId)
    if (!user && tokenUser.email) {
      user = await getDriveUserById(tokenUser.email)
    }
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    if (employeeName && typeof employeeName === 'string') user.employeeName = employeeName.trim()
    if (position && typeof position === 'string') user.position = position.trim()
    if (division && typeof division === 'string') user.division = division.trim()
    if (phone !== undefined && typeof phone === 'string') user.phone = phone.trim()
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = Boolean(twoFactorEnabled)
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl
    if (coverUrl !== undefined) user.coverUrl = coverUrl
    if (mood !== undefined && typeof mood === 'string') user.mood = mood.trim()

    const savedUser = await saveDriveUser(user)

    const token = signToken({
      userId: savedUser._id,
      email: savedUser.email,
      role: savedUser.role,
      employeeName: savedUser.employeeName,
      division: savedUser.division,
    })

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: savedUser._id,
        employeeName: savedUser.employeeName,
        email: savedUser.email,
        position: savedUser.position,
        division: savedUser.division,
        role: savedUser.role,
        phone: savedUser.phone,
        avatarUrl: savedUser.avatarUrl,
        coverUrl: savedUser.coverUrl,
        mood: savedUser.mood,
        twoFactorEnabled: savedUser.twoFactorEnabled,
      },
    })

    response.cookies.set('ride_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
