import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, saveDriveDocument, addDriveNotification } from '@/lib/drive-store'
import { sendNotificationEmail } from '@/lib/email'
import { getUserFromRequest } from '@/lib/auth'
import { canUserProcessWorkflow } from '@/lib/roles'

export const dynamic = 'force-dynamic'

const STAGE_NAMES = [
  'Pengajuan',
  'Drafting',
  'Revisi Draft',
  'Persetujuan Legal',
  'Tanda Tangan Direksi',
  'Pengarsipan',
  'Pengingat',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const actorName = tokenUser?.employeeName || 'Reviewer'

    const { action, notes } = await request.json()

    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    // Role-based authorization for workflow transitions (Only Legal Officer, Legal Management, Admin, or BOD for Stage 4)
    if (!tokenUser || !canUserProcessWorkflow(tokenUser, doc, action)) {
      return NextResponse.json(
        { error: `Peran ${tokenUser?.role || 'Guest'} tidak memiliki wewenang untuk memproses alur "${action}" pada dokumen ini.` },
        { status: 403 }
      )
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
      timestamp: new Date().toISOString(),
    })

    await saveDriveDocument(doc)

    // Notification
    await addDriveNotification({
      userId: doc.createdBy,
      type: notifType,
      title: notifTitle,
      description: `${doc.docNumber} (${doc.name}) - ${actionLabel}`,
      isRead: false,
    })

    // Email dispatch via Resend
    const recipientEmail = doc.picEmail || 'toto.rubianto.17@gmail.com'
    await sendNotificationEmail({
      to: recipientEmail,
      userName: doc.pic || 'Tim RIDE',
      title: notifTitle,
      description: `Dokumen ${doc.docNumber} (${doc.name}) diperbarui dengan status: "${actionLabel}". Catatan: ${notes || '-'}. Dieksekusi oleh: ${actorName}.`,
      docNumber: doc.docNumber,
    }).catch((err) => console.error('[Notification Email Failed]', err))

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
