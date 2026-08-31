import { NextResponse } from 'next/server'
import { getDriveDocuments, getDriveUsers } from '@/lib/drive-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const docs = await getDriveDocuments()
    const users = await getDriveUsers()

    return NextResponse.json({
      status: 'healthy',
      engine: 'Google Drive File Store Engine',
      storage: 'Google Drive (.txt / folder sync)',
      documentsCount: docs.length,
      usersCount: users.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unhealthy'
    return NextResponse.json({ status: 'unhealthy', error: msg }, { status: 500 })
  }
}
