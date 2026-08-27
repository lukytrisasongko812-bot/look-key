import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { NotificationModel } from '@/models/Notification'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const tokenUser = getUserFromRequest(request)

    const filter = tokenUser?.userId
      ? { $or: [{ userId: tokenUser.userId }, { userId: null }] }
      : {}

    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)

    return NextResponse.json(notifications)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error retrieving notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    await connectToDatabase()
    await NotificationModel.updateMany({ isRead: false }, { $set: { isRead: true } })
    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
