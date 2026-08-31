import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'
import { User } from '@/models/User'
import { sendNotificationEmail } from '@/lib/email'
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
    const userRole = tokenUser?.role || 'Reviewer'

    if (userRole === 'Requester' || userRole === 'User') {
      return NextResponse.json(
        { error: 'Requester tidak memiliki wewenang untuk menetapkan keputusan perpanjangan/terminasi kontrak.' },
        { status: 403 }
      )
    }

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

    const decisionTitle = type === 'renew' ? 'Keputusan Perpanjangan Kontrak' : 'Keputusan Terminasi Kontrak'
    const decisionDesc = `${doc.docNumber} (${doc.name}) ditetapkan: ${type === 'renew' ? 'PERPANJANGAN (RENEW)' : 'TERMINASI (TERMINATE)'}. Catatan: ${justification}`

    // Create notification
    await NotificationModel.create({
      userId: doc.createdBy || undefined,
      type: 'decision',
      title: decisionTitle,
      description: decisionDesc,
    })

    // Dispatch real email via Resend
    let targetEmail = doc.picEmail
    if (!targetEmail && doc.createdBy) {
      const creator = await User.findById(doc.createdBy)
      targetEmail = creator?.email
    }
    if (!targetEmail) {
      targetEmail = 'toto.rubianto.17@gmail.com'
    }

    if (targetEmail) {
      await sendNotificationEmail({
        to: targetEmail,
        userName: doc.pic || 'Tim Legal & Direksi',
        title: decisionTitle,
        description: decisionDesc,
        docNumber: doc.docNumber,
      }).catch((err) => console.error('[Decision Email Failed]', err))
    }

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
