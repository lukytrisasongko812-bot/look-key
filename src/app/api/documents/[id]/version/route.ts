import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'
import { User } from '@/models/User'
import { sendNotificationEmail } from '@/lib/email'
import { getUserFromRequest } from '@/lib/auth'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const body = await request.json()
    const { file, notes, isFinal, versionTag } = body

    if (!file || !file.originalName) {
      return NextResponse.json({ error: 'File dokumen wajib diunggah.' }, { status: 400 })
    }

    const doc = mongoose.Types.ObjectId.isValid(id)
      ? await DocumentModel.findById(id)
      : await DocumentModel.findOne({ docNumber: id })

    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    const actorName = tokenUser?.employeeName || 'Reviewer'
    const now = new Date()

    if (isFinal) {
      // 1. Final Document Upload
      const finalDocFile = {
        originalName: file.originalName,
        filename: file.filename || file.originalName,
        size: file.size || 1000000,
        mimeType: file.mimeType || 'application/pdf',
        url: file.url || '/files/' + file.originalName,
        uploadedAt: now,
      }

      doc.finalDocument = finalDocFile
      doc.stage = 5 // Archived / Completed
      doc.stageStatus = 'completed'
      doc.statusLabel = 'Selesai / Dokumen Final'
      doc.revisionRequested = false

      doc.versions.push({
        version: 'FINAL',
        file: finalDocFile,
        notes: notes || 'Dokumen final bertanda tangan resmi telah diverifikasi dan diarsipkan.',
        uploadedBy: actorName,
        uploadedAt: now,
        isFinal: true,
        fileType: 'final',
      })

      doc.history.push({
        stage: 5,
        action: 'Unggah Dokumen Final (FINAL)',
        actor: actorName,
        notes: notes || 'Dokumen final diunggah dan diverifikasi sah.',
        versionTag: 'FINAL',
        timestamp: now,
      })

      await doc.save()

      // Create notification
      const notifTitle = `Dokumen Final Selesai: ${doc.docNumber}`
      const notifDesc = `Dokumen ${doc.docNumber} (${doc.name}) telah selesai dan dokumen final (FINAL) siap diunduh.`

      await NotificationModel.create({
        userId: doc.createdBy || undefined,
        type: 'signed',
        title: notifTitle,
        description: notifDesc,
      })

      // Send email via Resend
      let recipientEmail = doc.picEmail
      if (!recipientEmail && doc.createdBy) {
        const creator = await User.findById(doc.createdBy)
        recipientEmail = creator?.email
      }
      if (!recipientEmail) recipientEmail = 'toto.rubianto.17@gmail.com'

      await sendNotificationEmail({
        to: recipientEmail,
        userName: doc.pic || 'Tim Pengaju',
        title: notifTitle,
        description: `${notifDesc} Diunggah oleh: ${actorName}. Catatan: ${notes || '-'}`,
        docNumber: doc.docNumber,
      }).catch((e) => console.error('[Final Email Error]', e))

      return NextResponse.json({
        success: true,
        document: doc,
        message: 'Dokumen final berhasil diunggah!',
      })
    } else {
      // 2. Revision Document Upload
      const currentRevCount = (doc.revisionDocuments?.length || 0) + 1
      const tag = versionTag || `Rev.${currentRevCount.toString().padStart(2, '0')}`

      const revDocFile = {
        originalName: file.originalName,
        filename: file.filename || file.originalName,
        size: file.size || 1000000,
        mimeType: file.mimeType || 'application/pdf',
        url: file.url || '/files/' + file.originalName,
        uploadedAt: now,
      }

      const versionEntry = {
        version: tag,
        file: revDocFile,
        notes: notes || `Perbaikan draf dokumen versi ${tag}`,
        uploadedBy: actorName,
        uploadedAt: now,
        isFinal: false,
        fileType: 'revision' as const,
      }

      doc.revisionDocuments.push(versionEntry)
      doc.versions.push(versionEntry)
      doc.revisionRequested = false
      doc.stageStatus = 'active'
      doc.statusLabel = `Sedang Diproses (${tag})`

      doc.history.push({
        stage: doc.stage,
        action: `Unggah Revisi Dokumen (${tag})`,
        actor: actorName,
        notes: notes || `Revisi ${tag} diunggah.`,
        versionTag: tag,
        timestamp: now,
      })

      await doc.save()

      // Create notification
      const notifTitle = `Revisi Dokumen Diunggah: ${doc.docNumber} (${tag})`
      const notifDesc = `Versi perbaikan ${tag} untuk ${doc.docNumber} telah diunggah oleh ${actorName}.`

      await NotificationModel.create({
        userId: doc.createdBy || undefined,
        type: 'revision',
        title: notifTitle,
        description: notifDesc,
      })

      // Send email via Resend
      let recipientEmail = doc.picEmail
      if (!recipientEmail && doc.createdBy) {
        const creator = await User.findById(doc.createdBy)
        recipientEmail = creator?.email
      }
      if (!recipientEmail) recipientEmail = 'toto.rubianto.17@gmail.com'

      await sendNotificationEmail({
        to: recipientEmail,
        userName: doc.pic || 'Tim Reviewer',
        title: notifTitle,
        description: `${notifDesc} Catatan perbaikan: "${notes || '-'}"`,
        docNumber: doc.docNumber,
      }).catch((e) => console.error('[Revision Email Error]', e))

      return NextResponse.json({
        success: true,
        document: doc,
        message: `Dokumen revisi ${tag} berhasil diunggah!`,
      })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error uploading version'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
