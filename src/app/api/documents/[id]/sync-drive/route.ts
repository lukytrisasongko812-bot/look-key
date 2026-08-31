import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import { syncDocumentToGoogleDrive, generateDocumentTxtLog } from '@/lib/gdrive'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    const doc = await DocumentModel.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    const syncResult = await syncDocumentToGoogleDrive(doc)
    const txtLog = generateDocumentTxtLog(doc)

    return NextResponse.json({
      success: true,
      folderId: syncResult.folderId,
      folderUrl: syncResult.folderUrl,
      isLive: syncResult.isLive,
      message: syncResult.message,
      txtLog,
      docNumber: doc.docNumber,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Gagal sinkronisasi Google Drive'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    const doc = await DocumentModel.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    const txtLog = generateDocumentTxtLog(doc)

    return new NextResponse(txtLog, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${doc.docNumber}_log_riwayat.txt"`,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Gagal mengekspor log teks'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
