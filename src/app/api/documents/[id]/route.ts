import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, saveDriveDocument, deleteDriveDocument } from '@/lib/drive-store'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
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
