import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'
import { User } from '@/models/User'
import { sendNotificationEmail } from '@/lib/email'
import { syncDocumentToGoogleDrive } from '@/lib/gdrive'
import { getUserFromRequest } from '@/lib/auth'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

const STAGE_NAMES = [
  'Pengajuan Baru',
  'Review Kelayakan',
  'Penyusunan Draf (Drafting)',
  'Persetujuan Legal (Approval)',
  'Persetujuan Direksi (BOD Signed)',
  'Selesai & Diarsipkan',
  'Jatuh Tempo / Perpanjangan',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const actorName = tokenUser?.employeeName || 'Reviewer'

    const { action, notes } = await request.json()

    // Role-based authorization for workflow transitions
    const userRole = tokenUser?.role || 'Reviewer'
    if (userRole === 'Requester' || userRole === 'User') {
      if (['approve', 'advance', 'revision', 'reject', 'resolve_revision'].includes(action)) {
        return NextResponse.json(
          { error: `Peran ${userRole} tidak memiliki wewenang untuk aksi workflow "${action}".` },
          { status: 403 }
        )
      }
    }

    const doc = mongoose.Types.ObjectId.isValid(id)
      ? await DocumentModel.findById(id)
      : await DocumentModel.findOne({ docNumber: id })

    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    let actionLabel = ''
    let notifTitle = ''
    let notifType: 'approved' | 'revision' | 'signed' | 'reminder' | 'decision' = 'approved'

    switch (action) {
      case 'advance': {
        if (doc.stage < 6) {
          doc.stage += 1
          doc.stageStatus = doc.stage >= 5 ? 'completed' : 'active'
          doc.statusLabel = STAGE_NAMES[doc.stage]
          doc.revisionRequested = false
          doc.rejected = false
          actionLabel = `Maju ke tahap: ${STAGE_NAMES[doc.stage]}`
          notifTitle = `Tahapan Dokumen: ${STAGE_NAMES[doc.stage]}`
          notifType = doc.stage >= 5 ? 'signed' : 'approved'
        }
        break
      }
      case 'approve': {
        doc.rejected = false
        doc.revisionRequested = false
        if (doc.stage < 5) {
          doc.stage += 1
          doc.stageStatus = doc.stage >= 5 ? 'completed' : 'active'
          doc.statusLabel = STAGE_NAMES[doc.stage]
        } else {
          doc.stageStatus = 'completed'
          doc.statusLabel = 'Selesai / Dokumen Final'
        }
        actionLabel = `Disetujui oleh ${actorName}. Lanjut ke ${STAGE_NAMES[doc.stage]}`
        notifTitle = `Dokumen ${doc.docNumber} Disetujui`
        notifType = 'approved'
        break
      }
      case 'revision': {
        doc.revisionRequested = true
        doc.stageStatus = 'revision'
        doc.statusLabel = 'Perlu Revisi'
        actionLabel = `Permintaan revisi diajukan: ${notes || 'Perlu perbaikan draf dokumen'}`
        notifTitle = `Revisi Diperlukan: ${doc.docNumber}`
        notifType = 'revision'
        break
      }
      case 'resolve_revision': {
        doc.revisionRequested = false
        doc.stageStatus = 'active'
        doc.statusLabel = 'Sedang Diproses'
        actionLabel = `Revisi telah diselesaikan: ${notes || 'Draft revisi diverifikasi'}`
        notifTitle = `Revisi Selesai: ${doc.docNumber}`
        notifType = 'approved'
        break
      }
      case 'reject': {
        doc.rejected = true
        doc.stageStatus = 'rejected'
        doc.statusLabel = 'Ditolak'
        actionLabel = `Dokumen ditolak: ${notes || 'Tidak memenuhi kualifikasi'}`
        notifTitle = `Dokumen ${doc.docNumber} Ditolak`
        notifType = 'revision'
        break
      }
      default:
        return NextResponse.json({ error: 'Aksi workflow tidak valid.' }, { status: 400 })
    }

    doc.history.push({
      stage: doc.stage,
      action: actionLabel,
      actor: actorName,
      notes: notes || '',
      versionTag: doc.versions?.length ? doc.versions[doc.versions.length - 1].version : 'V0',
      timestamp: new Date(),
    })

    await doc.save()

    // Create real notification
    await NotificationModel.create({
      userId: doc.createdBy || undefined,
      type: notifType,
      title: notifTitle,
      description: `${doc.docNumber} (${doc.name}) - ${actionLabel}`,
    })

    // Real corporate email dispatch via Resend
    let recipientEmail = doc.picEmail
    if (!recipientEmail && doc.createdBy) {
      const creator = await User.findById(doc.createdBy)
      recipientEmail = creator?.email
    }
    if (!recipientEmail) {
      recipientEmail = 'toto.rubianto.17@gmail.com'
    }

    if (recipientEmail) {
      await sendNotificationEmail({
        to: recipientEmail,
        userName: doc.pic || 'Tim RIDE',
        title: notifTitle,
        description: `Dokumen ${doc.docNumber} (${doc.name}) diperbarui dengan status: "${actionLabel}". Catatan: ${notes || '-'}. Dieksekusi oleh: ${actorName}.`,
        docNumber: doc.docNumber,
      }).catch((err) => console.error('[Notification Email Failed]', err))
    }

    // Sync to Google Drive and update .txt history log
    await syncDocumentToGoogleDrive(doc).catch((err) =>
      console.error('[Google Drive Transition Sync Failed]', err)
    )

    return NextResponse.json({
      success: true,
      document: doc,
      message: actionLabel,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Workflow transition error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
