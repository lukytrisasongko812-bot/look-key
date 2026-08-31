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
    const tokenUser = getUserFromRequest(request)
    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    // Role-based access control: Requester can strictly only view their own document
    if (tokenUser && tokenUser.role === 'Requester') {
      const userEmail = tokenUser.email.toLowerCase()
      const userId = tokenUser.userId
      const userName = tokenUser.employeeName?.toLowerCase() || ''
      const isOwner =
        doc.createdBy === userId ||
        (doc.picEmail && doc.picEmail.toLowerCase() === userEmail) ||
        (doc.pic && doc.pic.toLowerCase() === userName)

      if (!isOwner) {
        return NextResponse.json(
          { error: 'Akses ditolak. Sebagai Requester Anda hanya dapat melihat dokumen milik Anda sendiri.' },
          { status: 403 }
        )
      }
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
