import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Akses ditolak. Sesi tidak sah.' }, { status: 401 })
    }

    if (tokenUser.role !== 'Administrator' && tokenUser.role !== 'Director / BOD') {
      return NextResponse.json({ error: 'Hanya Administrator yang memiliki izin mengubah data atau peran pengguna.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (body.role !== undefined) user.role = body.role
    if (body.position !== undefined) user.position = body.position
    if (body.division !== undefined) user.division = body.division
    if (body.employeeName !== undefined) user.employeeName = body.employeeName

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
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
