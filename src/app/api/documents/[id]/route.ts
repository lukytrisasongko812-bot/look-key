import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, saveDriveDocument, deleteDriveDocument } from '@/lib/drive-store'
import { getUserFromRequest } from '@/lib/auth'
import {
  canUserAccessDocument,
  canUserEditDocument,
  canUserDeleteDocument,
} from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    // Periksa kewenangan akses berdasarkan Role & PIC Pemohon
    if (!tokenUser || !canUserAccessDocument(tokenUser, doc)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda tidak memiliki kewenangan untuk melihat dokumen ini.' },
        { status: 403 }
      )
    }

    return NextResponse.json(doc)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const updates = await request.json()

    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    if (!tokenUser || !canUserEditDocument(tokenUser, doc)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Legal Officer, Legal Management, System Administrator, atau Pemilik Pengajuan awal yang dapat memperbarui dokumen ini.' },
        { status: 403 }
      )
    }

    const updated = {
      ...doc,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await saveDriveDocument(updated)
    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenUser = getUserFromRequest(request)
    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    if (!tokenUser || !canUserDeleteDocument(tokenUser, doc)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Administrator, Legal Management, atau Pemilik Pengajuan tahap awal yang dapat menghapus dokumen ini.' },
        { status: 403 }
      )
    }

    const ok = await deleteDriveDocument(id)
    if (!ok) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
