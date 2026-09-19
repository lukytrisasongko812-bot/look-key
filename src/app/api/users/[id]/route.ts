import { NextRequest, NextResponse } from 'next/server'
import { getDriveUserById, saveDriveUser, deleteDriveUser } from '@/lib/drive-store'
import { getUserFromRequest } from '@/lib/auth'
import { isSystemAdmin, isBoardOfDirectors, normalizeRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)

    if (!isSystemAdmin(tokenUser?.role) && !isBoardOfDirectors(tokenUser?.role)) {
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
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
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

    if (!isSystemAdmin(tokenUser?.role) && !isBoardOfDirectors(tokenUser?.role)) {
      return NextResponse.json(
        { error: 'Hanya Administrator atau Superadmin yang berhak menghapus keanggotaan pengguna.' },
        { status: 403 }
      )
    }

    const targetUser = await getDriveUserById(id)
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    // Safeguard: Prevent deleting own active account
    if (tokenUser?.email?.toLowerCase() === targetUser.email.toLowerCase() || tokenUser?.userId === id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun Anda sendiri.' },
        { status: 400 }
      )
    }

    const ok = await deleteDriveUser(id)
    if (!ok) {
      return NextResponse.json({ error: 'Gagal menghapus pengguna dari database.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Keanggotaan ${targetUser.employeeName} (${targetUser.email}) berhasil dihapus.`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
