import { NextRequest, NextResponse } from 'next/server'
import { getDriveNotifications, markDriveNotificationsRead } from '@/lib/drive-store'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    const notifs = await getDriveNotifications(tokenUser?.userId)
    return NextResponse.json(notifs)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    await markDriveNotificationsRead(tokenUser?.userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
