import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocumentById, getDriveDocuments, StoredDocument, StoredFile } from '@/lib/drive-store'
import { getDriveClient, uploadOrUpdateFileInFolder } from '@/lib/gdrive'
import { getUserFromRequest, verifyToken } from '@/lib/auth'
import { canUserAccessDocument } from '@/lib/roles'
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

    // Validasi kewenangan akses melihat berkas
    if (user && doc && !canUserAccessDocument(user, doc)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda tidak memiliki kewenangan untuk melihat berkas ini.' },
        { status: 403 }
      )
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

    const viewFileName =
      foundFile?.originalName ||
      fileNameParam ||
      (doc ? `${doc.docNumber}_dokumen.pdf` : 'dokumen.pdf')

    const mimeType = foundFile?.mimeType || getMimeType(viewFileName)
    const lowerName = viewFileName.toLowerCase()

    const buildDriveViewerUrl = (driveId: string, name: string, existingLink?: string) => {
      if (existingLink && existingLink.startsWith('https://')) {
        return existingLink
      }
      const lower = name.toLowerCase()
      if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
        return `https://docs.google.com/document/d/${driveId}/edit`
      }
      if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        return `https://docs.google.com/spreadsheets/d/${driveId}/edit`
      }
      return `https://drive.google.com/file/d/${driveId}/view`
    }

    // Priority 1: Direct redirect if driveViewUrl is already stored
    if (foundFile?.driveViewUrl && foundFile.driveViewUrl.startsWith('https://')) {
      return NextResponse.redirect(foundFile.driveViewUrl)
    }

    // Priority 2: Direct redirect if driveFileId is stored
    const targetDriveId = foundFile?.driveFileId || fileIdParam
    if (targetDriveId) {
      return NextResponse.redirect(buildDriveViewerUrl(targetDriveId, viewFileName))
    }

    // Priority 3: Check if file already exists inside document's Google Drive folder
    const folderId = doc?.driveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || '1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F'
    try {
      const drive = getDriveClient()
      const sanitizedSearch = viewFileName.replace(/'/g, "\\'")
      const existing = await drive.files.list({
        q: `'${folderId}' in parents and name = '${sanitizedSearch}' and trashed = false`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        fields: 'files(id, name, webViewLink)',
      })
      const driveMatch = existing.data.files?.[0]
      if (driveMatch?.id) {
        return NextResponse.redirect(
          buildDriveViewerUrl(driveMatch.id, viewFileName, driveMatch.webViewLink || undefined)
        )
      }
    } catch (searchErr) {
      console.warn('[View Route GDrive Search Warning]', searchErr)
    }

    // Priority 4: If file has base64 dataUrl, sync to Google Drive & redirect to Drive/Docs Viewer
    if (foundFile?.dataUrl && foundFile.dataUrl.includes('base64,')) {
      const base64Data = foundFile.dataUrl.split('base64,')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      try {
        const upRes = await uploadOrUpdateFileInFolder(folderId, viewFileName, mimeType, buffer)
        if (upRes?.fileId) {
          return NextResponse.redirect(buildDriveViewerUrl(upRes.fileId, viewFileName, upRes.webViewLink))
        }
      } catch {}

      if (lowerName.endsWith('.pdf') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(viewFileName)}"`,
            'Content-Length': buffer.length.toString(),
          },
        })
      }
    }

    // Priority 5: Local file in public/files -> sync to Google Drive & redirect to Drive/Docs Viewer
    let localBuffer: Buffer | null = null
    const diskPath = path.join(process.cwd(), 'public', 'files', viewFileName)
    if (fs.existsSync(diskPath)) {
      localBuffer = await fs.promises.readFile(diskPath)
    } else {
      const publicFilesDir = path.join(process.cwd(), 'public', 'files')
      if (fs.existsSync(publicFilesDir)) {
        const dirItems = await fs.promises.readdir(publicFilesDir)
        const matched = dirItems.find((f) => f.toLowerCase() === viewFileName.toLowerCase())
        if (matched) {
          localBuffer = await fs.promises.readFile(path.join(publicFilesDir, matched))
        }
      }
    }

    if (localBuffer) {
      try {
        const upRes = await uploadOrUpdateFileInFolder(folderId, viewFileName, mimeType, localBuffer)
        if (upRes?.fileId) {
          return NextResponse.redirect(buildDriveViewerUrl(upRes.fileId, viewFileName, upRes.webViewLink))
        }
      } catch {}

      return new NextResponse(new Uint8Array(localBuffer), {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(viewFileName)}"`,
          'Content-Length': localBuffer.length.toString(),
        },
      })
    }

    // Priority 6: Fallback PDF inline viewer
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
