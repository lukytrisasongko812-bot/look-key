import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, saveDriveDocument, addDriveNotification } from '@/lib/drive-store'
import { sendNotificationEmail } from '@/lib/email'
import { getUserFromRequest } from '@/lib/auth'
import { canUserEditDocument, isBoardOfDirectors } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Tidak terotentikasi.' }, { status: 401 })
    }
    const actorName = tokenUser.employeeName || 'BOD / Decision Maker'

    const body = await request.json()
    const { type, justification, considerations } = body

    if (!type || !justification) {
      return NextResponse.json(
        { error: 'Tipe keputusan dan justifikasi wajib diisi.' },
        { status: 400 }
      )
    }

    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    if (!canUserEditDocument(tokenUser, doc) && !isBoardOfDirectors(tokenUser.role)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda tidak memiliki kewenangan untuk menetapkan keputusan pada dokumen ini.' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()
    doc.decision = {
      type,
      justification,
      considerations: considerations || [],
      decidedAt: now,
      decidedBy: actorName,
    }

    const actionLabel =
      type === 'renew'
        ? `Keputusan Kontrak: Diajukan Perpanjangan (Renewal) oleh ${actorName}`
        : type === 'amendment'
        ? `Keputusan Kontrak: Diajukan Adendum / Perubahan Klausul oleh ${actorName}`
        : `Keputusan Kontrak: Ditetapkan Terminasi / Selesai oleh ${actorName}`

    doc.history.push({
      stage: doc.stage,
      action: actionLabel,
      actor: actorName,
      notes: `Justifikasi: ${justification}`,
      versionTag: doc.versions?.length ? doc.versions[doc.versions.length - 1].version : 'V0',
      timestamp: now,
    })

    await saveDriveDocument(doc)

    // Notification
    await addDriveNotification({
      userId: doc.createdBy,
      type: 'decision',
      title: `Keputusan Kontrak: ${doc.docNumber}`,
      description: actionLabel,
      isRead: false,
    })

    // Email dispatch via Resend
    const recipientEmail = doc.picEmail || 'toto.rubianto.17@gmail.com'
    await sendNotificationEmail({
      to: recipientEmail,
      userName: doc.pic || 'Tim Terkait',
      title: `Keputusan Direksi atas Dokumen ${doc.docNumber}`,
      description: `Dokumen "${doc.name}" telah diputuskan statusnya: ${actionLabel}. Justifikasi: "${justification}".`,
      docNumber: doc.docNumber,
    }).catch((err) => console.error('[Decision Email Failed]', err))

    return NextResponse.json({
      success: true,
      document: doc,
      message: 'Keputusan kontrak berhasil dicatat dan disinkronkan!',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record decision'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
