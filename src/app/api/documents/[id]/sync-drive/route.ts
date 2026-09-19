import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, saveDriveDocument } from '@/lib/drive-store'
import { generateDocumentTxtLog, syncDocumentToGoogleDrive } from '@/lib/gdrive'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    const gdriveResult = await syncDocumentToGoogleDrive(doc)
    if (gdriveResult.folderId) {
      doc.driveFolderId = gdriveResult.folderId
      doc.driveFolderUrl = gdriveResult.folderUrl
    }
    await saveDriveDocument(doc)

    const txtLog = generateDocumentTxtLog(doc as any)

    return NextResponse.json({
      success: true,
      folderId: doc.driveFolderId,
      folderUrl: doc.driveFolderUrl,
      isLive: true,
      message: 'Folder Google Drive & seluruh berkas dokumen berhasil disinkronkan langsung!',
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
    const { id } = await params
    const doc = await getDriveDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 })
    }

    const txtLog = generateDocumentTxtLog(doc as any)

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
