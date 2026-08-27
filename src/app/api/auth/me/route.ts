import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { getUserFromRequest } from '@/lib/auth'
import { LoginHistoryModel } from '@/models/LoginHistory'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(tokenUser.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const logins = await LoginHistoryModel.find({
      $or: [{ userId: user._id }, { email: user.email }],
    })
      .sort({ createdAt: -1 })
      .limit(10)

    return NextResponse.json({
      user: {
        id: user._id,
        employeeName: user.employeeName,
        email: user.email,
        position: user.position,
        division: user.division,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      loginHistory: logins,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(tokenUser.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    if (body.employeeName !== undefined) user.employeeName = body.employeeName
    if (body.position !== undefined) user.position = body.position
    if (body.division !== undefined) user.division = body.division
    if (body.phone !== undefined) user.phone = body.phone
    if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl
    if (body.role !== undefined) user.role = body.role
    if (body.twoFactorEnabled !== undefined) user.twoFactorEnabled = body.twoFactorEnabled

    await user.save()

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        employeeName: user.employeeName,
        email: user.email,
        position: user.position,
        division: user.division,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
