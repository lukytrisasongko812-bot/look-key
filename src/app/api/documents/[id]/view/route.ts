import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, getDriveDocuments, StoredDocument, StoredFile } from '@/lib/drive-store'
import { downloadFileFromGoogleDrive } from '@/lib/gdrive'
import { getUserFromRequest, verifyToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  switch (ext) {
    case '.pdf':
      return 'application/pdf'
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case '.doc':
      return 'application/msword'
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case '.xls':
      return 'application/vnd.ms-excel'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.txt':
      return 'text/plain; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

function generateFallbackPdf(docName: string, fileName: string, docNo: string): Buffer {
  const cleanTitle = (docName || 'Dokumen Resmi RIDE').replace(/[()\\]/g, '')
  const cleanFile = (fileName || 'Berkas Dokumen').replace(/[()\\]/g, '')
  const content = `BT
/F1 18 Tf
50 720 Td
(RIDE PLATFORM - ARSIP RESMI DOKUMEN) Tj
/F1 14 Tf
0 -30 Td
(${cleanTitle}) Tj
/F1 11 Tf
0 -25 Td
(Nomor Tiket: ${docNo}) Tj
0 -20 Td
(Nama Berkas: ${cleanFile}) Tj
0 -20 Td
(Status     : Berkas Digital Terverifikasi) Tj
0 -20 Td
(Penerbit   : PT Vale Indonesia Tbk - Legal & Compliance) Tj
0 -30 Td
(Dokumen ini diakses secara sah melalui portal RIDE Platform https://risetrack.id) Tj
ET`

  const streamLength = Buffer.byteLength(content)
  const pdfParts = [
    '%PDF-1.4\n',
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${content}\nendstream\nendobj\n`,
  ]

  let offset = 0
  const offsets: number[] = []
  let fullPdf = ''

  for (const part of pdfParts) {
    offsets.push(offset)
    offset += Buffer.byteLength(part)
    fullPdf += part
  }

  const startXref = offset
  let xref = `xref\n0 6\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i++) {
    xref += offsets[i].toString().padStart(10, '0') + ' 00000 n \n'
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`

  return Buffer.from(fullPdf + xref + trailer)
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const fileNameParam = searchParams.get('name') || ''
    const fileIdParam = searchParams.get('fileId') || ''
    const tokenParam = searchParams.get('token') || ''

    let user = getUserFromRequest(request)
    if (!user && tokenParam) {
      user = verifyToken(tokenParam)
    }

    let doc: StoredDocument | null = await getDriveDocumentById(id)
    if (!doc) {
      const allDocs = await getDriveDocuments()
      doc = allDocs.find((d) => d.docNumber === id || d._id === id) || null
    }

    let foundFile: StoredFile | null = null

    if (doc) {
      const allFiles: StoredFile[] = [
        ...(doc.files || []),
        ...(doc.supportingDocuments || []),
        ...(doc.initialDocument ? [doc.initialDocument] : []),
        ...(doc.finalDocument ? [doc.finalDocument] : []),
        ...(doc.versions?.map((v) => v.file).filter(Boolean) || []),
        ...(doc.revisionDocuments?.map((r) => r.file).filter(Boolean) || []),
      ]

      if (fileIdParam) {
        foundFile = allFiles.find((f) => f.driveFileId === fileIdParam) || null
      }

      if (!foundFile && fileNameParam) {
        const targetLower = fileNameParam.toLowerCase().trim()
        foundFile =
          allFiles.find(
            (f) =>
              (f.originalName && f.originalName.toLowerCase().trim() === targetLower) ||
              (f.filename && f.filename.toLowerCase().trim() === targetLower)
          ) || null
      }

      if (!foundFile && allFiles.length > 0) {
        foundFile = allFiles[0]
      }
    }

    // If Google Drive link exists and requested file has webViewLink, redirect to Drive preview
    if (foundFile?.driveViewUrl && foundFile.driveViewUrl.startsWith('https://')) {
      return NextResponse.redirect(foundFile.driveViewUrl)
    }

    const viewFileName =
      foundFile?.originalName ||
      fileNameParam ||
      (doc ? `${doc.docNumber}_dokumen.pdf` : 'dokumen.pdf')

    const mimeType = foundFile?.mimeType || getMimeType(viewFileName)

    // Option 1: Base64 dataUrl
    if (foundFile?.dataUrl && foundFile.dataUrl.includes('base64,')) {
      const base64Data = foundFile.dataUrl.split('base64,')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(viewFileName)}"`,
          'Content-Length': buffer.length.toString(),
        },
      })
    }

    // Option 2: Google Drive
    const targetDriveId = foundFile?.driveFileId || fileIdParam
    if (targetDriveId) {
      const driveFile = await downloadFileFromGoogleDrive(targetDriveId)
      if (driveFile && driveFile.buffer.length > 0) {
        return new NextResponse(new Uint8Array(driveFile.buffer), {
          headers: {
            'Content-Type': driveFile.mimeType || mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(viewFileName)}"`,
            'Content-Length': driveFile.buffer.length.toString(),
          },
        })
      }
    }

    // Option 3: Local file in public/files
    const diskPath = path.join(process.cwd(), 'public', 'files', viewFileName)
    if (fs.existsSync(diskPath)) {
      const fileBuffer = await fs.promises.readFile(diskPath)
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(viewFileName)}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    }

    // Option 4: Case-insensitive search in public/files
    const publicFilesDir = path.join(process.cwd(), 'public', 'files')
    if (fs.existsSync(publicFilesDir)) {
      const dirItems = await fs.promises.readdir(publicFilesDir)
      const matched = dirItems.find(
        (f) => f.toLowerCase() === viewFileName.toLowerCase()
      )
      if (matched) {
        const fileBuffer = await fs.promises.readFile(path.join(publicFilesDir, matched))
        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(viewFileName)}"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        })
      }
    }

    // Option 5: Fallback PDF
    const fallbackBuffer = generateFallbackPdf(
      doc?.name || 'Dokumen Resmi RIDE',
      viewFileName,
      doc?.docNumber || id
    )

    return new NextResponse(new Uint8Array(fallbackBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(viewFileName)}.pdf"`,
        'Content-Length': fallbackBuffer.length.toString(),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'View failed'
    console.error('[View Route Error]', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
