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
import {
  normalizeRole,
  canUploadFinalDocument,
  canUploadBodSigned,
  canUploadLegalApproval,
  canUploadLegalDraft,
  isDocumentOwnerOrPic,
} from '@/lib/roles'

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
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const body = await request.json()
    const { file, notes, isFinal, versionTag, actionLabel: customActionLabel, advanceStage, fileType } = body

    if (!file || !file.originalName) {
      return NextResponse.json({ error: 'File dokumen wajib diunggah.' }, { status: 400 })
    }

    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    const userRole = normalizeRole(tokenUser?.role)
    const actorName = tokenUser?.employeeName || 'Reviewer'
    const now = new Date().toISOString()

    // Authority Verification sesuai Matriks Kewenangan
    if (isFinal) {
      if (!canUploadFinalDocument(userRole)) {
        return NextResponse.json(
          { error: 'Akses Ditolak: Hanya Legal Management, Direksi (BOD), dan Administrator yang berhak mengunggah Dokumen Final sah.' },
          { status: 403 }
        )
      }
    } else if (fileType === 'bod_signed' || versionTag?.includes('BOD')) {
      if (!canUploadBodSigned(userRole)) {
        return NextResponse.json(
          { error: 'Akses Ditolak: Hanya Board of Directors (Direksi) dan Administrator yang berhak mengunggah Dokumen Persetujuan Direksi.' },
          { status: 403 }
        )
      }
    } else if (fileType === 'legal_approval' || versionTag?.includes('Approved') || versionTag?.includes('Clearance')) {
      if (!canUploadLegalApproval(userRole)) {
        return NextResponse.json(
          { error: 'Akses Ditolak: Hanya Legal Management dan Administrator yang berhak mengunggah Persetujuan Legal.' },
          { status: 403 }
        )
      }
    } else if (fileType === 'legal_draft' || versionTag?.includes('Draft') || versionTag?.includes('Kajian') || versionTag?.includes('Review') || versionTag?.includes('Telaah')) {
      if (!canUploadLegalDraft(userRole)) {
        return NextResponse.json(
          { error: 'Akses Ditolak: Hanya Legal Officer, Legal Management, dan Administrator yang berhak mengunggah Hasil Kajian Legal / Draf Perjanjian.' },
          { status: 403 }
        )
      }
    } else {
      // General revision upload: allowed if user is Owner/PIC or has legal permissions
      const isOwner = isDocumentOwnerOrPic(tokenUser, doc)
      if (!isOwner && !canUploadLegalDraft(userRole)) {
        return NextResponse.json(
          { error: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengunggah berkas pada dokumen ini.' },
          { status: 403 }
        )
      }
    }

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

    // Upload raw base64 to Google Drive if present
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
        console.error('[Document GDrive Upload Error]', uErr)
      }
    }

    const cleanUploadedFile = {
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

    if (isFinal) {
      // 1. Final Document Upload
      doc.finalDocument = cleanUploadedFile
      doc.stage = 5 // Archived / Completed
      doc.stageStatus = 'completed'
      doc.statusLabel = 'Selesai / Dokumen Final'
      doc.revisionRequested = false
      doc.rejected = false

      doc.versions.push({
        version: 'FINAL',
        file: cleanUploadedFile,
        notes: notes || 'Dokumen final bertanda tangan resmi telah diverifikasi dan diarsipkan ke Google Drive.',
        uploadedBy: actorName,
        uploadedAt: now,
        isFinal: true,
        fileType: 'final',
      })

      doc.history.push({
        stage: 5,
        action: customActionLabel || 'Unggah Dokumen Final (FINAL)',
        actor: actorName,
        notes: notes || 'Dokumen final diunggah dan diverifikasi sah.',
        versionTag: 'FINAL',
        timestamp: now,
      })

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

      const recipientEmail = doc.picEmail || 'toto.rubianto.17@gmail.com'
      sendNotificationEmail({
        to: recipientEmail,
        userName: doc.pic || 'Tim Pengaju',
        title: notifTitle,
        description: `${notifDesc} Diunggah oleh: ${actorName}. Catatan: ${notes || '-'}`,
        docNumber: doc.docNumber,
      }).catch((e) => console.error('[Final Email Error]', e))

      return NextResponse.json({
        success: true,
        document: doc,
        message: 'Dokumen final resmi berhasil diunggah!',
      })
    } else {
      // 2. Revision / Production Draft / Approval Sheet Upload
      const currentRevCount = (doc.revisionDocuments?.length || 0) + 1
      const tag = versionTag || `Rev.${currentRevCount.toString().padStart(2, '0')}`
      const resolvedFileType = (fileType as any) || 'revision'

      const versionEntry = {
        version: tag,
        file: cleanUploadedFile,
        notes: notes || `Pembaruan berkas dokumen versi ${tag}`,
        uploadedBy: actorName,
        uploadedAt: now,
        isFinal: false,
        fileType: resolvedFileType,
      }

      doc.revisionDocuments.push(versionEntry)
      doc.versions.push(versionEntry)
      doc.revisionRequested = false
      doc.rejected = false

      if (advanceStage && doc.stage < 5) {
        doc.stage += 1
        doc.stageStatus = doc.stage >= 5 ? 'completed' : 'active'
        doc.statusLabel = STAGE_NAMES[doc.stage]
      } else {
        doc.stageStatus = 'active'
        doc.statusLabel = `${STAGE_NAMES[doc.stage]} (${tag})`
      }

      const actionTitle = customActionLabel || `Unggah Berkas Dokumen (${tag})`

      doc.history.push({
        stage: doc.stage,
        action: actionTitle,
        actor: actorName,
        notes: notes || `Versi ${tag} diunggah oleh ${actorName}.`,
        versionTag: tag,
        timestamp: now,
      })

      if (doc.driveFolderId) {
        const txtContent = generateDocumentTxtLog(doc)
        uploadFileViaGasWebhook(doc.driveFolderId, 'ringkasan_dan_log_dokumen.txt', txtContent).catch((e) =>
          console.error('[GAS Revision Log Refresh Error]', e)
        )
      }

      await saveDriveDocument(doc)

      // Notification
      const notifTitle = `Pembaruan Berkas: ${doc.docNumber} (${tag})`
      const notifDesc = `Versi ${tag} untuk ${doc.docNumber} telah diunggah oleh ${actorName}.`

      await addDriveNotification({
        userId: doc.createdBy,
        type: 'revision',
        title: notifTitle,
        description: notifDesc,
        isRead: false,
      })

      const recipientEmail = doc.picEmail || 'toto.rubianto.17@gmail.com'
      sendNotificationEmail({
        to: recipientEmail,
        userName: doc.pic || 'Tim Terkait',
        title: notifTitle,
        description: `${notifDesc} Tindakan: "${actionTitle}". Catatan: "${notes || '-'}"`,
        docNumber: doc.docNumber,
      }).catch((e) => console.error('[Revision Email Error]', e))

      return NextResponse.json({
        success: true,
        document: doc,
        message: `Berkas ${tag} berhasil diunggah dan disimpan ke sistem!`,
      })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error uploading version'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
