import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, saveDriveDocument } from '@/lib/drive-store'
import { getUserFromRequest } from '@/lib/auth'
import { canUserAccessDocument } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    if (!tokenUser) {
      return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 })
    }

    const body = await request.json()
    const { h60, h30, h15, h7, h1, customNotes } = body

    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    if (!canUserAccessDocument(tokenUser, doc)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda tidak memiliki kewenangan untuk mengubah pengingat dokumen ini.' },
        { status: 403 }
      )
    }

    doc.reminders = {
      h60: h60 ?? doc.reminders?.h60 ?? true,
      h30: h30 ?? doc.reminders?.h30 ?? true,
      h15: h15 ?? doc.reminders?.h15 ?? true,
      h7: h7 ?? doc.reminders?.h7 ?? true,
      h1: h1 ?? doc.reminders?.h1 ?? true,
      customNotes: customNotes !== undefined ? customNotes : (doc.reminders?.customNotes || ''),
      lastSentMilestone: doc.reminders?.lastSentMilestone,
    }

    await saveDriveDocument(doc)

    return NextResponse.json({
      success: true,
      reminders: doc.reminders,
      message: 'Pengaturan pengingat jatuh tempo kontrak berhasil disimpan!',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan pengingat'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
