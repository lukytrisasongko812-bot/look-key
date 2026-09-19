import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, saveDriveDocument, addDriveNotification } from '@/lib/drive-store'
import { sendNotificationEmail } from '@/lib/email'
import { getUserFromRequest } from '@/lib/auth'
import {
  generateDocumentTxtLog,
  syncDocumentToGoogleDrive,
  uploadFileViaGasWebhook,
  uploadOrUpdateFileInFolder,
} from '@/lib/gdrive'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const body = await request.json()
    const { file, notes, isFinal, versionTag } = body

    if (!file || !file.originalName) {
      return NextResponse.json({ error: 'File dokumen wajib diunggah.' }, { status: 400 })
    }

    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    const userRole = tokenUser?.role || 'Reviewer'
    const actorName = tokenUser?.employeeName || 'Reviewer'
    const now = new Date().toISOString()

    // Ensure Google Drive folder is provisioned
    if (!doc.driveFolderId) {
      try {
        const gdriveResult = await syncDocumentToGoogleDrive(doc)
        if (gdriveResult.folderId) {
          doc.driveFolderId = gdriveResult.folderId
          doc.driveFolderUrl = gdriveResult.folderUrl
        }
      } catch (gErr) {
        console.error('[Google Drive Folder Sync Error]', gErr)
      }
    }

    if (isFinal) {
      if (userRole !== 'Document Controller' && userRole !== 'Administrator' && userRole !== 'Director / BOD') {
        return NextResponse.json(
          { error: 'Hanya Document Controller dan Administrator yang berhak mengunggah Dokumen Final sah.' },
          { status: 403 }
        )
      }

      // 1. Final Document Upload
      let driveFileId: string | undefined
      let driveViewUrl: string | undefined

      if (file.dataUrl && file.dataUrl.includes('base64,') && doc.driveFolderId) {
        try {
          const base64Data = file.dataUrl.split('base64,')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          const uploadRes = await uploadOrUpdateFileInFolder(
            doc.driveFolderId,
            file.originalName,
            file.mimeType || 'application/pdf',
            buffer
          )
          if (uploadRes) {
            driveFileId = uploadRes.fileId
            driveViewUrl = uploadRes.webViewLink
          }
        } catch (uErr) {
          console.error('[Final Document GDrive Upload Error]', uErr)
        }
      }

      const finalDocFile = {
        originalName: file.originalName,
        filename: file.filename || file.originalName,
        size: file.size || 1000000,
        mimeType: file.mimeType || 'application/pdf',
        url: driveViewUrl || file.dataUrl || file.url || '/files/' + file.originalName,
        uploadedAt: now,
        dataUrl: file.dataUrl,
        driveFileId,
        driveViewUrl,
      }

      doc.finalDocument = finalDocFile
      doc.stage = 5 // Archived / Completed
      doc.stageStatus = 'completed'
      doc.statusLabel = 'Selesai / Dokumen Final'
      doc.revisionRequested = false

      doc.versions.push({
        version: 'FINAL',
        file: finalDocFile,
        notes: notes || 'Dokumen final bertanda tangan resmi telah diverifikasi dan diarsipkan ke Google Drive.',
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

      // Refresh audit trail txt file in Google Drive folder
      if (doc.driveFolderId) {
        const txtContent = generateDocumentTxtLog(doc)
        uploadFileViaGasWebhook(doc.driveFolderId, 'ringkasan_dan_log_dokumen.txt', txtContent).catch((e) =>
          console.error('[GAS Final Log Refresh Error]', e)
        )
      }

      await saveDriveDocument(doc)

      // Notification
      const notifTitle = `Dokumen Final Selesai: ${doc.docNumber}`
      const notifDesc = `Dokumen ${doc.docNumber} (${doc.name}) telah selesai dan dokumen final (FINAL) siap diunduh.`

      await addDriveNotification({
        userId: doc.createdBy,
        type: 'signed',
        title: notifTitle,
        description: notifDesc,
        isRead: false,
      })

      // Send email via Resend
      const recipientEmail = doc.picEmail || 'toto.rubianto.17@gmail.com'
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

      let driveFileId: string | undefined
      let driveViewUrl: string | undefined

      if (file.dataUrl && file.dataUrl.includes('base64,') && doc.driveFolderId) {
        try {
          const base64Data = file.dataUrl.split('base64,')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          const uploadRes = await uploadOrUpdateFileInFolder(
            doc.driveFolderId,
            file.originalName,
            file.mimeType || 'application/pdf',
            buffer
          )
          if (uploadRes) {
            driveFileId = uploadRes.fileId
            driveViewUrl = uploadRes.webViewLink
          }
        } catch (uErr) {
          console.error('[Revision Document GDrive Upload Error]', uErr)
        }
      }

      const revDocFile = {
        originalName: file.originalName,
        filename: file.filename || file.originalName,
        size: file.size || 1000000,
        mimeType: file.mimeType || 'application/pdf',
        url: driveViewUrl || file.dataUrl || file.url || '/files/' + file.originalName,
        uploadedAt: now,
        dataUrl: file.dataUrl,
        driveFileId,
        driveViewUrl,
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

      // Refresh audit trail txt file in Google Drive folder
      if (doc.driveFolderId) {
        const txtContent = generateDocumentTxtLog(doc)
        uploadFileViaGasWebhook(doc.driveFolderId, 'ringkasan_dan_log_dokumen.txt', txtContent).catch((e) =>
          console.error('[GAS Revision Log Refresh Error]', e)
        )
      }

      await saveDriveDocument(doc)

      // Notification
      const notifTitle = `Revisi Dokumen Diunggah: ${doc.docNumber} (${tag})`
      const notifDesc = `Versi perbaikan ${tag} untuk ${doc.docNumber} telah diunggah oleh ${actorName}.`

      await addDriveNotification({
        userId: doc.createdBy,
        type: 'revision',
        title: notifTitle,
        description: notifDesc,
        isRead: false,
      })

      // Send email via Resend
      const recipientEmail = doc.picEmail || 'toto.rubianto.17@gmail.com'
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
