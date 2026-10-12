import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocuments, saveDriveDocument, StoredDocument } from '@/lib/drive-store'
import { sendNotificationEmail } from '@/lib/email'
import { generateDocumentTxtLog, syncDocumentToGoogleDrive, getDocumentsFromGoogleDriveRegistry } from '@/lib/gdrive'
import { getUserFromRequest } from '@/lib/auth'
import { canUserAccessDocument, isDocumentOwnerOrPic } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const onlyMine = searchParams.get('mine') === 'true'

    let docs = await getDriveDocuments(query, status, category)

    // Terapkan Matriks Hak Akses Kewenangan & Kepemilikan Dokumen (RBAC & Ownership Security)
    if (tokenUser) {
      if (onlyMine) {
        docs = docs.filter((d) => isDocumentOwnerOrPic(tokenUser, d))
      } else {
        docs = docs.filter((d) => canUserAccessDocument(tokenUser, d))
      }
    } else {
      // Fallback untuk request internal demo/publik
      docs = docs.filter((d) => d.confidentiality === 'Internal')
    }

    return NextResponse.json(docs)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch documents'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    const body = await request.json()

    const {
      name,
      category,
      division,
      priority,
      confidentiality,
      contractStart,
      contractEnd,
      noDuration,
      notes,
      files,
      pic,
      picEmail,
      createdBy,
    } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Nama dan kategori dokumen wajib diisi.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const actorName = tokenUser?.employeeName || pic || 'Pengaju'
    const creatorEmail = tokenUser?.email || picEmail || 'support@risetrack.id'
    const creatorId = tokenUser?.userId || createdBy || tokenUser?.email || 'usr_' + Math.random().toString(36).substring(2, 8)

    const existingDocs = await getDriveDocuments()
    let driveDocs: StoredDocument[] = []
    try {
      driveDocs = await getDocumentsFromGoogleDriveRegistry()
    } catch {}
    const allKnownDocs = [...existingDocs, ...driveDocs]

    let maxNum = 149
    for (const d of allKnownDocs) {
      const match = d.docNumber?.match(/RIDE-\d{4}-(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxNum) maxNum = num
      }
    }
    let nextNum = maxNum + 1
    let docNumber = `RIDE-2026-${nextNum.toString().padStart(4, '0')}`
    while (allKnownDocs.some((d) => d.docNumber === docNumber)) {
      nextNum++
      docNumber = `RIDE-2026-${nextNum.toString().padStart(4, '0')}`
    }

    // Sanitize file records (strip heavy raw base64 if large)
    const sanitizeFile = (f: any) => {
      if (!f) return null
      const originalName = f.originalName || f.filename || 'dokumen.pdf'
      const filename = f.filename || originalName.toLowerCase().replace(/\s+/g, '_')
      const size = Number(f.size) || 0
      return {
        originalName,
        filename,
        size,
        mimeType: f.mimeType || 'application/pdf',
        url: f.url || `/files/${encodeURIComponent(filename)}`,
        uploadedAt: f.uploadedAt || now,
        dataUrl: size > 2 * 1024 * 1024 ? undefined : f.dataUrl,
        driveFileId: f.driveFileId,
        driveViewUrl: f.driveViewUrl,
      }
    }

    const initialDocFile = sanitizeFile(body.initialDocument || (files && files.length > 0 ? files[0] : null))
    const rawSupporting = body.supportingDocuments || (files && files.length > 1 ? files.slice(1) : [])
    const supportingFiles = rawSupporting.map(sanitizeFile).filter(Boolean)

    const uploadedFilesList = [
      ...(initialDocFile ? [initialDocFile] : []),
      ...supportingFiles,
    ]

    const versionsList = []
    if (initialDocFile) {
      versionsList.push({
        version: 'V0',
        file: initialDocFile,
        notes: notes || 'Pengajuan draf dokumen awal.',
        uploadedBy: actorName,
        uploadedAt: now,
        isFinal: false,
        fileType: 'initial' as const,
      })
    }

    const historyList = [
      {
        stage: 0,
        action: 'Pengajuan Dokumen Awal (V0)',
        actor: actorName,
        notes: notes || 'Dokumen berhasil diajukan ke antrean verifikasi.',
        versionTag: 'V0',
        timestamp: now,
      },
    ]

    const newDoc: StoredDocument = {
      _id: 'doc_' + Math.random().toString(36).substring(2, 9),
      docNumber,
      name,
      category,
      division: division || tokenUser?.division || 'Direktorat Umum',
      priority: priority || 'Normal',
      confidentiality: confidentiality || 'Internal',
      contractStart: noDuration ? null : contractStart ? new Date(contractStart).toISOString() : null,
      contractEnd: noDuration ? null : contractEnd ? new Date(contractEnd).toISOString() : null,
      noDuration: Boolean(noDuration),
      notes: notes || '',
      stage: 0,
      stageStatus: 'active',
      statusLabel: 'Pengajuan Baru (V0)',
      pic: actorName,
      picEmail: creatorEmail,
      revisionRequested: false,
      rejected: false,
      files: uploadedFilesList,
      initialDocument: initialDocFile,
      revisionDocuments: [],
      supportingDocuments: supportingFiles,
      finalDocument: null,
      versions: versionsList,
      history: historyList,
      driveFolderId: undefined,
      driveFolderUrl: undefined,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const gdriveResult = await syncDocumentToGoogleDrive(newDoc)
      if (gdriveResult.folderId) {
        newDoc.driveFolderId = gdriveResult.folderId
        newDoc.driveFolderUrl = gdriveResult.folderUrl
      }
    } catch (gErr) {
      console.error('[Google Drive Live Folder Creation Error]', gErr)
    }

    await saveDriveDocument(newDoc)

    // Send real email notification via Resend
    sendNotificationEmail({
      to: creatorEmail,
      userName: actorName,
      title: `Pengajuan Dokumen Baru: ${docNumber}`,
      description: `Dokumen "${name}" (${category}) berhasil didaftarkan ke portal RIDE dan masuk ke antrean Reviewer.`,
      docNumber,
    }).catch((err) => console.error('[Creation Email Failed]', err))

    return NextResponse.json(newDoc, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
