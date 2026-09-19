import { NextRequest, NextResponse } from 'next/server'
import { initAndSeedDriveStore, getDriveDocuments, getDriveUsers } from '@/lib/drive-store'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || (user.role !== 'Administrator' && user.role !== 'Director / BOD')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Pengelolaan basis data hanya diperuntukkan bagi Administrator sesuai matriks kewenangan.' },
        { status: 403 }
      )
    }

    // Reset and seed fresh
    if (globalThis.__rideDriveStore) {
      globalThis.__rideDriveStore.isInitialized = false
    }
    await initAndSeedDriveStore()
    const docs = await getDriveDocuments()
    const users = await getDriveUsers()

    return NextResponse.json({
      success: true,
      message: 'Data berhasil di-seed ulang ke Google Drive File Store Engine!',
      documentsSeeded: docs.length,
      usersSeeded: users.length,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Seed failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
