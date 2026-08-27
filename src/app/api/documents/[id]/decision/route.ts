import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'
import { getUserFromRequest } from '@/lib/auth'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const { type, justification, considerations } = await request.json()

    if (!type || !['renew', 'terminate'].includes(type)) {
      return NextResponse.json({ error: 'Valid decision type (renew/terminate) is required' }, { status: 400 })
    }

    if (!justification) {
      return NextResponse.json({ error: 'Justification is required' }, { status: 400 })
    }

    const doc = mongoose.Types.ObjectId.isValid(id)
      ? await DocumentModel.findById(id)
      : await DocumentModel.findOne({ docNumber: id })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    doc.decision = {
      type,
      justification,
      considerations: considerations || [],
      decidedAt: new Date(),
      decidedBy: tokenUser?.employeeName || 'Luky Pratama',
    }

    await doc.save()

    // Create notification
    await NotificationModel.create({
      userId: tokenUser?.userId,
      type: 'decision',
      title: type === 'renew' ? 'Renewal Requested' : 'Termination Requested',
      description: `${doc.docNumber} has been marked for ${type === 'renew' ? 'contract renewal' : 'termination'}.`,
    })

    return NextResponse.json({
      success: true,
      decision: doc.decision,
      document: doc,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error submitting decision'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
