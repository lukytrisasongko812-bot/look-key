import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'
import { getUserFromRequest } from '@/lib/auth'
import mongoose from 'mongoose'

const STAGE_NAMES = [
  'Submitted',
  'Review',
  'Legal Drafting',
  'Legal Approval',
  'BOD Approval / Signed',
  'Archived',
  'Expired / Renewal',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const actorName = tokenUser?.employeeName || 'Staff Legal'

    const { action, notes } = await request.json()

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
          doc.stageStatus = doc.stage === 5 || doc.stage === 6 ? 'completed' : 'active'
          doc.revisionRequested = false
          doc.rejected = false
          actionLabel = `Maju ke tahap: ${STAGE_NAMES[doc.stage]}`
          notifTitle = `Tahapan Baru: ${STAGE_NAMES[doc.stage]}`
          notifType = doc.stage >= 5 ? 'signed' : 'approved'
        }
        break
      }
      case 'approve': {
        doc.rejected = false
        doc.revisionRequested = false
        if (doc.stage < 5) {
          doc.stage += 1
          doc.stageStatus = doc.stage === 5 ? 'completed' : 'active'
        } else {
          doc.stageStatus = 'completed'
        }
        actionLabel = `Disetujui oleh ${actorName}. Lanjut ke ${STAGE_NAMES[doc.stage]}`
        notifTitle = `Dokumen ${doc.docNumber} Disetujui`
        notifType = 'approved'
        break
      }
      case 'revision': {
        doc.revisionRequested = true
        doc.stageStatus = 'revision'
        actionLabel = `Permintaan revisi diajukan: ${notes || 'Lengkapi dokumen pendukung'}`
        notifTitle = `Revisi Diperlukan untuk ${doc.docNumber}`
        notifType = 'revision'
        break
      }
      case 'resolve_revision': {
        doc.revisionRequested = false
        doc.stageStatus = 'active'
        actionLabel = `Revisi telah diperbaiki oleh pemohon: ${notes || 'Draft revisi diunggah'}`
        notifTitle = `Revisi Selesai: ${doc.docNumber}`
        notifType = 'approved'
        break
      }
      case 'reject': {
        doc.rejected = true
        doc.stageStatus = 'rejected'
        actionLabel = `Dokumen ditolak: ${notes || 'Tidak memenuhi kualifikasi legal'}`
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
      timestamp: new Date(),
    })

    await doc.save()

    // Create real notification in MongoDB
    await NotificationModel.create({
      userId: doc.createdBy,
      type: notifType,
      title: notifTitle,
      description: `${doc.docNumber} (${doc.name}) - ${actionLabel}`,
    })

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
