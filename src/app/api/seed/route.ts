import { NextResponse } from 'next/server'
import { initAndSeedDriveStore, getDriveDocuments, getDriveUsers } from '@/lib/drive-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
