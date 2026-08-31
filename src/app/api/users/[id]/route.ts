import { NextRequest, NextResponse } from 'next/server'
import { getDriveUserById, saveDriveUser, deleteDriveUser } from '@/lib/drive-store'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)

    if (tokenUser?.role !== 'Administrator' && tokenUser?.role !== 'Director / BOD') {
      return NextResponse.json(
        { error: 'Hanya Administrator yang berhak mengubah wewenang atau peran pengguna.' },
        { status: 403 }
      )
    }

    const { role, isActive, position, division } = await request.json()
    const user = await getDriveUserById(id)

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    if (role) user.role = role
    if (isActive !== undefined) user.isActive = Boolean(isActive)
    if (position) user.position = position
    if (division) user.division = division

    await saveDriveUser(user)

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        employeeName: user.employeeName,
        email: user.email,
        position: user.position,
        division: user.division,
        role: user.role,
        isActive: user.isActive,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)

    if (tokenUser?.role !== 'Administrator') {
      return NextResponse.json(
        { error: 'Hanya Administrator yang berhak menghapus akun pengguna.' },
        { status: 403 }
      )
    }

    const ok = await deleteDriveUser(id)
    if (!ok) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
